from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.supabase_client import get_supabase
from app.schemas import UserRegister, UserLogin, UserProfile, TokenResponse
from supabase import Client

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister, supabase: Client = Depends(get_supabase)):
    """Register a new user"""
    try:
        # Sign up with Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })
        
        user = response.user
        session = response.session
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Create user profile in public.users table
        supabase.table("users").insert({
            "id": user.id,
            "email": user_data.email,
            "username": user_data.username,
        }).execute()
        
        return TokenResponse(
            access_token=session.access_token if session else "",
            token_type="bearer",
            user=UserProfile(
                id=user.id,
                email=user_data.email,
                username=user_data.username,
                avatar_url=None,
                bio=None,
                created_at=user.created_at
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, supabase: Client = Depends(get_supabase)):
    """Login user"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password,
        })
        
        user = response.user
        session = response.session
        
        if not user or not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Fetch user profile
        user_profile = supabase.table("users").select("*").eq("id", user.id).execute()
        profile_data = user_profile.data[0] if user_profile.data else {}
        
        return TokenResponse(
            access_token=session.access_token,
            token_type="bearer",
            user=UserProfile(
                id=user.id,
                email=user_data.email,
                username=profile_data.get("username"),
                avatar_url=profile_data.get("avatar_url"),
                bio=profile_data.get("bio"),
                created_at=user.created_at
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.get("/me", response_model=UserProfile)
async def get_current_user(token: str, supabase: Client = Depends(get_supabase)):
    """Get current user profile"""
    try:
        user = supabase.auth.get_user(token)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized"
            )
        
        user_profile = supabase.table("users").select("*").eq("id", user.user.id).execute()
        profile_data = user_profile.data[0] if user_profile.data else {}
        
        return UserProfile(
            id=user.user.id,
            email=user.user.email,
            username=profile_data.get("username"),
            avatar_url=profile_data.get("avatar_url"),
            bio=profile_data.get("bio"),
            created_at=user.user.created_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )
