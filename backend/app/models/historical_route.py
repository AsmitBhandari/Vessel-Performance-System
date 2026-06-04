import datetime

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database.connection import Base


class HistoricalRoute(Base):
    """
    Historical shipping route between two ports.

    Distances represent actual historical shipping route distances,
    NOT straight-line or haversine calculations. Routes may include
    canal passages, traffic separation schemes, and established
    shipping lane distances.
    """

    __tablename__ = "historical_routes"
    __table_args__ = (
        Index("ix_route_origin_dest", "origin_port_id", "destination_port_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    origin_port_id = Column(Integer, ForeignKey("ports.id"), nullable=False)
    destination_port_id = Column(Integer, ForeignKey("ports.id"), nullable=False)
    route_name = Column(String(255), nullable=False)
    route_distance_nm = Column(
        Float, nullable=False,
        doc="Actual shipping route distance in nautical miles (NOT haversine).",
    )
    route_type = Column(
        String(50), nullable=False, default="historical",
        doc="Route category: historical, alternative, seasonal.",
    )
    is_primary = Column(
        Boolean, nullable=False, default=False,
        doc="True if this is the recommended default route for this port pair.",
    )

    # ── Provenance & Confidence ──────────────────────────────────────
    data_source = Column(
        String(255), nullable=True,
        doc="Origin of route data: e.g. 'admiralty_distance_tables', 'historical_voyage_logs', 'manual_entry'.",
    )
    confidence = Column(
        Float, nullable=True,
        doc="Confidence score 0.0–1.0. 1.0 = verified shipping distance, 0.5 = estimated.",
    )
    historical_success_rate = Column(
        Float, nullable=True,
        doc="Historical success rate of the voyage based on historical logs (0-100%).",
    )

    # ── Future-Ready Fields ──────────────────────────────────────────
    waypoints = Column(
        JSONB, nullable=True,
        doc="Ordered array of {lat, lon} intermediate waypoints for detailed route geometry.",
    )
    weather_risk = Column(
        String(50), nullable=True,
        doc="Placeholder for future weather risk assessment: low, medium, high.",
    )
    fuel_estimate_mt = Column(
        Float, nullable=True,
        doc="Placeholder for future estimated fuel consumption in metric tonnes.",
    )

    # ── Timestamps ───────────────────────────────────────────────────
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────────────
    origin_port = relationship(
        "Port", foreign_keys=[origin_port_id], back_populates="origin_routes"
    )
    destination_port = relationship(
        "Port", foreign_keys=[destination_port_id], back_populates="destination_routes"
    )

    def __repr__(self):
        return (
            f"<HistoricalRoute id={self.id} "
            f"{self.route_name!r} {self.route_distance_nm}NM>"
        )
