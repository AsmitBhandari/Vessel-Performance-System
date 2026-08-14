# VPRO - Vessel Performance & Route Optimization Platform

A full-stack maritime analytics platform that transforms vessel Noon Reports into structured operational intelligence, provides vessel performance dashboards, and delivers historical route recommendations for voyage planning.

---

## Live Demo

Live Demo: https://vpro.asmitlabs.me

---

## Demo Video

Demo Video: Not required for the current TBI-GEU submission.

---

## Screenshots

![VPRO Landing Page](docs/screenshots/landing-page.png)
*VPRO Landing Page - Platform overview and core features*

![VPRO Dashboard](docs/screenshots/dashboard.png)
*VPRO Operational Dashboard - Vessel KPIs, fuel consumption, speed trends, and voyage analytics*

![VPRO Noon Report Upload](docs/screenshots/upload-report.png)
*Noon Report Upload & Parser Interface - Excel report parsing, validation, and structured ingestion*

![VPRO Route Optimization](docs/screenshots/route-planner.png)
*Historical Route Planner - Port-to-port corridor selection, interactive map, and route scoring breakdown*

---

## Features

### 1. Noon Report Upload & Dynamic Ingestion
- Upload Excel Noon Reports (`.xlsx` / `.xls`).
- Dynamic sheet detection, row header anchor resolution, and automated field mapping.
- Data validation, unit normalization, and pre-ingestion schema checks.
- UPSERT database deduplication to prevent duplicate report entries.

### 2. Vessel Performance Analytics
- **Operational KPI Cards**: Monitoring average speed, main engine RPM, daily fuel oil consumption, and Remaining On Board (ROB) fuel metrics.
- **Trend Charts**: Historical speed, RPM, and fuel consumption trends over selected date ranges.
- **Voyage Timeline**: Sequential timeline view of operational daily reports.
- **Weather & Machinery Monitoring**: Sea state, Beaufort wind force, and machinery operational status.

### 3. Historical Route Planner
- Port-to-port route selection across major maritime trade corridors (e.g., Shanghai to Rotterdam, Singapore to Hamburg).
- Interactive voyage mapping using Leaflet and OpenStreetMap.
- Haversine distance calculations and coordinate tracking.
- Deterministic route scoring engine evaluating distance, historical performance, and weather risk.
- Explainable recommendation breakdown with metadata and confidence scores.

### 4. AI Chat Assistant
- Context-aware conversational assistant trained on vessel daily report data.
- Server-Sent Events (SSE) streaming responses.
- Integration with LLM providers (Google Gemini / OpenAI).

### 5. Authentication & Integration
- Supabase authentication integration for secure user login and registration.
- Fully integrated RESTful backend API powered by FastAPI.
- Relational database persistence with PostgreSQL and SQLAlchemy ORM.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Components** | Tailwind CSS, Radix UI, Lucide Icons |
| **Mapping & Geospatial** | Leaflet, React-Leaflet |
| **Backend Framework** | Python 3.10+, FastAPI, Uvicorn |
| **Database & ORM** | PostgreSQL, SQLAlchemy, Alembic |
| **Data Processing** | OpenPyXL, Pydantic |
| **AI & LLM Services** | Google GenAI SDK, OpenAI SDK |
| **Authentication** | Supabase Auth |
| **Deployment** | Render (Backend API), Vercel / Cloudflare / Custom Domain (Frontend) |

---

## Setup Instructions

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: v14.0 or higher (or a hosted Supabase PostgreSQL database)

---

### Clone

```bash
git clone https://github.com/AsmitBhandari/Vessel-Performance-System.git
cd Vessel-Performance-System
```

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Update `DATABASE_URL` with your PostgreSQL connection string and configure `CORS_ORIGINS`.

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will be available at `http://localhost:8000`.

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install Node modules:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_URL=http://localhost:8000`.

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will be available at `http://localhost:5173`.

---

### Environment Variables

#### Backend (`backend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/vessel_db` |
| `CORS_ORIGINS` | Allowed origins for CORS requests | `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_JWT_SECRET` | Secret key for verifying Supabase JWTs | `your_jwt_secret` |
| `AI_PROVIDER` | LLM provider for chat assistant (`gemini` or `openai`) | `gemini` |
| `AI_MODEL` | Specific LLM model identifier | `gemini-1.5-flash` |
| `AI_API_KEY` | API key for Gemini or OpenAI | `your_api_key` |

#### Frontend (`frontend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `VITE_API_URL` | URL of the backend REST API | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key | `your_anon_key` |

---

### Production Build

To build the frontend for production deployment:

```bash
cd frontend
npm run build
```

The static output will be generated in the `frontend/dist/` directory.

---

## API Documentation

