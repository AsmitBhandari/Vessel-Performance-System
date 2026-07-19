import os
import base64
import time
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk, JWTError
from pydantic import BaseModel

# Security schema for bearer token extraction
security = HTTPBearer()

class UserInfo(BaseModel):
    id: str
    email: str

JWKS_CACHE = None
JWKS_CACHE_EXPIRY = 0
CACHE_TTL = 3600  # 1 hour cache TTL

def get_jwks(supabase_url: str):
    global JWKS_CACHE, JWKS_CACHE_EXPIRY
    now = time.time()
    if JWKS_CACHE is None or now > JWKS_CACHE_EXPIRY:
        try:
            jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
            response = requests.get(jwks_url, timeout=5)
            response.raise_for_status()
            JWKS_CACHE = response.json()
            JWKS_CACHE_EXPIRY = now + CACHE_TTL
        except Exception as e:
            if JWKS_CACHE:
                print(f"Warning: Failed to fetch JWKS, using cached keys. Error: {e}")
                return JWKS_CACHE
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch Supabase JWKS for verification: {str(e)}"
            )
    return JWKS_CACHE

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInfo:
    """
    FastAPI dependency to verify Supabase JWT and extract user information.
    Supports both ES256 (asymmetric JWKS verification) and HS256 (symmetric secret verification).
    """
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        kid = header.get("kid")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token format: {str(e)}"
        )

    try:
        if alg == "ES256":
            supabase_url = os.getenv("SUPABASE_URL")
            if not supabase_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_URL is not configured on the server, required for ES256 token verification."
                )
            jwks = get_jwks(supabase_url)
            keys = jwks.get("keys", [])
            key_dict = None
            if kid:
                key_dict = next((k for k in keys if k.get("kid") == kid), None)
            if not key_dict and keys:
                # Fallback to the first key if kid is missing or not found
                key_dict = keys[0]
            if not key_dict:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No matching public key found in JWKS for ES256 verification."
                )
            
            key = jwk.construct(key_dict)
            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256"],
                options={"verify_aud": True},
                audience="authenticated"
            )
        else:
            jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
            if not jwt_secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="JWT secret is not configured on the server."
                )
            
            # Decode base64 secret if possible, as Supabase signs JWTs with the decoded bytes
            try:
                padded_secret = jwt_secret + "=" * (4 - len(jwt_secret) % 4) if len(jwt_secret) % 4 != 0 else jwt_secret
                key = base64.b64decode(padded_secret)
            except Exception:
                key = jwt_secret

            try:
                payload = jwt.decode(
                    token,
                    key,
                    algorithms=["HS256"],
                    options={"verify_aud": True},
                    audience="authenticated"
                )
            except JWTError as e1:
                # Fallback to raw string just in case
                try:
                    payload = jwt.decode(
                        token,
                        jwt_secret,
                        algorithms=["HS256"],
                        options={"verify_aud": True},
                        audience="authenticated"
                    )
                except JWTError as e2:
                    print(f"JWT verification failed. Base64-decoded error: {e1}. Raw key error: {e2}")
                    raise e1
        
        user_id: str = payload.get("sub")
        email: str = payload.get("email", "")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing user identification."
            )
            
        return UserInfo(id=user_id, email=email)
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )

