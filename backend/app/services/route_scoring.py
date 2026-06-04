"""
Route Scoring Engine — Future capability stubs.

This module defines interfaces for route scoring and weather integration
that will be implemented in future phases. Currently all methods raise
NotImplementedError or return placeholder values.

Future scoring factors:
- Distance efficiency
- Weather risk assessment
- Fuel consumption estimation
- Voyage duration prediction
- Historical success rate
"""

from abc import ABC, abstractmethod
from typing import Any


class WeatherLayerInterface(ABC):
    """
    Abstract interface for weather data integration.

    Future implementations will consume:
    - Historical weather archives
    - Current weather feeds
    - Seasonal weather patterns
    """

    @abstractmethod
    def get_weather_risk(self, origin: dict, destination: dict, departure_date: str) -> str:
        """
        Assess weather risk for a given route and departure date.

        Returns:
            One of: 'low', 'medium', 'high', 'severe'
        """
        raise NotImplementedError("Weather layer not yet implemented.")

    @abstractmethod
    def get_route_weather_overlay(self, waypoints: list[dict], date_range: tuple) -> list[dict]:
        """
        Return weather conditions along a sequence of waypoints.

        Returns:
            List of weather data points aligned to waypoints.
        """
        raise NotImplementedError("Weather overlay not yet implemented.")


class RouteScoringEngine:
    """
    Future route scoring engine.

    Will evaluate candidate routes against multiple criteria
    to produce a composite recommendation score.
    """

    # Scoring weight defaults (sum to 1.0)
    WEIGHTS = {
        "distance": 0.30,
        "weather_risk": 0.25,
        "fuel_consumption": 0.20,
        "voyage_duration": 0.15,
        "historical_success": 0.10,
    }

    def score_route(self, route_data: dict, context: dict | None = None) -> dict:
        """
        Score a single route against evaluation criteria.

        Args:
            route_data: Route metadata including distance, waypoints, etc.
            context: Optional context like departure date, vessel type, cargo.

        Returns:
            Dict with individual factor scores and composite score.

        Raises:
            NotImplementedError: Scoring engine is not yet implemented.
        """
        raise NotImplementedError(
            "Route scoring engine is planned for a future phase. "
            "Currently, route recommendation is based on historical route "
            "intelligence (primary route designation)."
        )

    def estimate_fuel_consumption(
        self, distance_nm: float, vessel_speed_kn: float = 12.0, daily_consumption_mt: float = 25.0
    ) -> float:
        """
        Placeholder fuel estimation based on simple distance/speed model.

        This is a naive estimate. Future versions will incorporate:
        - Vessel-specific fuel curves
        - Weather resistance factors
        - Draft and cargo load effects

        Returns:
            Estimated fuel consumption in metric tonnes.
        """
        voyage_days = distance_nm / (vessel_speed_kn * 24)
        return round(voyage_days * daily_consumption_mt, 1)

    def estimate_voyage_duration(self, distance_nm: float, avg_speed_kn: float = 12.0) -> float:
        """
        Placeholder voyage duration estimate.

        Returns:
            Estimated duration in days.
        """
        return round(distance_nm / (avg_speed_kn * 24), 1)
