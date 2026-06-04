"""
Centralized Configuration Module for Vessel Performance System.

This module houses settings, weights, and parameters that govern
business logic layers, making them adjustable from a central location.
"""

# ── Route Scoring Engine Weights (Sum must equal 1.0) ──────────────────────────

ROUTE_SCORING_WEIGHTS = {
    "distance": 0.35,
    "weather": 0.30,
    "fuel": 0.20,
    "reliability": 0.15,
}
