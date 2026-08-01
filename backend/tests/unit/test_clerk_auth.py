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
from starlette.requests import Request

from app.models import User, PlanTier

KID = "test-key-1"
TEST_ISSUER = "https://test-instance.clerk.accounts.dev"


def _fake_request(headers: dict | None = None) -> Request:
    """Minimal Starlette Request for calling get_current_user/get_optional_user directly."""
    raw_headers = [
        (k.lower().encode(), v.encode()) for k, v in (headers or {}).items()
    ]
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/generations/",
        "headers": raw_headers,
        "query_string": b"",
        "client": ("test", 1234),
    }
    return Request(scope)


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
    nbf_delta: int = 0,
    kid: str = KID,
    issuer: str = TEST_ISSUER,
) -> str:
    now = int(time.time())
    claims = {"sub": clerk_id, "iss": issuer, "iat": now, "nbf": now + nbf_delta, "exp": now + exp_delta}
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
    result, _reason = await deps._verify_clerk_token(token, db_session)

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
    result, _reason = await deps._verify_clerk_token(expired_token, db_session)

    assert result is None


@pytest.mark.asyncio
async def test_verify_clerk_token_tolerates_small_clock_skew(db_session, rsa_keypair, monkeypatch):
    """A token whose nbf is a few seconds in the future (this host's clock
    running slightly behind Clerk's) must still be accepted within the
    configured leeway — zero tolerance here is a classic source of
    intermittent, hard-to-reproduce 401s on freshly-issued tokens."""
    from app.api import deps

    private_key, jwk = rsa_keypair
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"

    user = User(clerk_id=clerk_id, email=f"{clerk_id}@example.com", plan_tier=PlanTier.free)
    db_session.add(user)
    await db_session.commit()

    async def fake_fetch_jwks(force_refresh: bool = False):
        return [jwk]

    monkeypatch.setattr(deps, "_fetch_jwks", fake_fetch_jwks)

    token = _make_token(private_key, clerk_id, nbf_delta=15)  # within the 30s leeway
    result, _reason = await deps._verify_clerk_token(token, db_session)

    assert result is not None
    assert result.clerk_id == clerk_id


@pytest.mark.asyncio
async def test_verify_clerk_token_rejects_clock_skew_beyond_leeway(db_session, rsa_keypair, monkeypatch):
    """Confirms the leeway has a bound — this isn't a blanket bypass of nbf."""
    from app.api import deps

    private_key, jwk = rsa_keypair
    clerk_id = f"clerk_{uuid.uuid4().hex[:12]}"

    user = User(clerk_id=clerk_id, email=f"{clerk_id}@example.com", plan_tier=PlanTier.free)
    db_session.add(user)
    await db_session.commit()

    async def fake_fetch_jwks(force_refresh: bool = False):
        return [jwk]

    monkeypatch.setattr(deps, "_fetch_jwks", fake_fetch_jwks)

    token = _make_token(private_key, clerk_id, nbf_delta=300)  # well beyond the 30s leeway
    result, _reason = await deps._verify_clerk_token(token, db_session)

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
    result, _reason = await deps._verify_clerk_token(forged_token, db_session)

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
    result, _reason = await deps._verify_clerk_token(token, db_session)

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
    result, _reason = await deps._verify_clerk_token(token, db_session)

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
    result, _reason = await deps._verify_clerk_token(token, db_session)

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
    result, _reason = await deps._verify_clerk_token(token, db_session)

    assert result is None


# ── Dev-bypass gating (get_current_user / get_optional_user) ──────────────────
#
# These reproduce the actual bug reported in production: the dev bypass was
# gated on `not settings.is_production`, true for *any* APP_ENV other than
# exactly "production" (including unset/misconfigured). get_current_user's
# bypass defaults to a fake "dev-founder-001" user (silently "succeeding"
# with a fabricated identity), while get_optional_user's has no default and
# silently returns None — which is exactly GET-succeeds-with-fake-user /
# POST-401s-with-no-logs, observed in production. Fixed by requiring
# settings.is_development (exactly "development") instead.

@pytest.mark.asyncio
async def test_get_optional_user_bypass_does_not_trigger_in_production(db_session, monkeypatch):
    from app.api import deps

    monkeypatch.setattr(deps.settings, "APP_ENV", "production")
    monkeypatch.setattr(deps.settings, "CLERK_SECRET_KEY", "")  # misconfigured/missing

    request = _fake_request({"Authorization": "Bearer some-token"})
    result, _reason = await deps.get_optional_user(request, db_session)

    # Must fall through to real verification (and fail, since "some-token"
    # isn't a real JWT) rather than silently returning None via the bypass
    # with zero logging.
    assert result is None


@pytest.mark.asyncio
async def test_get_optional_user_bypass_does_not_trigger_when_app_env_unset_or_misconfigured(db_session, monkeypatch):
    """The actual production bug: APP_ENV missing/blank/mistyped (anything
    that isn't exactly "production") used to be treated as safe to bypass."""
    from app.api import deps

    for bad_value in ["", "staging", "Production", "prod"]:
        monkeypatch.setattr(deps.settings, "APP_ENV", bad_value)
        monkeypatch.setattr(deps.settings, "CLERK_SECRET_KEY", "")

        request = _fake_request({})  # no Authorization header at all
        result, _reason = await deps.get_optional_user(request, db_session)

        # Old behavior: silently returns None via the bypass (no log, no real
        # check performed). New behavior: still returns None here (no token),
        # but via the real "no bearer token" path, which does log. The
        # important guarantee either way is it never returns a *fake user*.
        assert result is None


@pytest.mark.asyncio
async def test_get_current_user_bypass_only_triggers_in_explicit_development(db_session, monkeypatch):
    from app.api import deps

    monkeypatch.setattr(deps.settings, "APP_ENV", "development")
    monkeypatch.setattr(deps.settings, "CLERK_SECRET_KEY", "")

    request = _fake_request({})
    user = await deps.get_current_user(request, db_session)

    assert user is not None
    assert user.clerk_id == "dev-founder-001"


@pytest.mark.asyncio
async def test_get_current_user_bypass_does_not_fabricate_user_outside_development(db_session, monkeypatch):
    """This is the core of the bug: previously, any non-"production" APP_ENV
    (including a blank/misconfigured one) would silently authenticate every
    request as a fabricated founder-tier user with no real Clerk check at
    all. Confirms that no longer happens for a non-development, non-production
    (i.e. misconfigured) APP_ENV."""
    from app.api import deps

    monkeypatch.setattr(deps.settings, "APP_ENV", "")  # unset/misconfigured
    monkeypatch.setattr(deps.settings, "CLERK_SECRET_KEY", "")

    request = _fake_request({})  # no Authorization header
    with pytest.raises(Exception):  # HTTPException(401) — real auth required now
        await deps.get_current_user(request, db_session)
