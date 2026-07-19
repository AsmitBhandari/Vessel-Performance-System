import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.connection import Base

class ChatMessage(Base):
    """
    Individual message entry within a ChatSession thread. Can be role 'user' or 'assistant'.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    vessel_id = Column(Integer, ForeignKey("vessels.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    vessel = relationship("Vessel")

    def __repr__(self):
        return f"<ChatMessage id={self.id} session_id={self.session_id} role={self.role!r}>"
