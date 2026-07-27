"""
Unit tests for local Clerk JWT/JWKS verification (app/api/deps.py).

This exercises _verify_clerk_token directly against a self-generated RSA
keypair — no live call to Clerk is involved or possible in CI/this sandbox.
_fetch_jwks is monkeypatched to return our own test JWKS so the test proves
the JOSE verification logic itself (signature check, kid matching, issuer
matching, expiry, sub -> User resolution) is correct, independent of
whether Clerk's real API is reachable.
"""
import time
import uuid

import pytest
from jose import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
from jose.utils import long_to_base64

from app.models import User, PlanTier

KID = "test-key-1"
TEST_ISSUER = "https://test-instance.clerk.accounts.dev"


def _b64(n: int) -> str:
    return long_to_base64(n).decode("ascii")


@pytest.fixture(scope="module")
def rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_numbers: RSAPublicNumbers = private_key.public_key().public_numbers()
    jwk = {
        "kty": "RSA",
        "kid": KID,
        "use": "sig",
        "alg": "RS256",
        "n": _b64(public_numbers.n),
        "e": _b64(public_numbers.e),
    }
    return private_key, jwk


@pytest.fixture(autouse=True)
def clerk_issuer(monkeypatch):
    """Configure the trusted issuer for every test in this module."""
    from app.api import deps
    monkeypatch.setattr(deps.settings, "CLERK_ISSUER", TEST_ISSUER)


def _pem(private_key) -> str:
    return private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("ascii")


def _make_token(
    private_key,
    clerk_id: str,
    exp_delta: int = 3600,
    kid: str = KID,
    issuer: str = TEST_ISSUER,
) -> str:
    now = int(time.time())
    claims = {"sub": clerk_id, "iss": issuer, "iat": now, "nbf": now, "exp": now + exp_delta}
    return jwt.encode(claims, _pem(private_key), algorithm="RS256", headers={"kid": kid})


@pytest.mark.asyncio
async def test_verify_clerk_token_accepts_valid_signed_jwt(db_session, rsa_keypair, monkeypatch):
    from app.api import deps

    private_key, jwk = rsa_keypair
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"

    user = User(clerk_id=clerk_id, email=f"{clerk_id}@example.com", plan_tier=PlanTier.free)
    db_session.add(user)
    await db_session.commit()

    async def fake_fetch_jwks(force_refresh: bool = False):
        return [jwk]

    monkeypatch.setattr(deps, "_fetch_jwks", fake_fetch_jwks)
    deps._jwks_cache["keys"] = []
    deps._jwks_cache["fetched_at"] = 0.0

    token = _make_token(private_key, clerk_id)
    result = await deps._verify_clerk_token(token, db_session)

    assert result is not None
    assert result.clerk_id == clerk_id


@pytest.mark.asyncio
async def test_verify_clerk_token_rejects_expired_jwt(db_session, rsa_keypair, monkeypatch):
    from app.api import deps

    private_key, jwk = rsa_keypair
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"

    user = User(clerk_id=clerk_id, email=f"{clerk_id}@example.com", plan_tier=PlanTier.free)
    db_session.add(user)
    await db_session.commit()

    async def fake_fetch_jwks(force_refresh: bool = False):
        return [jwk]

    monkeypatch.setattr(deps, "_fetch_jwks", fake_fetch_jwks)

    expired_token = _make_token(private_key, clerk_id, exp_delta=-3600)
    result = await deps._verify_clerk_token(expired_token, db_session)

    assert result is None


@pytest.mark.asyncio
async def test_verify_clerk_token_rejects_wrong_signature(db_session, rsa_keypair, monkeypatch):
    from app.api import deps

    _, jwk = rsa_keypair
    other_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"

    user = User(clerk_id=clerk_id, email=f"{clerk_id}@example.com", plan_tier=PlanTier.free)
    db_session.add(user)
    await db_session.commit()

    async def fake_fetch_jwks(force_refresh: bool = False):
        return [jwk]  # the *real* keypair's public JWK

    monkeypatch.setattr(deps, "_fetch_jwks", fake_fetch_jwks)

    # signed with a *different* private key than the one whose public JWK we serve
    forged_token = _make_token(other_private_key, clerk_id)
    result = await deps._verify_clerk_token(forged_token, db_session)

    assert result is None


@pytest.mark.asyncio
async def test_verify_clerk_token_rejects_wrong_issuer(db_session, rsa_keypair, monkeypatch):
    """A validly-signed token whose iss claim doesn't match our configured
    CLERK_ISSUER must be rejected — this is what stops verification being
    pointed at an attacker-controlled (or simply wrong) Clerk instance."""
    from app.api import deps

    private_key, jwk = rsa_keypair
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"

    user = User(clerk_id=clerk_id, email=f"{clerk_id}@example.com", plan_tier=PlanTier.free)
    db_session.add(user)
    await db_session.commit()

    async def fake_fetch_jwks(force_refresh: bool = False):
        return [jwk]

    monkeypatch.setattr(deps, "_fetch_jwks", fake_fetch_jwks)

    token = _make_token(private_key, clerk_id, issuer="https://some-other-instance.clerk.accounts.dev")
    result = await deps._verify_clerk_token(token, db_session)

    assert result is None


@pytest.mark.asyncio
async def test_verify_clerk_token_valid_jwt_no_matching_user_returns_none(db_session, rsa_keypair, monkeypatch):
    """A verified JWT for a clerk_id with no corresponding User row (e.g. the
    Clerk webhook never provisioned them) must not be treated as authenticated."""
    from app.api import deps

    private_key, jwk = rsa_keypair
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"  # deliberately never inserted into the DB

    async def fake_fetch_jwks(force_refresh: bool = False):
        return [jwk]

    monkeypatch.setattr(deps, "_fetch_jwks", fake_fetch_jwks)

    token = _make_token(private_key, clerk_id)
    result = await deps._verify_clerk_token(token, db_session)

    assert result is None


@pytest.mark.asyncio
async def test_verify_clerk_token_rejects_unknown_kid(db_session, rsa_keypair, monkeypatch):
    from app.api import deps

    private_key, jwk = rsa_keypair
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"

    user = User(clerk_id=clerk_id, email=f"{clerk_id}@example.com", plan_tier=PlanTier.free)
    db_session.add(user)
    await db_session.commit()

    async def fake_fetch_jwks(force_refresh: bool = False):
        return [jwk]  # only knows about KID, not "some-other-kid"

    monkeypatch.setattr(deps, "_fetch_jwks", fake_fetch_jwks)

    token = _make_token(private_key, clerk_id, kid="some-other-kid")
    result = await deps._verify_clerk_token(token, db_session)

    assert result is None


@pytest.mark.asyncio
async def test_verify_clerk_token_fails_closed_when_issuer_not_configured(db_session, rsa_keypair, monkeypatch):
    """If CLERK_ISSUER is blank (misconfiguration), verification must fail
    loudly rather than silently accept or crash on a malformed JWKS URL."""
    from app.api import deps

    monkeypatch.setattr(deps.settings, "CLERK_ISSUER", "")
    private_key, jwk = rsa_keypair
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"

    user = User(clerk_id=clerk_id, email=f"{clerk_id}@example.com", plan_tier=PlanTier.free)
    db_session.add(user)
    await db_session.commit()

    token = _make_token(private_key, clerk_id)
    result = await deps._verify_clerk_token(token, db_session)

    assert result is None
