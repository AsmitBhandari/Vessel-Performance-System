import datetime

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Vessel(Base):
    """Vessel registry table. One row per unique vessel."""

    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vessel_name = Column(String(255), unique=True, nullable=False, index=True)
    technical_manager = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships. 
    voyages = relationship("Voyage", back_populates="vessel", lazy="dynamic")
    reports = relationship("DailyReport", back_populates="vessel", lazy="dynamic")

    def __repr__(self):
        return f"<Vessel id={self.id} name={self.vessel_name!r}>"
