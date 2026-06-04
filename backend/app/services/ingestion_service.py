"""
Ingestion service — handles UPSERT of parsed daily reports into PostgreSQL.

Responsibilities:
  - Get-or-create Vessel records
  - Convert lat/lng strings to decimal degrees
  - UPSERT daily reports (latest upload wins)
  - Track ingestion statistics (inserted / updated / duplicates)
"""

import datetime
import re
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.vessel import Vessel
from app.models.daily_report import DailyReport


# ── Coordinate Conversion ─────────────────────────────────────────────────────

def parse_coordinate_to_decimal(coord_str: Optional[str], is_longitude: bool = False) -> Optional[float]:
    """
    Convert a nautical coordinate string to decimal degrees.

    Supported formats:
      - "02 01.9 N"      -> 2.0316667
      - "104 49.7 E"     -> 104.8283333
      - "01 17.9N"       -> 1.2983333
      - "101 59.9E"      -> 101.9983333

    Returns None if the string cannot be parsed.
    """
    if coord_str is None:
        return None

    coord_str = str(coord_str).strip()
    if not coord_str:
        return None

    # Pattern: degrees  minutes(.decimal)  optional-space  direction
    pattern = r"(\d+)\s+(\d+(?:\.\d+)?)\s*([NSEWnsew])?"
    match = re.match(pattern, coord_str)
    if not match:
        return None

    degrees = float(match.group(1))
    minutes = float(match.group(2))
    direction = match.group(3).upper() if match.group(3) else None

    decimal = degrees + (minutes / 60.0)

    # Apply sign for South/West
    if direction in ("S", "W"):
        decimal = -decimal

    return round(decimal, 6)


# ── Vessel Get-or-Create ───────────────────────────────────────────────────────

def get_or_create_vessel(
    db: Session,
    vessel_name: str,
    technical_manager: Optional[str] = None,
) -> Vessel:
    """
    Look up a vessel by name. Create if it doesn't exist.
    Update technical_manager if it changed.
    """
    vessel = db.query(Vessel).filter(Vessel.vessel_name == vessel_name).first()

    if vessel is None:
        vessel = Vessel(
            vessel_name=vessel_name,
            technical_manager=technical_manager,
        )
        db.add(vessel)
        db.flush()  # Assigns vessel.id without committing
    elif technical_manager and vessel.technical_manager != technical_manager:
        vessel.technical_manager = technical_manager

    return vessel


# ── Report Date Extraction ─────────────────────────────────────────────────────

def extract_report_date(utc_date_str: Optional[str]) -> Optional[datetime.date]:
    """
    Parse the utcDate string from the parser output into a date object.

    Handles ISO-format, "15-May-26", and other common date representations.
    """
    if utc_date_str is None:
        return None

    utc_date_str = str(utc_date_str).strip()
    if not utc_date_str:
        return None

    # Try full ISO datetime first
    if "T" in utc_date_str:
        try:
            return datetime.datetime.fromisoformat(
                utc_date_str.replace("Z", "+00:00")
            ).date()
        except (ValueError, TypeError):
            pass

    # List of common date formats to attempt parsing
    formats = [
        "%Y-%m-%d",      # 2026-04-22
        "%d-%b-%y",      # 15-May-26 (short year)
        "%d-%b-%Y",      # 15-May-2026 (long year)
        "%d-%B-%y",      # 15-May-26 (full month name, short year)
        "%d-%B-%Y",      # 15-May-2026 (full month name, long year)
        "%d/%m/%Y",      # 15/05/2026
        "%m/%d/%Y",      # 05/15/2026
        "%Y/%m/%d",      # 2026/05/15
        "%d-%m-%Y",      # 15-05-2026
        "%Y-%b-%d",      # 2026-May-15
    ]

    for fmt in formats:
        try:
            return datetime.datetime.strptime(utc_date_str, fmt).date()
        except ValueError:
            continue

    return None


# ── Column Extraction from Nested JSON ─────────────────────────────────────────

