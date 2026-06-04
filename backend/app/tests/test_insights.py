"""
Test script for verifying Phase 5 Operational Insights calculations and sorting.
"""

import sys
import os

# Add backend directory to python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(backend_dir)

from app.database.connection import SessionLocal
from app.models.vessel import Vessel
from app.models.daily_report import DailyReport
import app.services.analytics_service as analytics_service
from app.services.insights_service import engine as insights_engine, BaseInsightGenerator


class DummyPredictiveGenerator(BaseInsightGenerator):
    """A dummy generator to test extensible/ML-ready architecture."""
    def generate(self, payload: Dict = None) -> list:
        return [{
            "category": "General",
            "source": "Predictive Insight Generator (Future)",
            "type": "INFO",
            "message": "Future ML predictive model initialized successfully."
        }]


def run_tests():
    print("Starting Phase 5 Operational Insights Tests...")
    db = SessionLocal()
    try:
        # Test 1: Verify Architecture Extensibility
        print("\n--- Test 1: Extensible Architecture ---")
        initial_generator_count = len(insights_engine._generators)
        dummy_gen = DummyPredictiveGenerator()
        insights_engine.register_generator(dummy_gen)
        
        assert len(insights_engine._generators) == initial_generator_count + 1
        print("Successfully registered dummy predictive generator.")
        
        # Deregister to avoid polluting other tests
        insights_engine._generators.remove(dummy_gen)
        assert len(insights_engine._generators) == initial_generator_count
        print("Successfully deregistered dummy generator.")

        # Test 2: Ingest and calculate DE XI insights
        print("\n--- Test 2: DE XI Insights Verification ---")
        vessel_de_xi = db.query(Vessel).filter(Vessel.vessel_name == "DE XI").first()
        if not vessel_de_xi:
            print("Error: Vessel 'DE XI' not found in database. Ingest report first!")
            sys.exit(1)

        reports_de_xi = db.query(DailyReport).filter(DailyReport.vessel_id == vessel_de_xi.id).order_by(DailyReport.report_date.asc()).all()
        
        overview = analytics_service.compute_vessel_overview(vessel_de_xi.vessel_name, reports_de_xi)
        voyage = analytics_service.compute_voyage_performance(reports_de_xi)
        fuel = analytics_service.compute_fuel_performance(reports_de_xi)
        rob = analytics_service.compute_rob_analytics(reports_de_xi)
        weather = analytics_service.compute_weather_analytics(reports_de_xi)
        machinery = analytics_service.compute_machinery_analytics(reports_de_xi)
        operations = analytics_service.compute_operational_status_analytics(reports_de_xi)

        payload_de_xi = {
            "overview": overview,
            "voyage": voyage,
            "fuel": fuel,
            "rob": rob,
            "weather": weather,
            "machinery": machinery,
            "operations": operations
        }

        insights_de_xi = insights_engine.generate_all(payload_de_xi)
        print("Generated DE XI insights count:", len(insights_de_xi))
        
        # Verify specific expected insights are present
        messages = [i["message"] for i in insights_de_xi]
        print("DE XI Insight Messages:")
        for m in messages:
            print(f"  - {m}")
            
        assert "No severe weather encountered." in messages
        assert "Vessel spent majority of reporting period at anchorage." in messages
        assert "Fuel consumption remained within expected range." in messages

        # Test 3: Ingest and calculate RANDOM vessel insights
        print("\n--- Test 3: RANDOM Vessel Insights Verification ---")
        vessel_random = db.query(Vessel).filter(Vessel.vessel_name == "Unknown").first()
        if not vessel_random:
            print("Warning: Vessel 'Unknown' (RANDOM sample) not found. Skipping RANDOM tests.")
        else:
            import datetime as dt
            reports_random = db.query(DailyReport).filter(
                DailyReport.vessel_id == vessel_random.id,
                DailyReport.report_date >= dt.date(2026, 5, 15),
                DailyReport.report_date <= dt.date(2026, 5, 17)
            ).order_by(DailyReport.report_date.asc()).all()
            
            overview_r = analytics_service.compute_vessel_overview(vessel_random.vessel_name, reports_random)
            voyage_r = analytics_service.compute_voyage_performance(reports_random)
            fuel_r = analytics_service.compute_fuel_performance(reports_random)
            rob_r = analytics_service.compute_rob_analytics(reports_random)
            weather_r = analytics_service.compute_weather_analytics(reports_random)
            machinery_r = analytics_service.compute_machinery_analytics(reports_random)
            operations_r = analytics_service.compute_operational_status_analytics(reports_random)

            payload_random = {
                "overview": overview_r,
                "voyage": voyage_r,
                "fuel": fuel_r,
                "rob": rob_r,
                "weather": weather_r,
                "machinery": machinery_r,
                "operations": operations_r
            }

            insights_random = insights_engine.generate_all(payload_random)
            print("Generated RANDOM insights count:", len(insights_random))
            
            messages_r = [i["message"] for i in insights_random]
            print("RANDOM Insight Messages:")
            for m in messages_r:
                print(f"  - {m}")

            assert "Vessel remained underway throughout reporting period." in messages_r
            assert "No severe weather encountered." in messages_r
            assert "Fuel consumption remained stable." in messages_r
            assert "Voyage completed without operational anomalies." in messages_r

        # Test 4: Verify Priority Ordering (WARNING > INFO > POSITIVE)
        print("\n--- Test 4: Priority Severity Sorting ---")
        mock_payload = {
            "overview": {"totalReports": 3},
            "voyage": {"steamingDays": 3, "averageSpeed": 12.0, "maximumSpeed": 15.0, "minimumSpeed": 9.0}, # Fluctuations -> WARNING
            "fuel": {},
            "rob": {},
            "weather": {"severeWeatherDays": 0, "averageBeaufort": 4.5}, # Elevated wind -> INFO, No severe -> POSITIVE
            "machinery": {},
            "operations": {"daysUnderway": 3, "daysAtAnchor": 0} # Underway -> POSITIVE
        }
        mock_insights = insights_engine.generate_all(mock_payload)
        
        types = [i["type"] for i in mock_insights]
        print("Sorted insight severities:", types)
        
        # Verify WARNING comes first, then INFO, then POSITIVE
        warning_indices = [idx for idx, t in enumerate(types) if t == "WARNING"]
        info_indices = [idx for idx, t in enumerate(types) if t == "INFO"]
        positive_indices = [idx for idx, t in enumerate(types) if t == "POSITIVE"]
        
        for w in warning_indices:
            for i in info_indices:
                assert w < i
            for p in positive_indices:
                assert w < p
                
        for i in info_indices:
            for p in positive_indices:
                assert i < p

        print("Severity sorting verification passed successfully.")
        print("\nAll Phase 5 Operational Insights Tests PASSED successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
