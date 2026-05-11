# Smart Home Sense Backend (FastAPI)

This backend exposes ML-ready APIs for your dashboard using a `.pkl` model file.

## Endpoints

1. `POST /predict`
2. `POST /explain`
3. `GET /health` (recommended extra endpoint)

## Request body (`/predict` and `/explain`)

```json
{
  "temperature": 38,
  "humidity": 85,
  "aqi": 180,
  "gas": 250,
  "motion": 1
}
```

## Example `/predict` response

```json
{
  "prediction": "Danger",
  "model_source": "pkl",
  "prediction_index": 2,
  "probabilities": {
    "Safe": 0.01,
    "Warning": 0.15,
    "Danger": 0.84
  }
}
```

## Example `/explain` response

```json
{
  "prediction": "Danger",
  "shap_values": {
    "gas": 45,
    "aqi": 32,
    "humidity": 15,
    "temperature": 8
  },
  "explanation": "Elevated gas and aqi are the primary drivers of dangerous conditions.",
  "model_source": "pkl"
}
```

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Model file location

Place your trained model at:

`backend/models/smart_home_model.pkl`

Or set:

`MODEL_PATH=/absolute/or/relative/path/to/model.pkl`

## Run server

```bash
cd /path/to/smart-home-sense
uvicorn backend.app.main:app --reload --port 8000
```
