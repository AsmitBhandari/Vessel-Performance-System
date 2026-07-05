# VPRO — Voyage Performance & Route Optimization Platform

VPRO is a full-stack maritime analytics platform that transforms vessel Noon Reports into structured operational intelligence. The platform ingests operational reports, stores normalized voyage data in PostgreSQL, generates vessel performance analytics, and provides deterministic historical route recommendations for voyage planning.

**Live Application:** https://vpro.asmitlabs.me

---

# Features

## Report Ingestion

- Upload Noon Reports (.xlsx / .xls)
- Automatic parser detection
- Data validation
- Duplicate report detection
- Historical data persistence
- Vessel & voyage management

---

## Vessel Performance Analytics

- Operational KPI dashboard
- Fuel consumption analytics
- Speed & RPM trends
- Voyage timeline
- Weather analytics
- ROB (Remaining On Board) analysis
- Machinery utilization
- Operational status summaries
- Historical voyage analytics

---

## Historical Route Planner

- Historical corridor recommendations
- Port-to-port route selection
- Interactive voyage map
- Historical distance database
- Score breakdown
- Deterministic recommendation engine
- Explainable recommendation reasoning
- Route metadata and confidence scores

---

# Architecture

```
                    React + Vite + TypeScript
                              │
                              ▼
                  FastAPI REST API Backend
                              │
      ┌───────────────────────┴───────────────────────┐
      ▼                                               ▼
Parser Layer                                  Business Logic
(Noon Reports)                          Analytics & Route Engine
      │                                               │
      └───────────────────────┬───────────────────────┘
                              ▼
                   PostgreSQL Database
        (SQLAlchemy + Alembic Migrations)
```

Uploaded Excel reports are used as transient inputs. The platform extracts structured operational data and persists only the normalized information required for analytics and historical reporting.

---

# Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, Vite, TypeScript |
| UI | TailwindCSS, shadcn/ui |
| Backend | FastAPI, Python |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Database Migrations | Alembic |
| Mapping | Leaflet + OpenStreetMap |
| Deployment | Render |

---

# Project Structure

```
frontend/
backend/
sample_data/
docs/
```

---

# Getting Started

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

Configure environment variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/vessel_db
CORS_ORIGINS=http://localhost:5173
```

Run database migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Configure environment variables:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

---

# Database

The platform stores structured operational information instead of uploaded files.

Core entities include:

- Vessels
- Voyages
- Daily Reports
- Ports
- Historical Routes

Uploaded Excel reports are parsed and converted into normalized relational records for analytics, historical reporting, and voyage intelligence.

---

# API Documentation

After starting the backend:

**Swagger UI**

```
http://localhost:8000/docs
```

**ReDoc**

```
http://localhost:8000/redoc
```

---

# Deployment

**Production Application**

https://vpro.asmitlabs.me

**Backend**

FastAPI deployed on Render

---

# Current Capabilities

- Vessel report ingestion
- Automatic parser detection
- Historical report storage
- Duplicate detection
- Vessel & voyage management
- Operational analytics dashboard
- Fuel consumption analytics
- Weather analytics
- Machinery analytics
- Voyage timeline
- Interactive voyage mapping
- Historical route recommendation engine
- Explainable route scoring using deterministic business rules

---

# Design Philosophy

VPRO focuses on transparent and explainable maritime analytics. Rather than relying on opaque predictive systems, the platform currently uses deterministic business rules and historical operational data to generate insights and route recommendations. Its modular architecture allows future integration of additional maritime datasets such as weather observations, AIS data, and charter performance benchmarks.
