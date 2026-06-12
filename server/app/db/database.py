
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text

SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./gjb_platform.db"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
AsyncSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)

Base = declarative_base()


async def ensure_sqlite_schema() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        result = await conn.execute(text("PRAGMA table_info(documents)"))
        document_columns = {row[1] for row in result.fetchall()}
        required_columns = {
            "structure_json": "TEXT",
            "template_file_name": "VARCHAR",
            "template_html": "TEXT",
            "rules_json": "TEXT",
            "terms_json": "TEXT",
            "generation_prompt": "TEXT",
            "generation_sources_json": "TEXT",
        }
        for column_name, column_type in required_columns.items():
            if column_name not in document_columns:
                await conn.execute(
                    text(f"ALTER TABLE documents ADD COLUMN {column_name} {column_type}")
                )

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
