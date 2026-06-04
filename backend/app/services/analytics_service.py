"""
Analytics Service — handles all performance aggregation and trend calculations
on daily reports stored in PostgreSQL.
"""

import datetime
from typing import Any, Dict, List, Optional
from app.models.daily_report import DailyReport


# ── Operational Condition Helpers ─────────────────────────────────────────────

def is_underway(report: DailyReport) -> bool:
    """Determine if the vessel was underway / steaming for a report day."""
    cond = str(report.vessel_condition or "").upper().strip()
    if any(x in cond for x in ["UNDERWAY", "STEAMING", "SEA", "TRANSIT", "MANOUVER", "MANEUVER"]):
        return True
    
    # Fallback: if speed > 0 or distance > 0, assume underway
    if (report.speed_last_24hrs is not None and report.speed_last_24hrs > 0) or \
       (report.distance_sailed is not None and report.distance_sailed > 0):
        return True
    
    return False


def is_anchored(report: DailyReport) -> bool:
    """Determine if the vessel was anchored / idle in port for a report day."""
    cond = str(report.vessel_condition or "").upper().strip()
    if any(x in cond for x in ["ANCHOR", "IDLE", "PORT", "BERTH"]):
        return True
    
    return not is_underway(report)


def is_ballast(report: DailyReport) -> bool:
    """Determine if the vessel was in a ballast condition."""
    cond = str(report.vessel_condition or "").upper().strip()
    return "BALLAST" in cond


def is_loaded(report: DailyReport) -> bool:
    """Determine if the vessel was in a loaded / laden condition."""
    cond = str(report.vessel_condition or "").upper().strip()
    return any(x in cond for x in ["LOAD", "LADEN"])


# ── Analytics Computations ───────────────────────────────────────────────────

def compute_vessel_overview(vessel_name: str, reports: List[DailyReport]) -> Dict[str, Any]:
    """Calculate reporting coverage and span for the vessel."""
    if not reports:
        return {
            "vesselName": vessel_name,
            "totalReports": 0,
            "firstReportDate": None,
            "latestReportDate": None,
            "reportingCoverage": 0.0,
        }

    total_reports = len(reports)
    first_report_date = reports[0].report_date
    latest_report_date = reports[-1].report_date
    calendar_days = (latest_report_date - first_report_date).days + 1
    coverage = (total_reports / calendar_days) * 100.0 if calendar_days > 0 else 0.0

    return {
        "vesselName": vessel_name,
        "totalReports": total_reports,
        "firstReportDate": first_report_date.isoformat(),
        "latestReportDate": latest_report_date.isoformat(),
        "reportingCoverage": round(coverage, 2),
    }


def compute_voyage_performance(reports: List[DailyReport]) -> Dict[str, Any]:
    """Calculate distance, speed (distance-weighted), and status days."""
    if not reports:
        return {
            "totalDistanceSailed": 0.0,
            "averageSpeed": None,
            "maximumSpeed": None,
            "minimumSpeed": None,
            "steamingDays": 0,
            "anchorageDays": 0,
            "ballastDays": 0,
            "loadedDays": 0,
        }

    total_distance = sum(r.distance_sailed for r in reports if r.distance_sailed is not None)

    # Filter reports for underway/steaming speed calculations
    steaming_reports = [r for r in reports if is_underway(r)]
    speeds = [r.speed_last_24hrs for r in steaming_reports if r.speed_last_24hrs is not None and r.speed_last_24hrs > 0]
    
    max_speed = max(speeds) if speeds else None
    min_speed = min(speeds) if speeds else None

    # Distance-Weighted Speed: sum(speed * distance) / sum(distance)
    valid_weighted = [
        (r.speed_last_24hrs, r.distance_sailed)
        for r in steaming_reports
        if r.speed_last_24hrs is not None and r.speed_last_24hrs > 0 and r.distance_sailed is not None and r.distance_sailed > 0
    ]

    if valid_weighted:
        sum_weighted = sum(s * d for s, d in valid_weighted)
        sum_dist = sum(d for _, d in valid_weighted)
        avg_speed = sum_weighted / sum_dist if sum_dist > 0 else (sum(speeds) / len(speeds) if speeds else None)
    elif speeds:
        avg_speed = sum(speeds) / len(speeds)
    else:
        avg_speed = None

    steaming_days = sum(1 for r in reports if is_underway(r))
    anchorage_days = sum(1 for r in reports if is_anchored(r))
    ballast_days = sum(1 for r in reports if is_ballast(r))
    loaded_days = sum(1 for r in reports if is_loaded(r))

    return {
        "totalDistanceSailed": round(total_distance, 2),
        "averageSpeed": round(avg_speed, 2) if avg_speed is not None else None,
        "maximumSpeed": round(max_speed, 2) if max_speed is not None else None,
        "minimumSpeed": round(min_speed, 2) if min_speed is not None else None,
        "steamingDays": steaming_days,
        "anchorageDays": anchorage_days,
        "ballastDays": ballast_days,
        "loadedDays": loaded_days,
    }


def compute_fuel_performance(reports: List[DailyReport]) -> Dict[str, Any]:
    """Calculate total fuel consumed and daily average/max/min breakdown."""
    if not reports:
        return {
            "totalLsfoConsumed": 0.0,
            "totalHsfoConsumed": 0.0,
            "totalMgoConsumed": 0.0,
            "averageDailyFuelConsumption": {"lsfo": 0.0, "hsfo": 0.0, "mgo": 0.0},
            "maximumDailyFuelConsumption": {"lsfo": 0.0, "hsfo": 0.0, "mgo": 0.0},
            "minimumDailyFuelConsumption": {"lsfo": 0.0, "hsfo": 0.0, "mgo": 0.0},
        }

    lsfo_vals = [r.total_lsfo_consumption for r in reports if r.total_lsfo_consumption is not None]
    hsfo_vals = [r.total_hsfo_consumption for r in reports if r.total_hsfo_consumption is not None]
    mgo_vals = [r.total_mgo_consumption for r in reports if r.total_mgo_consumption is not None]

    total_lsfo = sum(lsfo_vals)
    total_hsfo = sum(hsfo_vals)
    total_mgo = sum(mgo_vals)

    def stats(vals: List[float]) -> Dict[str, float]:
        if not vals:
            return {"avg": 0.0, "max": 0.0, "min": 0.0}
        # Filter out absolute zero for average and minimum if possible to avoid distorting idle vs sea
        non_zero = [v for v in vals if v > 0]
        avg_val = sum(vals) / len(vals)
        max_val = max(vals)
        min_val = min(non_zero) if non_zero else min(vals)
        return {
            "avg": round(avg_val, 3),
            "max": round(max_val, 3),
            "min": round(min_val, 3),
        }

    lsfo_stats = stats(lsfo_vals)
    hsfo_stats = stats(hsfo_vals)
    mgo_stats = stats(mgo_vals)

    return {
        "totalLsfoConsumed": round(total_lsfo, 3),
        "totalHsfoConsumed": round(total_hsfo, 3),
        "totalMgoConsumed": round(total_mgo, 3),
        "averageDailyFuelConsumption": {
            "lsfo": lsfo_stats["avg"],
            "hsfo": hsfo_stats["avg"],
            "mgo": mgo_stats["avg"],
        },
        "maximumDailyFuelConsumption": {
            "lsfo": lsfo_stats["max"],
            "hsfo": hsfo_stats["max"],
            "mgo": mgo_stats["max"],
        },
        "minimumDailyFuelConsumption": {
            "lsfo": lsfo_stats["min"],
            "hsfo": hsfo_stats["min"],
            "mgo": mgo_stats["min"],
        },
    }


def compute_rob_analytics(reports: List[DailyReport]) -> Dict[str, Any]:
    """Calculate opening/closing ROB, total drawdown, and daily drawdown rate."""
    if not reports:
        empty = {"opening": 0.0, "closing": 0.0, "drawdown": 0.0, "avgDailyReduction": 0.0}
        return {"lsfo": empty, "hsfo": empty, "mgo": empty, "freshWater": empty}

    first_date = reports[0].report_date
    last_date = reports[-1].report_date
    calendar_days = (last_date - first_date).days

    # Helper to calculate ROB metrics for a field
    def calculate_field_rob(field_name: str) -> Dict[str, float]:
        # Filter out reports where this ROB value is null
        valid = [r for r in reports if getattr(r, field_name) is not None]
        if not valid:
            return {"opening": 0.0, "closing": 0.0, "drawdown": 0.0, "avgDailyReduction": 0.0}
        
        opening = getattr(valid[0], field_name)
        closing = getattr(valid[-1], field_name)
        drawdown = opening - closing
        
        # Calculate daily reduction rate based on elapsed days
        avg_red = drawdown / calendar_days if calendar_days > 0 else 0.0

        return {
            "opening": round(opening, 3),
            "closing": round(closing, 3),
            "drawdown": round(drawdown, 3),
            "avgDailyReduction": round(avg_red, 3),
        }

    return {
        "lsfo": calculate_field_rob("lsfo_rob"),
        "hsfo": calculate_field_rob("hsfo_rob"),
        "mgo": calculate_field_rob("mgo_rob"),
        "freshWater": calculate_field_rob("fw_rob"),
    }


