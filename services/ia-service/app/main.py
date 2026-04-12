import os

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

PORT = int(os.getenv("PORT", "5010"))

app = FastAPI(
    title="IA Service - Fiado Auto",
    description="Serviço de IA para score de crédito e detecção de fraude",
    version="0.1.0",
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/model/info")
async def model_info():
    return {
        "service": "ia-service",
        "models": {
            "credit_score": {"version": None, "status": "not_deployed"},
            "fraud_score": {"version": None, "status": "not_deployed"},
        },
    }
