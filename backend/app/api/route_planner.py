"""
Route Planner API — Historical Route Recommendation engine.

Provides port listings, route lookups, and route recommendations
based on historical shipping route intelligence.
"""

from typing import Optional
import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database.connection import get_db
from app.models.port import Port
from app.models.historical_route import HistoricalRoute
from app.services.route_recommendation_service import RouteRecommendationService

router = APIRouter(tags=["Route Planner"])


# ── Request Models ───────────────────────────────────────────────────────────

class RoutePlanRequest(BaseModel):
    originPortId: int
    destinationPortId: int


# ── Helper: Serialize route ──────────────────────────────────────────────────

def _serialize_route(route: HistoricalRoute, score: Optional[int] = None, score_breakdown: Optional[dict] = None) -> dict:
    """
    Convert a HistoricalRoute ORM object to API-friendly dict.
    
    CRITICAL DISCLAIMER:
    The columns `weatherRisk`, `fuelEstimateMt`, and `historicalSuccessRate`
    in this serialization represent DEFAULT Historical Route Metadata (snapshots
    of typical route behavior). They are NOT dynamic real-time forecasts or universal
    truths. Future phases will override these defaults with seasonal archives,
    real-time weather forecasts, and dynamic fuel optimization models.
    """
    return {
        "id": route.id,
        "routeName": route.route_name,
        "distanceNm": route.route_distance_nm,
        "routeType": route.route_type,
        "isPrimary": route.is_primary,
        "dataSource": route.data_source,
        "confidence": route.confidence,
        "historicalSuccessRate": route.historical_success_rate,
        "weatherRisk": (route.weather_risk or "low").upper(),
        "fuelEstimateMt": route.fuel_estimate_mt,
        "waypoints": route.waypoints,
        "score": score,
        "scoreBreakdown": score_breakdown,
    }


def _serialize_port(port: Port) -> dict:
    """Convert a Port ORM object to API-friendly dict."""
    return {
        "id": port.id,
        "name": port.name,
        "country": port.country,
        "latitude": port.latitude,
        "longitude": port.longitude,
        "code": port.code,
    }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/api/ports")
def list_ports(db: Session = Depends(get_db)):
    """Return all ports ordered alphabetically."""
    ports = db.query(Port).order_by(Port.name.asc()).all()
    return {
        "success": True,
        "data": [_serialize_port(p) for p in ports],
    }


@router.get("/api/route-planner/routes")
def get_routes_between_ports(
    originPortId: int = Query(..., description="Origin port ID"),
    destinationPortId: int = Query(..., description="Destination port ID"),
    db: Session = Depends(get_db),
):
    """
    Retrieve all historical routes between two ports.
    Checks both directions (bidirectional lookup).
    """
    routes = (
        db.query(HistoricalRoute)
        .filter(
            or_(
                and_(
                    HistoricalRoute.origin_port_id == originPortId,
                    HistoricalRoute.destination_port_id == destinationPortId,
                ),
                and_(
                    HistoricalRoute.origin_port_id == destinationPortId,
                    HistoricalRoute.destination_port_id == originPortId,
                ),
            )
        )
        .order_by(HistoricalRoute.is_primary.desc(), HistoricalRoute.route_distance_nm.asc())
        .all()
    )

    return {
        "success": True,
        "data": [_serialize_route(r) for r in routes],
    }


@router.post("/api/route-planner/plan")
def plan_route(req: RoutePlanRequest, db: Session = Depends(get_db)):
    """
    Historical Route Recommendation.

    Evaluates candidate routes, calculates deterministic scores, ranks them,
    and returns explanations. Recommendation is based on established historical
    shipping corridors, not direct line-of-sight calculations.
    """
    # Validate ports
    origin = db.query(Port).filter(Port.id == req.originPortId).first()
    destination = db.query(Port).filter(Port.id == req.destinationPortId).first()

    if not origin:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": f"Origin port ID {req.originPortId} not found."},
        )
    if not destination:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": f"Destination port ID {req.destinationPortId} not found."},
        )

    if req.originPortId == req.destinationPortId:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Origin and destination ports must be different."},
        )

    # Fetch candidate routes (bidirectional lookup)
    routes = (
        db.query(HistoricalRoute)
        .filter(
            or_(
                and_(
                    HistoricalRoute.origin_port_id == req.originPortId,
                    HistoricalRoute.destination_port_id == req.destinationPortId,
                ),
                and_(
                    HistoricalRoute.origin_port_id == req.destinationPortId,
                    HistoricalRoute.destination_port_id == req.originPortId,
                ),
            )
        )
        .all()
    )

    generated_time = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    if not routes:
        return {
            "success": True,
            "generatedAt": generated_time,
            "data": {
                "origin": _serialize_port(origin),
                "destination": _serialize_port(destination),
                "recommendedRoute": None,
                "alternativeRoutes": [],
                "recommendationReasons": [],
                "message": "No historical route data available for this port pair. Route data can be added to expand coverage.",
            },
        }

    # Evaluate, score, and sort the routes using RouteRecommendationService
    scored_results = RouteRecommendationService.calculate_scores(routes)

    # Highest score is recommended
    recommended_item = scored_results[0]
    recommended_route = recommended_item["route"]
    recommended_score = recommended_item["score"]
    recommended_breakdown = recommended_item["scoreBreakdown"]

    # Serialize recommended route with score data
    serialized_recommended = _serialize_route(
        recommended_route,
        score=recommended_score,
        score_breakdown=recommended_breakdown
    )

    # Rest are alternatives
    serialized_alternatives = []
    for item in scored_results[1:]:
        serialized_alternatives.append(
            _serialize_route(
                item["route"],
                score=item["score"],
                score_breakdown=item["scoreBreakdown"]
            )
        )

    # Generate explanations based on recommendation comparison metrics
    alternatives_routes = [item["route"] for item in scored_results[1:]]
    reasons = RouteRecommendationService.generate_recommendation_reasons(
        recommended_route, alternatives_routes
    )

    return {
        "success": True,
        "generatedAt": generated_time,
        "data": {
            "origin": _serialize_port(origin),
            "destination": _serialize_port(destination),
            "recommendedRoute": serialized_recommended,
            "alternativeRoutes": serialized_alternatives,
            "recommendationReasons": reasons,
        },
    }