def _safe_get(data: Dict, *keys: str) -> Any:
    """Safely traverse nested dicts. Returns None if any key is missing."""
    current = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def extract_promoted_columns(report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map the nested parser JSON structure to flat promoted column values.
    Returns a dict of column_name -> value for the DailyReport model.
    """
    return {
        # Bunker
        "total_hsfo_consumption": _safe_get(report, "bunker", "totalHsfoConsumption"),
        "total_lsfo_consumption": _safe_get(report, "bunker", "totalLsfoConsumption"),
        "total_mgo_consumption": _safe_get(report, "bunker", "totalMgoConsumption"),
        "hsfo_rob": _safe_get(report, "bunker", "hsfoRob"),
        "lsfo_rob": _safe_get(report, "bunker", "lsfoRob"),
        "mgo_rob": _safe_get(report, "bunker", "mgoRob"),
        # Speed / Distance
        "distance_sailed": _safe_get(report, "voyage", "distanceSailed"),
        "speed_last_24hrs": _safe_get(report, "voyage", "speedLast24Hrs"),
        "avg_speed": _safe_get(report, "voyage", "avgSpeed"),
        "me_rpm": _safe_get(report, "voyage", "meRpm"),
        "avg_slip": _safe_get(report, "voyage", "avgSlip"),
        # Weather
        "beaufort_scale": _safe_get(report, "weather", "beaufortScale"),
        "wind_speed": _safe_get(report, "weather", "windSpeed"),
        # Draft
        "draft_forward": _safe_get(report, "voyage", "draftForward"),
        "draft_aft": _safe_get(report, "voyage", "draftAft"),
        # Lube Oil
        "me_cyl_oil_rob": _safe_get(report, "lubeOil", "meCylOilRob"),
        "cyl_oil_consumption": _safe_get(report, "lubeOil", "cylOilConsumption"),
        "me_system_oil_rob": _safe_get(report, "lubeOil", "meSystemOilRob"),
        "me_system_oil_consumption": _safe_get(report, "lubeOil", "meSystemOilConsumption"),
        "ae_lo_rob": _safe_get(report, "lubeOil", "aeLoRob"),
        "ae_lo_consumption": _safe_get(report, "lubeOil", "aeLoConsumption"),
        # Fresh Water
        "fw_rob": _safe_get(report, "freshWater", "fwRob"),
        # Machinery
        "ae1_running_hours": _safe_get(report, "machinery", "ae1RunningHours"),
        "ae2_running_hours": _safe_get(report, "machinery", "ae2RunningHours"),
        "ae3_running_hours": _safe_get(report, "machinery", "ae3RunningHours"),
    }


# ── Main Ingestion Logic ──────────────────────────────────────────────────────

def ingest_reports(
    db: Session,
    parsed_data: Dict[str, Any],
    source_file_name: str,
) -> Dict[str, int]:
    """
    Ingest parsed daily reports into PostgreSQL with UPSERT behavior.

    Args:
        db: Active SQLAlchemy session.
        parsed_data: Output from parse_excel_report() — contains vesselName,
                     technicalManager, reportCount, and reports[].
        source_file_name: Original uploaded filename for provenance.

    Returns:
        Ingestion statistics dict with inserted, updated, duplicates, totalProcessed.
    """
    stats = {"inserted": 0, "updated": 0, "duplicates": 0, "totalProcessed": 0}

    vessel_name = parsed_data.get("vesselName", "Unknown")
    technical_manager = parsed_data.get("technicalManager")
    reports: List[Dict[str, Any]] = parsed_data.get("reports", [])

    # 1. Get or create the vessel record
    vessel = get_or_create_vessel(db, vessel_name, technical_manager)

    # 2. Process each daily report
    now = datetime.datetime.utcnow()

    for report in reports:
        stats["totalProcessed"] += 1

        # Extract report date
        raw_utc_date = report.get("utcDate")
        report_date = extract_report_date(raw_utc_date)
        if report_date is None:
            print(f"[Ingestion Debug] Vessel: '{vessel_name}' | Skip Reason: Invalid or missing date format for raw value '{raw_utc_date}'")
            continue  # Skip reports without a valid date

        # Extract coordinate strings and convert to decimal
        lat_str = _safe_get(report, "position", "latitude")
        lng_str = _safe_get(report, "position", "longitude")
        lat_decimal = parse_coordinate_to_decimal(lat_str, is_longitude=False)
        lng_decimal = parse_coordinate_to_decimal(lng_str, is_longitude=True)

        # Extract all promoted analytics columns
        promoted = extract_promoted_columns(report)

        # Check for existing record (UPSERT lookup)
        existing = (
            db.query(DailyReport)
            .filter(
                DailyReport.vessel_id == vessel.id,
                DailyReport.report_date == report_date,
            )
            .first()
        )

        if existing is not None:
            # UPDATE existing record — latest upload wins
            existing.utc_time = report.get("utcTime")
            existing.latitude = lat_str
            existing.longitude = lng_str
            existing.latitude_decimal = lat_decimal
            existing.longitude_decimal = lng_decimal
            existing.vessel_condition = report.get("vesselCondition")
            existing.remarks = report.get("remarks")
            existing.report_source_type = "noon_report"
            existing.raw_json = report
            existing.source_file_name = source_file_name
            existing.ingested_at = now

            # Update all promoted columns
            for col_name, col_value in promoted.items():
                setattr(existing, col_name, col_value)

            print(f"[Ingestion Debug] Vessel: '{vessel_name}' | Report Date: {report_date} | Decision: UPDATE")
            stats["updated"] += 1
        else:
            # INSERT new record
            new_report = DailyReport(
                vessel_id=vessel.id,
                report_date=report_date,
                utc_time=report.get("utcTime"),
                latitude=lat_str,
                longitude=lng_str,
                latitude_decimal=lat_decimal,
                longitude_decimal=lng_decimal,
                vessel_condition=report.get("vesselCondition"),
                remarks=report.get("remarks"),
                report_source_type="noon_report",
                raw_json=report,
                source_file_name=source_file_name,
                ingested_at=now,
                **promoted,
            )
            db.add(new_report)
            print(f"[Ingestion Debug] Vessel: '{vessel_name}' | Report Date: {report_date} | Decision: INSERT")
            stats["inserted"] += 1

    # 3. Commit the transaction
    db.commit()

    return stats
