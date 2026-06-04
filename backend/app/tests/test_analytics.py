"""
Test script for verifying analytics calculations against the PostgreSQL database.
"""

import sys
import os

# Add backend directory to python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(backend_dir)

from app.database.connection import SessionLocal
from app.models.vessel import Vessel
from app.models.daily_report import DailyReport
import app.services.analytics_service as service

def run_tests():
    print("Starting Phase 3B Analytics Tests...")
    db = SessionLocal()
    try:
        # 1. Check if we have the vessel 'DE XI' from Phase 3A
        vessel = db.query(Vessel).filter(Vessel.vessel_name == "DE XI").first()
        if not vessel:
            print("Error: Vessel 'DE XI' not found in database. Ingest report first!")
            sys.exit(1)
        print(f"Found Vessel: {vessel.vessel_name} (ID: {vessel.id})")

        # 2. Retrieve reports
        reports = db.query(DailyReport).filter(DailyReport.vessel_id == vessel.id).order_by(DailyReport.report_date.asc()).all()
        print(f"Retrieved {len(reports)} daily reports.")
        if len(reports) < 6:
            print("Error: Expected at least 6 reports in database.")
            sys.exit(1)

        # 3. Test Overview calculations
        overview = service.compute_vessel_overview(vessel.vessel_name, reports)
        print("\n=== Vessel Overview ===")
        print(overview)
        assert overview["vesselName"] == "DE XI"
        assert overview["totalReports"] == len(reports)
        assert overview["firstReportDate"] is not None
        assert overview["latestReportDate"] is not None
        assert overview["reportingCoverage"] > 0.0

        # 4. Test Voyage Performance calculations
        voyage = service.compute_voyage_performance(reports)
        print("\n=== Voyage Performance ===")
        print(voyage)
        print("Daily report stats:")
        for r in reports:
            print(f"Date: {r.report_date}, Cond: {r.vessel_condition}, Dist: {r.distance_sailed}, Speed: {r.speed_last_24hrs}")
        
        assert voyage["totalDistanceSailed"] >= 200.0
        assert voyage["maximumSpeed"] >= 11.5
        assert voyage["minimumSpeed"] <= 11.4
        # Distance-weighted speed calculation:
        print(f"Calculated Weighted Speed: {voyage['averageSpeed']}")
        assert voyage["averageSpeed"] > 0.0
        assert voyage["steamingDays"] > 0
        assert voyage["anchorageDays"] > 0

        # 5. Test Fuel Performance calculations
        fuel = service.compute_fuel_performance(reports)
        print("\n=== Fuel Performance ===")
        print(fuel)
        assert fuel["totalLsfoConsumed"] > 0.0
        assert fuel["totalMgoConsumed"] > 0.0

        # 6. Test ROB Drawdown
        rob = service.compute_rob_analytics(reports)
        print("\n=== ROB Analytics ===")
        print(rob)
        assert rob["lsfo"]["opening"] > rob["lsfo"]["closing"]
        assert rob["lsfo"]["drawdown"] > 0.0

        # 7. Test Weather
        weather = service.compute_weather_analytics(reports, severe_threshold=5.0)
        print("\n=== Weather Analytics ===")
        print(weather)
        assert weather["averageBeaufort"] is not None
        assert weather["severeWeatherDays"] >= 0

        # 8. Test Machinery
        machinery = service.compute_machinery_analytics(reports)
        print("\n=== Machinery Analytics ===")
        print(machinery)
        assert machinery["totalAuxiliaryEngineHours"] >= 0

        # 9. Test Trends
        fuel_trend = service.extract_fuel_trend(reports)
        speed_trend = service.extract_speed_trend(reports)
        weather_trend = service.extract_weather_trend(reports)
        print("\n=== Trend Check ===")
        print(f"Fuel Trend size: {len(fuel_trend)}")
        print(f"Speed Trend size: {len(speed_trend)}")
        print(f"Weather Trend size: {len(weather_trend)}")
        assert len(fuel_trend) == len(reports)
        assert len(speed_trend) == len(reports)
        assert len(weather_trend) == len(reports)

        # 10. Test Timeline
        timeline = service.extract_timeline(reports)
        print("\n=== Timeline Check ===")
        print(f"Timeline size: {len(timeline)}")
        assert len(timeline) == len(reports)

        print("\nAll Phase 3B Analytics Tests PASSED successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
