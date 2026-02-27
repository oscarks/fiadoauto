import os

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

PORT = int(os.getenv("PORT", "5010"))

app = FastAPI(
    title="FiadoAuto IA Service",
    description="Serviço de IA para score de crédito e detecção de fraude",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/model/info")
def model_info():
    return {"models": [], "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
