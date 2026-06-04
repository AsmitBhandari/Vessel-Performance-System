"""
Route Visualization API — provides vessel position data for voyage mapping.
"""

import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.analytics import load_vessel_and_reports

router = APIRouter(prefix="/api/routes", tags=["Routes"])


def _haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in nautical miles between two lat/lon points."""
    R_NM = 3440.065  # Earth radius in nautical miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R_NM * c


@router.get("/positions")
def get_route_positions(
    vesselName: str = Query(..., description="Vessel name"),
    startDate: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    endDate: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """Retrieve chronologically sorted vessel positions with structured metadata."""
    vessel, reports, err = load_vessel_and_reports(
        db, vessel_name=vesselName, start_date_str=startDate, end_date_str=endDate
    )
    if err:
        return JSONResponse(status_code=400, content={"success": False, "message": err})

    if not vessel:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": f"Vessel '{vesselName}' not found."},
        )

    # Filter reports with valid coordinates
    positioned = [
        r for r in reports
        if r.latitude_decimal is not None and r.longitude_decimal is not None
    ]

    # Build position list
    positions = []
    for r in positioned:
        positions.append({
            "date": r.report_date.isoformat() if r.report_date else None,
            "latitude": r.latitude_decimal,
            "longitude": r.longitude_decimal,
            "condition": r.vessel_condition,
            "remarks": r.remarks,
            "latitudeRaw": r.latitude,
            "longitudeRaw": r.longitude,
        })

    # Calculate total distance using haversine
    total_distance = 0.0
    for i in range(1, len(positions)):
        p1 = positions[i - 1]
        p2 = positions[i]
        if all(v is not None for v in [p1["latitude"], p1["longitude"], p2["latitude"], p2["longitude"]]):
            total_distance += _haversine_nm(
                p1["latitude"], p1["longitude"],
                p2["latitude"], p2["longitude"],
            )

    # Determine date range
    start = positions[0]["date"] if positions else None
    end = positions[-1]["date"] if positions else None

    return {
        "success": True,
        "data": {
            "totalPoints": len(positions),
            "startDate": start,
            "endDate": end,
            "totalDistance": round(total_distance, 1),
            "positions": positions,
        },
    }
