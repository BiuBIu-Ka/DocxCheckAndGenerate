from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router

app = FastAPI(
    title="军工软件文档智能编制与审查平台",
    version="0.1.0",
    summary="基于大模型与 GJB 规则引擎的文档生成与审查服务",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "gjb-doc-platform-server"}


app.include_router(api_router, prefix="/api")
