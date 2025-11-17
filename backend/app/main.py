from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import api, websocket

app = FastAPI(title="AI Voice Assistant (MVP)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router)
app.include_router(websocket.router)


@app.get("/healthz")
async def healthcheck() -> dict:
    return {"status": "ok"}