Once the backend server is running, interactive API documentation is automatically generated by FastAPI:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Core Endpoints Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Health check endpoint for monitoring |
| `POST` | `/api/upload-report` | Validates and reads uploaded Noon Report file into memory |
| `POST` | `/api/parse-report` | Dynamically parses Excel Noon Report into structured JSON |
| `POST` | `/api/ingest-report` | Parses and ingests daily report data into PostgreSQL with deduplication |
| `GET` | `/api/vessels` | List all registered vessels |
| `GET` | `/api/reports` | Query daily reports filtered by vessel name and date range |
| `GET` | `/api/reports/summary` | Aggregate summary statistics across ingested reports |
| `GET` | `/api/analytics/kpis` | Calculate operational KPIs for a vessel |
| `GET` | `/api/analytics/trends` | Retrieve performance trends (speed, fuel, RPM, weather) |
| `GET` | `/api/analytics/timeline` | Fetch chronological voyage report timeline |
| `GET` | `/api/routes/positions` | Get vessel GPS positions and calculated Haversine distance |
| `GET` | `/api/ports` | List available ports for route selection |
| `GET` | `/api/routes/corridors` | Search historical trade corridors by origin and destination ports |
| `POST` | `/api/routes/recommend` | Evaluate and rank route options with deterministic score breakdown |
| `POST` | `/api/chat/sessions` | Create a new AI assistant chat session |
| `GET` | `/api/chat/sessions` | List user chat sessions |
| `POST` | `/api/chat/sessions/{id}/stream` | Stream AI assistant response via Server-Sent Events (SSE) |

---

## Architecture

### System Data Flow

```
                      React + Vite + TypeScript Frontend
                                      │
                                      ▼
                          FastAPI REST API Backend
                                      │
       ┌──────────────────────────────┴──────────────────────────────┐
       ▼                                                             ▼
Parser & Ingestion Layer                                    Business Logic Engine
(Excel Noon Reports)                                  (Analytics, KPIs & Route Engine)
       │                                                             │
       └──────────────────────────────┬──────────────────────────────┘
                                      ▼
                             PostgreSQL Database
                       (SQLAlchemy + Alembic Migrations)
```

---

### Folder Structure

```
vessel-performance-system/
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── api/              # FastAPI router endpoints
│   │   ├── database/         # Database connection & session setup
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── parser/           # Excel Noon Report parsing logic
│   │   ├── seeds/            # Database seed scripts
│   │   ├── services/         # Analytics, route engine, & chat services
│   │   ├── config.py         # Application configuration
│   │   └── main.py           # FastAPI entrypoint
│   ├── alembic.ini           # Alembic configuration
│   ├── Dockerfile            # Container definition for backend
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variable template
├── frontend/
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React Context providers (Auth, Theme)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Page layouts & navigation
│   │   ├── lib/              # Utility helpers
│   │   ├── pages/            # View pages (Dashboard, Upload, Route Planner, Chat)
│   │   ├── router/           # React Router configuration
│   │   ├── services/         # API client service layer
│   │   ├── types/            # TypeScript interface definitions
│   │   ├── App.tsx           # Main application wrapper
│   │   ├── index.css         # Styling entrypoint
│   │   └── main.tsx          # React application entrypoint
│   ├── Dockerfile            # Container definition for frontend
│   ├── package.json          # Node dependencies & scripts
│   ├── vite.config.ts        # Vite build configuration
│   └── .env.example          # Environment variable template
├── sample_data/              # Sample Noon Reports (.xlsx) for testing
├── docs/
│   └── screenshots/          # Application screenshots directory
│       └── .gitkeep
├── docker-compose.yml        # Docker Compose configuration
├── Schema_Diagram.pdf        # Database schema ER diagram
├── technical_implementation_report.md
└── README.md                 # Project documentation
```

---

## Known Limitations

- **Report Format Dependency**: Excel report parsing relies on supported field alias mappings. Reports with non-standard layouts may require adding custom column aliases.
- **Route Scoring Heuristics**: Route recommendations utilize historical baseline corridor data and deterministic scoring rules rather than live satellite weather data feeds.
- **AI Assistant API Key Requirement**: Interactive AI chat functionality requires valid LLM credentials (`AI_API_KEY`) configured in the backend environment.
- **Free-Tier Hosting Latency**: Production backend hosted on free-tier Render instances may experience cold-start delays on initial requests.

---

## Credits & Acknowledgements

This project was developed during the **AI-Assisted Full Stack Development Internship** at **Technology Business Incubator, Graphic Era University (TBI-GEU)**.

- **Developer**: Asmit Bhandari
- **Institution**: Technology Business Incubator, Graphic Era University (TBI-GEU)
- **Program**: AI-Assisted Full Stack Development Internship
- **AI Tooling**: AI-assisted development tools (Google Antigravity / Gemini) were utilized during development for architectural planning, code optimization, and rapid prototyping.