def compute_weather_analytics(reports: List[DailyReport], severe_threshold: float = 5.0) -> Dict[str, Any]:
    """Calculate Beaufort wind scale, wind speeds, and severe weather days."""
    if not reports:
        return {
            "averageBeaufort": None,
            "maximumBeaufort": None,
            "averageWindSpeed": None,
            "severeWeatherDays": 0,
        }

    bfs = [r.beaufort_scale for r in reports if r.beaufort_scale is not None]
    winds = [r.wind_speed for r in reports if r.wind_speed is not None]

    avg_bf = sum(bfs) / len(bfs) if bfs else None
    max_bf = max(bfs) if bfs else None
    avg_wind = sum(winds) / len(winds) if winds else None

    # Severe weather days: Beaufort scale >= threshold
    severe_days = sum(1 for r in reports if r.beaufort_scale is not None and r.beaufort_scale >= severe_threshold)

    return {
        "averageBeaufort": round(avg_bf, 2) if avg_bf is not None else None,
        "maximumBeaufort": round(max_bf, 2) if max_bf is not None else None,
        "averageWindSpeed": round(avg_wind, 2) if avg_wind is not None else None,
        "severeWeatherDays": severe_days,
    }


def compute_machinery_analytics(reports: List[DailyReport]) -> Dict[str, Any]:
    """Calculate running hours of auxiliary engines."""
    if not reports:
        return {
            "ae1TotalRunningHours": 0.0,
            "ae2TotalRunningHours": 0.0,
            "ae3TotalRunningHours": 0.0,
            "totalAuxiliaryEngineHours": 0.0,
        }

    ae1 = sum(r.ae1_running_hours for r in reports if r.ae1_running_hours is not None)
    ae2 = sum(r.ae2_running_hours for r in reports if r.ae2_running_hours is not None)
    ae3 = sum(r.ae3_running_hours for r in reports if r.ae3_running_hours is not None)

    total_aux = ae1 + ae2 + ae3

    return {
        "ae1TotalRunningHours": round(ae1, 2),
        "ae2TotalRunningHours": round(ae2, 2),
        "ae3TotalRunningHours": round(ae3, 2),
        "totalAuxiliaryEngineHours": round(total_aux, 2),
    }


def compute_operational_status_analytics(reports: List[DailyReport]) -> Dict[str, Any]:
    """Calculate operational breakdown days (anchor, underway, ballast, loaded)."""
    voyage_perf = compute_voyage_performance(reports)
    return {
        "daysAtAnchor": voyage_perf["anchorageDays"],
        "daysUnderway": voyage_perf["steamingDays"],
        "daysInBallast": voyage_perf["ballastDays"],
        "daysLoaded": voyage_perf["loadedDays"],
    }


# ── Trend & Timeline Extractors ───────────────────────────────────────────────

def extract_fuel_trend(reports: List[DailyReport]) -> List[Dict[str, Any]]:
    """Format fuel consumption trend for line charting."""
    trend = []
    for r in reports:
        trend.append({
            "date": r.report_date.isoformat(),
            "lsfo": round(r.total_lsfo_consumption, 3) if r.total_lsfo_consumption is not None else 0.0,
            "hsfo": round(r.total_hsfo_consumption, 3) if r.total_hsfo_consumption is not None else 0.0,
            "mgo": round(r.total_mgo_consumption, 3) if r.total_mgo_consumption is not None else 0.0,
        })
    return trend


def extract_speed_trend(reports: List[DailyReport]) -> List[Dict[str, Any]]:
    """Format speed, RPM, slip, and distance trends for line charting."""
    trend = []
    for r in reports:
        trend.append({
            "date": r.report_date.isoformat(),
            "speed": round(r.speed_last_24hrs, 2) if r.speed_last_24hrs is not None else 0.0,
            "rpm": round(r.me_rpm, 2) if r.me_rpm is not None else 0.0,
            "slip": round(r.avg_slip, 2) if r.avg_slip is not None else 0.0,
            "distance": round(r.distance_sailed, 2) if r.distance_sailed is not None else 0.0,
        })
    return trend


def extract_weather_trend(reports: List[DailyReport]) -> List[Dict[str, Any]]:
    """Format weather Beaufort and wind speed trends for line charting."""
    trend = []
    for r in reports:
        trend.append({
            "date": r.report_date.isoformat(),
            "beaufort": round(r.beaufort_scale, 2) if r.beaufort_scale is not None else 0.0,
            "windSpeed": round(r.wind_speed, 2) if r.wind_speed is not None else 0.0,
        })
    return trend


def extract_timeline(reports: List[DailyReport]) -> List[Dict[str, Any]]:
    """Format daily event timeline with coordinates and remarks."""
    timeline = []
    for r in reports:
        timeline.append({
            "date": r.report_date.isoformat(),
            "vesselCondition": r.vessel_condition,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "remarks": r.remarks,
        })
    return timeline
