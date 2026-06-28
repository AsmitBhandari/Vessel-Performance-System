import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Port(Base):
    """Port registry — major commercial ports used in route planning."""

    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    country = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    code = Column(String(20), nullable=True, doc="UN/LOCODE or similar port code")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships. 
    origin_routes = relationship(
        "HistoricalRoute",
        foreign_keys="HistoricalRoute.origin_port_id",
        back_populates="origin_port",
        lazy="dynamic",
    )
    destination_routes = relationship(
        "HistoricalRoute",
        foreign_keys="HistoricalRoute.destination_port_id",
        back_populates="destination_port",
        lazy="dynamic",
    )

    def __repr__(self):
        return f"<Port id={self.id} name={self.name!r} code={self.code!r}>"
