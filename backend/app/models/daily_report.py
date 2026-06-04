import datetime

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Date,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database.connection import Base


class DailyReport(Base):
    """
    One row per vessel per report date.

    Promoted analytics columns are stored as dedicated typed columns for
    fast SQL queries. The full nested JSON is preserved in raw_json as an
    archive and for fields not yet promoted.
    """

    __tablename__ = "daily_reports"
    __table_args__ = (
        UniqueConstraint("vessel_id", "report_date", name="uq_vessel_report_date"),
        Index("ix_vessel_report_date", "vessel_id", "report_date"),
    )

    # ── Identity ──────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, autoincrement=True)
    vessel_id = Column(Integer, ForeignKey("vessels.id"), nullable=False)
    voyage_id = Column(Integer, ForeignKey("voyages.id"), nullable=True)
    report_date = Column(Date, nullable=False)

    # ── Core Fields ───────────────────────────────────────────────────
    utc_time = Column(String(20), nullable=True)
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)
    latitude_decimal = Column(Float, nullable=True)
    longitude_decimal = Column(Float, nullable=True)
    vessel_condition = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    report_source_type = Column(
        String(50), nullable=False, default="noon_report",
        doc="Type of source report: noon_report, voyage_report, historical_backfill",
    )

    # ── Bunker (promoted for analytics) ───────────────────────────────
    total_hsfo_consumption = Column(Float, nullable=True)
    total_lsfo_consumption = Column(Float, nullable=True)
    total_mgo_consumption = Column(Float, nullable=True)
    hsfo_rob = Column(Float, nullable=True)
    lsfo_rob = Column(Float, nullable=True)
    mgo_rob = Column(Float, nullable=True)

    # ── Speed / Distance (promoted for analytics) ─────────────────────
    distance_sailed = Column(Float, nullable=True)
    speed_last_24hrs = Column(Float, nullable=True)
    avg_speed = Column(Float, nullable=True)
    me_rpm = Column(Float, nullable=True)
    avg_slip = Column(Float, nullable=True)

    # ── Weather (promoted for analytics) ──────────────────────────────
    beaufort_scale = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)

    # ── Draft (promoted for analytics) ────────────────────────────────
    draft_forward = Column(Float, nullable=True)
    draft_aft = Column(Float, nullable=True)

    # ── Lube Oil (promoted for analytics) ─────────────────────────────
    me_cyl_oil_rob = Column(Float, nullable=True)
    cyl_oil_consumption = Column(Float, nullable=True)
    me_system_oil_rob = Column(Float, nullable=True)
    me_system_oil_consumption = Column(Float, nullable=True)
    ae_lo_rob = Column(Float, nullable=True)
    ae_lo_consumption = Column(Float, nullable=True)

    # ── Fresh Water (promoted for analytics) ──────────────────────────
    fw_rob = Column(Float, nullable=True)

    # ── Machinery (promoted for analytics) ────────────────────────────
    ae1_running_hours = Column(Float, nullable=True)
    ae2_running_hours = Column(Float, nullable=True)
    ae3_running_hours = Column(Float, nullable=True)

    # ── Archive ───────────────────────────────────────────────────────
    raw_json = Column(JSONB, nullable=False)

    # ── Provenance ────────────────────────────────────────────────────
    source_file_name = Column(String(500), nullable=False)
    ingested_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────
    vessel = relationship("Vessel", back_populates="reports")
    voyage = relationship("Voyage", back_populates="reports")

    def __repr__(self):
        return (
            f"<DailyReport id={self.id} vessel_id={self.vessel_id} "
            f"date={self.report_date}>"
        )
