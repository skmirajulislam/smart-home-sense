# Smart Home Sense Backend

FastAPI backend implementing the current pipeline in software:

`Sensors (simulated frontend) -> Backend API -> Database -> Explanation Engine -> Dashboard`

The prediction API uses a trained model artifact (`backend/models/smart_home_model.pkl`) produced from
`backend/models/xiot_sensor_dataset_50000.csv`.

## Layers implemented

- Sensor Layer: simulated sensor payloads from frontend
- Edge/Communication Layer: modeled via telemetry ingest/analyze API contracts
- Backend Layer: FastAPI modular controllers/services/repositories
- Database Layer: SQLite via SQLAlchemy (`telemetry_events`, `analysis_events`)
- Explanation Layer: model contribution + optional Groq LLM enhancement
- Frontend Dashboard Layer: consumes `/api/v1/telemetry/analyze`

## API routes

### Core
- `GET /health`
- `POST /predict`
- `POST /explain`

### Versioned (recommended)
- `GET /api/v1/health`
- `POST /api/v1/predictions/predict`
- `POST /api/v1/predictions/explain`
- `POST /api/v1/telemetry/ingest`
- `POST /api/v1/telemetry/analyze`

## Security and reliability

- CORS allowlist from environment
- Trusted host validation
- Security headers middleware
- GZip compression
- IP+path request rate limiting (429 on overflow)
- `uvicorn --workers N` support for multi-process load distribution

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Train the model (required when dataset/model changes)

```bash
cd backend
source .venv/bin/activate
python models/model.py
```

This writes:

- `backend/models/smart_home_model.pkl` (model + metadata)
- `backend/models/smart_home_model_report.json` (metrics and class report)

## Run

```bash
cd /path/to/smart-home-sense
uvicorn backend.app.main:app --reload --port 8000
```

For higher concurrency:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
