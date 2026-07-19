import json
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.database.connection import get_db
from app.api.deps import get_current_user, UserInfo
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.services.chat_service import detect_intent, build_data_context, get_llm_provider, SYSTEM_PROMPT

router = APIRouter(prefix="/api/chat", tags=["AI Chat Assistant"])


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Create a new chat session for the authenticated user.
    """
    title = payload.get("title", "New conversation")
    vessel_id = payload.get("vesselId")
    
    session = ChatSession(
        user_id=current_user.id,
        title=title,
        vessel_id=vessel_id
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "success": True,
        "data": {
            "id": session.id,
            "title": session.title,
            "vesselId": session.vessel_id,
            "createdAt": session.created_at.isoformat(),
            "updatedAt": session.updated_at.isoformat()
        }
    }


@router.get("/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    List all chat sessions belonging to the authenticated user.
    """
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    
    data = []
    for s in sessions:
        data.append({
            "id": s.id,
            "title": s.title,
            "vesselId": s.vessel_id,
            "createdAt": s.created_at.isoformat(),
            "updatedAt": s.updated_at.isoformat()
        })
        
    return {"success": True, "data": data}


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Delete a chat session and all its associated messages.
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied."
        )
        
    db.delete(session)
    db.commit()
    return {"success": True, "message": "Chat session deleted successfully."}


@router.get("/sessions/{session_id}/messages")
def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Get all messages for a specific chat session.
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied."
        )
        
    messages = []
    for m in session.messages:
        messages.append({
            "id": m.id,
            "sessionId": m.session_id,
            "role": m.role,
            "content": m.content,
            "vesselId": m.vessel_id,
            "createdAt": m.created_at.isoformat()
        })
        
    return {"success": True, "data": messages}


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Send a message to a session and get a streamed AI assistant response (Server-Sent Events).
    """
    # 1. Verify session exists and belongs to the user
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied."
        )
        
    content = payload.get("content", "").strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    # 2. Extract context vessel (vessel_id)
    # Can be overridden in message payload, otherwise inherits from session
    vessel_id = payload.get("vesselId") or session.vessel_id

    # 3. Detect intent (vessel, dates, metrics) and retrieve structured context
    intent = detect_intent(db, content, session_vessel_id=vessel_id)
    context_data = build_data_context(db, intent)

    # If the user matched a different vessel in their question, we can update the message vessel context
    message_vessel_id = intent.vessel_id or vessel_id

    # 4. Save the user message to database
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=content,
        vessel_id=message_vessel_id
    )
    db.add(user_msg)
    
    # Auto-title if session has default title
    if session.title == "New conversation":
        # Extract first 40 chars of user message as title
        trimmed_content = content[:40] + ("..." if len(content) > 40 else "")
        session.title = trimmed_content
        
    db.commit()

    # 5. Fetch recent chat history for context (last 10 messages)
    history_msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    
    # Exclude the user's latest message from history since we send it as current prompt, 
    # but include up to 10 previous turns
    history = []
    for m in history_msgs[:-1]:
        history.append({"role": m.role, "content": m.content})
    
    # Append the user's latest question to history
    history.append({"role": "user", "content": content})

    # 6. Stream generator
    async def sse_generator():
        # First send information event containing metadata about data retrieval
        meta_info = {
            "vesselId": intent.vessel_id,
            "startDate": intent.start_date.isoformat() if intent.start_date else None,
            "endDate": intent.end_date.isoformat() if intent.end_date else None,
            "tools": intent.tools
        }
        yield {
            "event": "info",
            "data": json.dumps(meta_info)
        }
        
        full_response = []
        try:
            provider = get_llm_provider()
            stream = provider.generate_stream(SYSTEM_PROMPT, history, context_data)
            
            async for chunk in stream:
                full_response.append(chunk)
                yield {
                    "event": "chunk",
                    "data": chunk
                }
                # Yield control to event loop
                await asyncio.sleep(0.001)
                
        except Exception as e:
            yield {
                "event": "error",
                "data": f"Error generating response: {str(e)}"
            }
            return

        # 7. Save Assistant message to DB upon successful completion
        assistant_content = "".join(full_response)
        if assistant_content:
            # Open a new DB session for async thread compatibility
            # because SSE generator runs inside a different thread/context
            from app.database.connection import SessionLocal
            db_sync = SessionLocal()
            try:
                assistant_msg = ChatMessage(
                    session_id=session_id,
                    role="assistant",
                    content=assistant_content,
                    vessel_id=message_vessel_id
                )
                db_sync.add(assistant_msg)
                
                # Update session updatedAt time
                import datetime
                sess = db_sync.query(ChatSession).filter(ChatSession.id == session_id).first()
                if sess:
                    sess.updated_at = datetime.datetime.utcnow()
                    
                db_sync.commit()
            except Exception as e:
                print(f"[SSE Error] Failed to save assistant message: {e}")
                db_sync.rollback()
            finally:
                db_sync.close()

        yield {
            "event": "done",
            "data": ""
        }

    return EventSourceResponse(
        sse_generator(),
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
