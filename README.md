# Vessel Optimization Tool

A data-processing platform for vessel performance analysis. Uploaded files are transient inputs — the value lies in structured data extracted and stored in PostgreSQL.

## Architecture

```
Frontend (React/Vite/TypeScript)
  ↓  multipart/form-data
FastAPI (receive + validate)
  ↓
Parser Layer (extract structured data)
  ↓
Business Logic Layer (calculations, KPIs)
  ↓
PostgreSQL (persist structured data only)
```

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React, Vite, TypeScript, TailwindCSS, shadcn/ui |
| Backend  | FastAPI, Python                         |
| Database | PostgreSQL, SQLAlchemy, Alembic         |

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Create the database
# psql -U postgres -c "CREATE DATABASE vessel_db;"

# Run Alembic migrations (when models exist)
# alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vessel_db
CORS_ORIGINS=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:8000
```

## Project Roadmap

- [x] **Phase 1** — Upload Pipeline
- [ ] **Phase 2** — Noon Report Parser
- [ ] **Phase 3** — Vessel Performance Analytics
- [ ] **Phase 4** — PDF Report Generation
- [ ] **Phase 5** — Voyage Optimization & Weather Intelligence

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
