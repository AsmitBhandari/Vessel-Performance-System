"""
Seed script for ports and historical routes.

Usage:
    cd backend
    python -m app.seeds.seed_routes
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from app.database.connection import SessionLocal, engine, Base
from app.models.port import Port
from app.models.historical_route import HistoricalRoute


# ── Port Seed Data (~20 major commercial ports) ──────────────────────────────

PORTS = [
    # East Asia
    {"name": "Singapore", "country": "Singapore", "latitude": 1.2644, "longitude": 103.8198, "code": "SGSIN"},
    {"name": "Shanghai", "country": "China", "latitude": 31.3602, "longitude": 121.6066, "code": "CNSHA"},
    {"name": "Hong Kong", "country": "China", "latitude": 22.3039, "longitude": 114.1594, "code": "HKHKG"},
    {"name": "Busan", "country": "South Korea", "latitude": 35.1028, "longitude": 129.0403, "code": "KRPUS"},
    {"name": "Yokohama", "country": "Japan", "latitude": 35.4437, "longitude": 139.6380, "code": "JPYOK"},
    # South / Southeast Asia
    {"name": "Mumbai", "country": "India", "latitude": 18.9488, "longitude": 72.8344, "code": "INBOM"},
    {"name": "Colombo", "country": "Sri Lanka", "latitude": 6.9508, "longitude": 79.8426, "code": "LKCMB"},
    {"name": "Port Klang", "country": "Malaysia", "latitude": 3.0006, "longitude": 101.3928, "code": "MYPKG"},
    {"name": "Visakhapatnam", "country": "India", "latitude": 17.6868, "longitude": 83.2185, "code": "INVTZ"},
    # Middle East
    {"name": "Dubai (Jebel Ali)", "country": "UAE", "latitude": 25.0147, "longitude": 55.0653, "code": "AEJEA"},
    {"name": "Fujairah", "country": "UAE", "latitude": 25.1288, "longitude": 56.3534, "code": "AEFJR"},
    {"name": "Jeddah", "country": "Saudi Arabia", "latitude": 21.5169, "longitude": 39.1653, "code": "SAJED"},
    {"name": "Muscat", "country": "Oman", "latitude": 23.6139, "longitude": 58.5922, "code": "OMMCT"},
    # Europe
    {"name": "Rotterdam", "country": "Netherlands", "latitude": 51.9036, "longitude": 4.4930, "code": "NLRTM"},
    {"name": "Antwerp", "country": "Belgium", "latitude": 51.2603, "longitude": 4.3517, "code": "BEANR"},
    {"name": "Hamburg", "country": "Germany", "latitude": 53.5461, "longitude": 9.9661, "code": "DEHAM"},
    {"name": "Piraeus", "country": "Greece", "latitude": 37.9422, "longitude": 23.6463, "code": "GRPIR"},
    # Africa
    {"name": "Durban", "country": "South Africa", "latitude": -29.8587, "longitude": 31.0218, "code": "ZADUR"},
    {"name": "Port Said", "country": "Egypt", "latitude": 31.2653, "longitude": 32.3019, "code": "EGPSD"},
    # Americas
    {"name": "Houston", "country": "USA", "latitude": 29.7604, "longitude": -95.3698, "code": "USHOU"},
]


# ── Historical Route Seed Data ───────────────────────────────────────────────
# Distances from Admiralty Distance Tables and standard maritime references.

ROUTES = [
    # Singapore hub
    {
        "origin": "Singapore", "destination": "Mumbai",
        "route_name": "Traditional Route", "distance": 2480,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},  # Singapore
            {"lat": 2.88, "lon": 100.99},      # One Fathom Bank (Straits of Malacca)
            {"lat": 5.90, "lon": 80.58},       # South of Sri Lanka (Dondra Head)
            {"lat": 8.00, "lon": 77.50},       # Cape Comorin
            {"lat": 18.9488, "lon": 72.8344}   # Mumbai
        ],
        "weather_risk": "low", "fuel_estimate_mt": 112.0, "historical_success_rate": 98.5
    },
    {
        "origin": "Singapore", "destination": "Mumbai",
        "route_name": "Southern Route (via Colombo)",  "distance": 2550,
        "route_type": "alternative", "is_primary": False,
        "data_source": "historical_voyage_logs", "confidence": 0.85,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},  # Singapore
            {"lat": 2.88, "lon": 100.99},      # Straits of Malacca
            {"lat": 6.9508, "lon": 79.8426},   # Colombo Port
            {"lat": 18.9488, "lon": 72.8344}   # Mumbai
        ],
        "weather_risk": "low", "fuel_estimate_mt": 115.0, "historical_success_rate": 96.0
    },
    {
        "origin": "Singapore", "destination": "Dubai (Jebel Ali)",
        "route_name": "Traditional Route", "distance": 3320,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},  # Singapore
            {"lat": 5.92, "lon": 95.31},       # Banda Aceh (Straits exit)
            {"lat": 6.0, "lon": 80.0},         # South Sri Lanka
            {"lat": 12.0, "lon": 55.0},        # Arabian Sea transit
            {"lat": 25.0147, "lon": 55.0653}   # Dubai (Jebel Ali)
        ],
        "weather_risk": "medium", "fuel_estimate_mt": 150.0, "historical_success_rate": 97.5
    },
    {
        "origin": "Singapore", "destination": "Rotterdam",
        "route_name": "Suez Canal Route", "distance": 8440,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},  # Singapore
            {"lat": 6.9508, "lon": 79.8426},   # Colombo
            {"lat": 12.6, "lon": 43.3},        # Bab-el-Mandeb
            {"lat": 21.5, "lon": 38.5},        # Jeddah / Red Sea
            {"lat": 29.9, "lon": 32.5},        # Suez Canal
            {"lat": 36.0, "lon": 15.0},        # Mediterranean / Malta
            {"lat": 35.9, "lon": -5.3},        # Gibraltar Strait
            {"lat": 48.4, "lon": -5.1},        # Ushant
            {"lat": 51.9036, "lon": 4.4930}    # Rotterdam
        ],
        "weather_risk": "high", "fuel_estimate_mt": 380.0, "historical_success_rate": 95.0
    },
    {
        "origin": "Singapore", "destination": "Shanghai",
        "route_name": "East China Sea Route", "distance": 2330,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},  # Singapore
            {"lat": 4.0, "lon": 109.0},        # South China Sea south
            {"lat": 10.0, "lon": 114.0},       # South China Sea central
            {"lat": 22.0, "lon": 120.0},       # Taiwan Strait
            {"lat": 31.3602, "lon": 121.6066}  # Shanghai
        ],
        "weather_risk": "low", "fuel_estimate_mt": 105.0, "historical_success_rate": 98.0
    },
    {
        "origin": "Singapore", "destination": "Hong Kong",
        "route_name": "South China Sea Route", "distance": 1460,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},  # Singapore
            {"lat": 10.0, "lon": 110.0},       # South China Sea
            {"lat": 22.3039, "lon": 114.1594}  # Hong Kong
        ],
        "weather_risk": "low", "fuel_estimate_mt": 66.0, "historical_success_rate": 99.0
    },
    {
        "origin": "Singapore", "destination": "Colombo",
        "route_name": "Indian Ocean Route", "distance": 1620,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},  # Singapore
            {"lat": 2.88, "lon": 100.99},      # Malacca Straits
            {"lat": 5.92, "lon": 95.31},       # Straits exit
            {"lat": 6.9508, "lon": 79.8426}    # Colombo
        ],
        "weather_risk": "low", "fuel_estimate_mt": 73.0, "historical_success_rate": 98.8
    },
    {
        "origin": "Singapore", "destination": "Fujairah",
        "route_name": "Arabian Sea Route", "distance": 3100,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.90,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},
            {"lat": 2.88, "lon": 100.99},
            {"lat": 6.0, "lon": 80.0},
            {"lat": 10.0, "lon": 60.0},
            {"lat": 25.1288, "lon": 56.3534}   # Fujairah
        ],
        "weather_risk": "medium", "fuel_estimate_mt": 140.0, "historical_success_rate": 97.2
    },
    {
        "origin": "Singapore", "destination": "Jeddah",
        "route_name": "Red Sea Route", "distance": 4600,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.90,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},
            {"lat": 6.0, "lon": 80.0},
            {"lat": 12.6, "lon": 43.3},        # Bab-el-Mandeb
            {"lat": 21.5169, "lon": 39.1653}   # Jeddah
        ],
        "weather_risk": "high", "fuel_estimate_mt": 208.0, "historical_success_rate": 96.5
    },
    {
        "origin": "Singapore", "destination": "Yokohama",
        "route_name": "Pacific Coastal Route", "distance": 2900,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.90,
        "waypoints": [
            {"lat": 1.2644, "lon": 103.8198},
            {"lat": 12.0, "lon": 115.0},
            {"lat": 22.0, "lon": 125.0},
            {"lat": 30.0, "lon": 135.0},
            {"lat": 35.4437, "lon": 139.6380}  # Yokohama
        ],
        "weather_risk": "medium", "fuel_estimate_mt": 131.0, "historical_success_rate": 98.2
    },
    # Mumbai hub
    {
        "origin": "Mumbai", "destination": "Dubai (Jebel Ali)",
        "route_name": "Arabian Sea Route", "distance": 1190,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 18.9488, "lon": 72.8344},
            {"lat": 20.0, "lon": 65.0},
            {"lat": 24.0, "lon": 58.0},
            {"lat": 25.0147, "lon": 55.0653}
        ],
        "weather_risk": "low", "fuel_estimate_mt": 54.0, "historical_success_rate": 99.1
    },
    {
        "origin": "Mumbai", "destination": "Rotterdam",
        "route_name": "Suez Canal Route", "distance": 6340,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 18.9488, "lon": 72.8344},
            {"lat": 12.6, "lon": 43.3},
            {"lat": 29.9, "lon": 32.5},
            {"lat": 36.0, "lon": 15.0},
            {"lat": 35.9, "lon": -5.3},
            {"lat": 51.9036, "lon": 4.4930}
        ],
        "weather_risk": "high", "fuel_estimate_mt": 285.0, "historical_success_rate": 95.8
    },
    {
        "origin": "Mumbai", "destination": "Colombo",
        "route_name": "Coastal Route", "distance": 690,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "waypoints": [
            {"lat": 18.9488, "lon": 72.8344},
            {"lat": 12.0, "lon": 74.0},
            {"lat": 8.0, "lon": 76.5},
            {"lat": 6.9508, "lon": 79.8426}
        ],
        "weather_risk": "low", "fuel_estimate_mt": 31.0, "historical_success_rate": 99.5
    },
    # East Asia
    {
        "origin": "Shanghai", "destination": "Yokohama",
        "route_name": "East China Sea Route", "distance": 1050,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "weather_risk": "low", "fuel_estimate_mt": 47.0, "historical_success_rate": 98.9
    },
    {
        "origin": "Hong Kong", "destination": "Yokohama",
        "route_name": "Pacific Route", "distance": 1590,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.90,
        "weather_risk": "medium", "fuel_estimate_mt": 72.0, "historical_success_rate": 98.4
    },
    {
        "origin": "Shanghai", "destination": "Busan",
        "route_name": "Yellow Sea Route", "distance": 500,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "weather_risk": "low", "fuel_estimate_mt": 23.0, "historical_success_rate": 99.3
    },
    # Middle East – Europe
    {
        "origin": "Dubai (Jebel Ali)", "destination": "Rotterdam",
        "route_name": "Suez Canal Route", "distance": 6440,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "weather_risk": "high", "fuel_estimate_mt": 290.0, "historical_success_rate": 96.2
    },
    {
        "origin": "Jeddah", "destination": "Rotterdam",
        "route_name": "Mediterranean Route", "distance": 4600,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.90,
        "weather_risk": "medium", "fuel_estimate_mt": 208.0, "historical_success_rate": 97.0
    },
    # Long-haul
    {
        "origin": "Singapore", "destination": "Durban",
        "route_name": "Indian Ocean Route", "distance": 4580,
        "route_type": "historical", "is_primary": True,
        "data_source": "historical_voyage_logs", "confidence": 0.85,
        "weather_risk": "high", "fuel_estimate_mt": 206.0, "historical_success_rate": 94.5
    },
    {
        "origin": "Rotterdam", "destination": "Houston",
        "route_name": "Transatlantic Route", "distance": 5045,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.90,
        "weather_risk": "high", "fuel_estimate_mt": 227.0, "historical_success_rate": 93.8
    },
    {
        "origin": "Singapore", "destination": "Port Klang",
        "route_name": "Straits of Malacca Route", "distance": 200,
        "route_type": "historical", "is_primary": True,
        "data_source": "admiralty_distance_tables", "confidence": 0.95,
        "weather_risk": "low", "fuel_estimate_mt": 9.0, "historical_success_rate": 99.8
    },
]


def seed():
    """Create tables and seed ports + historical routes."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Clear existing data for a clean seed
        print("Clearing existing ports and routes...")
        db.query(HistoricalRoute).delete()
        db.query(Port).delete()
        db.commit()

        # ── Seed Ports ───────────────────────────────────────────────────
        port_map = {}
        for pdata in PORTS:
            existing = db.query(Port).filter(Port.name == pdata["name"]).first()
            if existing:
                port_map[pdata["name"]] = existing
                print(f"  Port already exists: {pdata['name']}")
            else:
                port = Port(**pdata)
                db.add(port)
                db.flush()
                port_map[pdata["name"]] = port
                print(f"  [+] Created port: {pdata['name']}")

        # ── Seed Routes ──────────────────────────────────────────────────
        for rdata in ROUTES:
            origin = port_map.get(rdata["origin"])
            dest = port_map.get(rdata["destination"])
            if not origin or not dest:
                print(f"  [-] Skipping route: {rdata['origin']} -> {rdata['destination']} (port not found)")
                continue

            # Check if route already exists
            existing = (
                db.query(HistoricalRoute)
                .filter(
                    HistoricalRoute.origin_port_id == origin.id,
                    HistoricalRoute.destination_port_id == dest.id,
                    HistoricalRoute.route_name == rdata["route_name"],
                )
                .first()
            )
            if existing:
                print(f"  Route already exists: {rdata['origin']} -> {rdata['destination']} ({rdata['route_name']})")
                continue

            route = HistoricalRoute(
                origin_port_id=origin.id,
                destination_port_id=dest.id,
                route_name=rdata["route_name"],
                route_distance_nm=rdata["distance"],
                route_type=rdata["route_type"],
                is_primary=rdata["is_primary"],
                data_source=rdata.get("data_source"),
                confidence=rdata.get("confidence"),
                waypoints=rdata.get("waypoints"),
                weather_risk=rdata.get("weather_risk"),
                fuel_estimate_mt=rdata.get("fuel_estimate_mt"),
                historical_success_rate=rdata.get("historical_success_rate"),
            )
            db.add(route)
            print(f"  [+] Created route: {rdata['origin']} -> {rdata['destination']} ({rdata['route_name']}, {rdata['distance']} NM)")

        db.commit()
        print(f"\nSeeding complete. Ports: {len(PORTS)}, Routes: {len(ROUTES)}")

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding ports and historical routes...\n")
    seed()
