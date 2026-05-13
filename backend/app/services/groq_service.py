import json

import httpx

from ..core.config import settings


class GroqService:
    async def explain(
        self,
        prediction: str,
        shap_values: dict[str, int],
        input_payload: dict[str, float | int],
        base_explanation: str,
    ) -> tuple[str, str]:
        if not settings.groq_api_key:
            return base_explanation, "fallback"

        prompt = (
            "You are an IoT home safety explanation engine.\n"
            "Return one concise sentence for a dashboard user.\n"
            f"Prediction: {prediction}\n"
            f"Feature influence (%): {json.dumps(shap_values)}\n"
            f"Input sensors: {json.dumps(input_payload)}\n"
            f"Draft explanation: {base_explanation}\n"
            "Constraints: no markdown, no bullet points, under 35 words."
        )

        body = {
            "model": settings.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 80,
        }
        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=settings.groq_timeout_seconds) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=body,
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"].strip()
                return content or base_explanation, "groq"
        except (KeyError, IndexError, httpx.HTTPError):
            return base_explanation, "fallback"
