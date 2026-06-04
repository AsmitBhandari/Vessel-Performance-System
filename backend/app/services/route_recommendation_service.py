"""
Route Scoring & Recommendation Engine.

Evaluates candidate maritime routes using deterministic calculations based on
distance, fuel estimates, weather risk profiles, and historical success rates.
Returns comparative reasons justifying recommendations.
"""

from typing import List, Dict, Any, Optional
from app.config import ROUTE_SCORING_WEIGHTS
from app.models.historical_route import HistoricalRoute


class RouteRecommendationService:
    """
    Service to evaluate, score, rank, and explain historical shipping routes.
    """

    @staticmethod
    def calculate_scores(routes: List[HistoricalRoute]) -> List[Dict[str, Any]]:
        """
        Evaluate candidate routes and assign individual factor scores and overall score.

        Normalizes distance and fuel consumption relative to the minimum candidate value.
        Normalizes weather risk and historical success rates to absolute scales.
        """
        if not routes:
            return []

        # Find minimum distance and fuel among candidate routes
        min_distance = min(r.route_distance_nm for r in routes)

        valid_fuels = [r.fuel_estimate_mt for r in routes if r.fuel_estimate_mt is not None]
        min_fuel = min(valid_fuels) if valid_fuels else None

        scored_results = []
        for r in routes:
            # 1. Distance Score: 100 * (min_distance / current_distance)
            if r.route_distance_nm > 0:
                dist_score = 100.0 * (min_distance / r.route_distance_nm)
            else:
                dist_score = 100.0

            # 2. Fuel Score: 100 * (min_fuel / current_fuel)
            if r.fuel_estimate_mt is not None and min_fuel is not None and r.fuel_estimate_mt > 0:
                fuel_score = 100.0 * (min_fuel / r.fuel_estimate_mt)
            else:
                fuel_score = 100.0  # Default if fuel data is missing

            # 3. Weather Score: LOW -> 100, MEDIUM -> 70, HIGH -> 40
            weather_risk_val = r.weather_risk.upper() if r.weather_risk else "LOW"
            if weather_risk_val == "LOW":
                weather_score = 100.0
            elif weather_risk_val in ("MEDIUM", "MODERATE", "MOD"):
                weather_score = 70.0
            elif weather_risk_val in ("HIGH", "SEVERE"):
                weather_score = 40.0
            else:
                weather_score = 100.0

            # 4. Reliability Score: success rate (0-100)
            reliability_score = r.historical_success_rate if r.historical_success_rate is not None else 100.0

            # Calculate overall score using weights
            w_dist = ROUTE_SCORING_WEIGHTS.get("distance", 0.35)
            w_weather = ROUTE_SCORING_WEIGHTS.get("weather", 0.30)
            w_fuel = ROUTE_SCORING_WEIGHTS.get("fuel", 0.20)
            w_reliability = ROUTE_SCORING_WEIGHTS.get("reliability", 0.15)

            overall_score = (
                w_dist * dist_score +
                w_weather * weather_score +
                w_fuel * fuel_score +
                w_reliability * reliability_score
            )

            # Round final composite score and factor scores to nearest integers
            rounded_overall = int(round(overall_score))
            score_breakdown = {
                "distance": int(round(dist_score)),
                "weather": int(round(weather_score)),
                "fuel": int(round(fuel_score)),
                "reliability": int(round(reliability_score)),
            }

            scored_results.append({
                "route": r,
                "score": rounded_overall,
                "scoreBreakdown": score_breakdown
            })

        # Sort routes by overall score descending, then by distance ascending
        scored_results.sort(key=lambda item: (-item["score"], item["route"].route_distance_nm))
        return scored_results

    @staticmethod
    def generate_recommendation_reasons(
        recommended: HistoricalRoute, alternatives: List[HistoricalRoute]
    ) -> List[str]:
        """
        Generate metric-driven explanations for the recommended route.

        Exposes auditable, measurable deltas relative to candidate alternatives.
        """
        reasons = []

        # ── 1. Distance explanation ──────────────────────────────────────────
        if alternatives:
            alt_distances = [alt.route_distance_nm for alt in alternatives]
            min_alt_distance = min(alt_distances)
            dist_diff = min_alt_distance - recommended.route_distance_nm
            if dist_diff > 0:
                reasons.append(f"Route is {int(round(dist_diff))} NM shorter than the nearest alternative.")
            else:
                reasons.append("Route is the shortest available historical route.")
        else:
            reasons.append("Route is the shortest available historical route.")

        # ── 2. Fuel explanation ──────────────────────────────────────────────
        if recommended.fuel_estimate_mt is not None:
            if alternatives:
                alt_fuels = [alt.fuel_estimate_mt for alt in alternatives if alt.fuel_estimate_mt is not None]
                if alt_fuels:
                    min_alt_fuel = min(alt_fuels)
                    fuel_diff = min_alt_fuel - recommended.fuel_estimate_mt
                    if fuel_diff > 0:
                        reasons.append(f"Estimated fuel consumption is {int(round(fuel_diff))} MT lower.")
                    else:
                        reasons.append("Route has the lowest estimated fuel consumption.")
                else:
                    reasons.append("Route has the lowest estimated fuel consumption.")
            else:
                reasons.append("Route has the lowest estimated fuel consumption.")

        # ── 3. Reliability explanation ────────────────────────────────────────
        if recommended.historical_success_rate is not None:
            reasons.append(f"Historical success rate is {recommended.historical_success_rate}%.")

        # ── 4. Weather explanation ───────────────────────────────────────────
        weather_risk_val = recommended.weather_risk.upper() if recommended.weather_risk else "LOW"
        reasons.append(f"Default weather risk classification is {weather_risk_val}.")

        return reasons
