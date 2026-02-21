"""
JWT authentication and role-based access control (RBAC).
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from loguru import logger

from app.config import settings
from app.models import TokenData, UserRole, UserResponse
from app.database import get_db

security = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS = {
    UserRole.ADMIN: {"rfq:*", "supplier:*", "offer:*", "catalog:*", "verification:*", "user:*", "job:*"},
    UserRole.BUYER: {"rfq:create", "rfq:read", "rfq:update", "rfq:delete", "supplier:read", "offer:read", "catalog:read", "job:create", "job:read"},
    UserRole.SUPPLIER: {"rfq:read", "offer:create", "offer:read", "catalog:create", "catalog:read", "catalog:update", "catalog:delete"},
    UserRole.MANAGER: {"rfq:read", "rfq:update", "supplier:read", "offer:read", "catalog:read", "job:read"},
}


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expiration_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return TokenData(
            user_id=payload["sub"],
            email=payload["email"],
            role=UserRole(payload["role"]),
        )
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> UserResponse:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token_data = decode_token(credentials.credentials)
    db = get_db()
    result = db.table("users").select("*").eq("id", token_data.user_id).execute()

    if not result.data:
        # For mock mode, create user on the fly
        return UserResponse(
            id=token_data.user_id,
            email=token_data.email,
            role=token_data.role,
            is_admin=token_data.role == UserRole.ADMIN,
        )

    user_data = result.data[0]
    return UserResponse(**user_data)


async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[UserResponse]:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_role(*roles: UserRole):
    async def role_checker(user: UserResponse = Depends(get_current_user)):
        if user.role not in roles and not user.is_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Role '{user.role}' not authorized")
        return user
    return role_checker


def require_permission(permission: str):
    async def permission_checker(user: UserResponse = Depends(get_current_user)):
        user_perms = ROLE_PERMISSIONS.get(UserRole(user.role), set())
        resource, action = permission.split(":")
        has_wildcard = f"{resource}:*" in user_perms
        has_specific = permission in user_perms
        if not has_wildcard and not has_specific:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Permission '{permission}' required")
        return user
    return permission_checker
