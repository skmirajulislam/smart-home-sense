# Smart Home Sense

Monorepo structure:

- `frontend/` — React + Vite dashboard (simulated sensor data)
- `backend/` — FastAPI analysis server (prediction + explanation + persistence)

## Pipeline status

Target pipeline:

`Sensors -> ESP32 -> WiFi -> Backend Server -> Database -> Explanation Engine -> Dashboard`

Current implementation status:

- Sensor Layer: **Implemented (simulated in frontend)**
- Edge Layer (ESP32): **Mocked via API contract**
- Communication Layer (WiFi/MQTT/HTTP): **Implemented with HTTP telemetry APIs**
- Backend Layer: **Implemented (modular FastAPI)**
- Database Layer: **Implemented (SQLite + SQLAlchemy)**
- Explanation Layer: **Implemented (rule/model contribution + optional Groq LLM)**
- Frontend Dashboard: **Implemented and integrated with backend analyze API**

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

## Run backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python models/model.py
cd ..
uvicorn backend.app.main:app --reload --port 8000
```
