import datetime
import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.vessel import Vessel
from app.models.daily_report import DailyReport
import app.services.analytics_service as analytics
from app.services.insights_service import engine as insights_engine


def load_reports_for_vessel(
    db: Session,
    vessel_id: int,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
) -> List[DailyReport]:
    """
    Helper to fetch DailyReport records for a vessel sorted by date,
    optionally filtered by startDate and endDate.
    """
    query = db.query(DailyReport).filter(DailyReport.vessel_id == vessel_id)

    if start_date:
        query = query.filter(DailyReport.report_date >= start_date)
    if end_date:
        query = query.filter(DailyReport.report_date <= end_date)

    return query.order_by(DailyReport.report_date.asc()).all()


def get_vessel_summary(db: Session, vessel_id: int, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None) -> Dict[str, Any]:
    """Retrieve vessel reporting overview and coverage metrics."""
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        return {"error": f"Vessel with ID {vessel_id} not found."}
    reports = load_reports_for_vessel(db, vessel_id, start_date, end_date)
    return analytics.compute_vessel_overview(vessel.vessel_name, reports)


def get_fuel_analytics(db: Session, vessel_id: int, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None) -> Dict[str, Any]:
    """Retrieve fuel consumption statistics (total, daily average/max/min)."""
    reports = load_reports_for_vessel(db, vessel_id, start_date, end_date)
    return analytics.compute_fuel_performance(reports)


def get_weather_analytics(db: Session, vessel_id: int, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None) -> Dict[str, Any]:
    """Retrieve weather statistics (Beaufort wind scale, wind speeds, severe weather days)."""
    reports = load_reports_for_vessel(db, vessel_id, start_date, end_date)
    return analytics.compute_weather_analytics(reports)


def get_voyage_summary(db: Session, vessel_id: int, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None) -> Dict[str, Any]:
    """Retrieve voyage statistics (distance sailed, speeds, status days)."""
    reports = load_reports_for_vessel(db, vessel_id, start_date, end_date)
    return analytics.compute_voyage_performance(reports)


def get_operational_insights(db: Session, vessel_id: int, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None) -> List[Dict[str, Any]]:
    """Retrieve rule-based operational anomalies, warnings, and positive insights."""
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        return []
    reports = load_reports_for_vessel(db, vessel_id, start_date, end_date)
    payload = {
        "overview": analytics.compute_vessel_overview(vessel.vessel_name, reports),
        "voyage": analytics.compute_voyage_performance(reports),
        "fuel": analytics.compute_fuel_performance(reports),
        "rob": analytics.compute_rob_analytics(reports),
        "weather": analytics.compute_weather_analytics(reports),
        "machinery": analytics.compute_machinery_analytics(reports),
        "operations": analytics.compute_operational_status_analytics(reports),
    }
    return insights_engine.generate_all(payload)


def get_rob_analytics(db: Session, vessel_id: int, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None) -> Dict[str, Any]:
    """Retrieve opening/closing ROB, drawdown, and average daily reduction rate."""
    reports = load_reports_for_vessel(db, vessel_id, start_date, end_date)
    return analytics.compute_rob_analytics(reports)


def get_operational_timeline(db: Session, vessel_id: int, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None) -> List[Dict[str, Any]]:
    """Retrieve chronological events timeline (date, condition, coordinates, remarks)."""
    reports = load_reports_for_vessel(db, vessel_id, start_date, end_date)
    return analytics.extract_timeline(reports)


def get_recent_reports(db: Session, vessel_id: int, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None, limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve brief summaries of recent reports (date, latitude, longitude, condition, consumption)."""
    reports = load_reports_for_vessel(db, vessel_id, start_date, end_date)
    # Get last N reports
    recent = reports[-limit:] if len(reports) > limit else reports
    
    results = []
    for r in recent:
        results.append({
            "date": r.report_date.isoformat(),
            "condition": r.vessel_condition,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "hsfo_consumption": r.total_hsfo_consumption,
            "lsfo_consumption": r.total_lsfo_consumption,
            "mgo_consumption": r.total_mgo_consumption,
            "remarks": r.remarks
        })
    return results


# Registry mapping tool names to execution functions
TOOL_REGISTRY = {
    "vessel_summary": get_vessel_summary,
    "fuel_analytics": get_fuel_analytics,
    "weather_analytics": get_weather_analytics,
    "voyage_summary": get_voyage_summary,
    "operational_insights": get_operational_insights,
    "recent_reports": get_recent_reports,
    "rob_analytics": get_rob_analytics,
    "operational_timeline": get_operational_timeline,
}
