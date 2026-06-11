
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.db.database import engine, Base

app = FastAPI(
    title="军工软件文档智能编制与审查平台",
    version="1.0.0",
    description="生产级生产力工具",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Create tables if not exist
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "gjb-doc-platform-server"}

app.include_router(api_router, prefix="/api")
