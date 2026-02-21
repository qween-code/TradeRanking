"""Authentication endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from app.models import LoginRequest, LoginResponse, UserCreate, UserResponse, APIResponse
from app.auth import create_access_token, get_current_user
from app.database import get_db
from uuid import uuid4

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=APIResponse)
async def register(user: UserCreate):
    db = get_db()
    # Check if email exists
    existing = db.table("users").select("id").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data = {
        "id": str(uuid4()),
        "email": user.email,
        "full_name": user.full_name,
        "company_name": user.company_name,
        "phone": user.phone,
        "role": user.role.value,
        "is_admin": user.role.value == "admin",
        "password_hash": user.password,  # In production: hash with bcrypt
    }
    result = db.table("users").insert(user_data).execute()
    return APIResponse(success=True, message="User registered", data={"user_id": user_data["id"]})


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    db = get_db()
    result = db.table("users").select("*").eq("email", req.email).execute()

    if not result.data:
        # Auto-create for demo mode
        user_id = str(uuid4())
        user_data = {
            "id": user_id,
            "email": req.email,
            "full_name": req.email.split("@")[0],
            "role": "buyer",
            "is_admin": False,
            "password_hash": req.password,
        }
        db.table("users").insert(user_data).execute()
        user = user_data
    else:
        user = result.data[0]
        # In production: verify password with bcrypt
        if user.get("password_hash") != req.password:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user["id"], user["email"], user.get("role", "buyer"))

    return LoginResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            company_name=user.get("company_name"),
            phone=user.get("phone"),
            role=user.get("role", "buyer"),
            is_admin=user.get("is_admin", False),
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return user
