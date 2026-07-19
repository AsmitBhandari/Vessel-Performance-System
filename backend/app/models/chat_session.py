import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.connection import Base

class ChatSession(Base):
    """
    Groups a sequence of user-assistant messages into a single chat conversation thread.
    """
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), nullable=False, index=True)  # Matches Supabase UUID string
    title = Column(String(500), nullable=False, default="New conversation")
    vessel_id = Column(Integer, ForeignKey("vessels.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="joined"
    )
    vessel = relationship("Vessel")

    def __repr__(self):
        return f"<ChatSession id={self.id} user_id={self.user_id} title={self.title!r}>"
