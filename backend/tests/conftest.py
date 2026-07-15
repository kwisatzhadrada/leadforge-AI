"""
Test configuration.
Uses SQLite in-memory with type adaptation for PostgreSQL-specific types.
All UUID values stored as strings in SQLite.
"""
import asyncio
import uuid
import pytest
import pytest_asyncio
from unittest.mock import MagicMock

# ── Patch PostgreSQL-specific types before importing models ───────────────────
import sqlalchemy.dialects.postgresql as pg_dialect
from sqlalchemy import JSON, String, TypeDecorator, CHAR

class _SQLiteUUID(TypeDecorator):
    """UUID stored as CHAR(36) text in SQLite, transparent to Python."""
    impl = CHAR(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        return value  # return as string; app code uses str(id) in responses

pg_dialect.UUID = lambda **kw: _SQLiteUUID()  # type: ignore
pg_dialect.JSONB = JSON  # type: ignore

# ── Now import app modules ────────────────────────────────────────────────────
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.models import Base
from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_user

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
TEST_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    factory = sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = TEST_USER_ID
    user.clerk_id = "clerk_test_123"
    user.email = "test@example.com"
    user.full_name = "Test User"
    user.plan_tier = MagicMock(value="pro")
    user.generations_used = 0
    user.role = MagicMock(value="user")
    user.is_active = True
    user.is_founder = False
    user.stripe_customer_id = None
    return user


@pytest_asyncio.fixture
async def client(db_session, mock_user):
    async def override_db():
        yield db_session

    async def override_user():
        return mock_user

    async def override_optional_user():
        return mock_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_optional_user] = override_optional_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def anon_client(db_session):
    async def override_db():
        yield db_session

    async def override_optional_user():
        return None

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_optional_user] = override_optional_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
