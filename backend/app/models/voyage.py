import datetime

from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Voyage(Base):
    """
    Minimal voyage table — future-extensible.

    Voyages are not auto-detected yet. This table exists so that
    daily reports can optionally be grouped under a voyage_id once
    voyage detection or manual assignment is implemented in a later phase.
    """

    __tablename__ = "voyages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vessel_id = Column(Integer, ForeignKey("vessels.id"), nullable=False, index=True)
    voyage_number = Column(String(100), nullable=True)
    departure_port = Column(String(255), nullable=True)
    arrival_port = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships
    vessel = relationship("Vessel", back_populates="voyages")
    reports = relationship("DailyReport", back_populates="voyage", lazy="dynamic")

    def __repr__(self):
        return f"<Voyage id={self.id} vessel_id={self.vessel_id} number={self.voyage_number!r}>"
