from fastapi import APIRouter, Depends, HTTPException, Header, status
from app.core.supabase_client import get_supabase
from app.schemas import ImageAnalysisCreate, ImageAnalysisResponse
from supabase import Client
import hashlib
import json

router = APIRouter()

@router.post("/{image_id}", response_model=ImageAnalysisResponse)
async def cache_analysis(
    image_id: str,
    analysis: ImageAnalysisCreate,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Store/cache image analysis"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        # Verify image belongs to user
        image_response = supabase.table("images")\
            .select("id")\
            .eq("id", image_id)\
            .eq("user_id", str(user.user.id))\
            .single()\
            .execute()
        
        if not image_response.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Image not found or not owned by user")
        
        # Store analysis
        response = supabase.table("image_analysis").insert({
            "image_id": image_id,
            "analysis_text": analysis.analysis_text,
            "analysis_model": analysis.analysis_model,
            "cached": True,
        }).execute()
        
        analysis_data = response.data[0] if response.data else {}
        
        return ImageAnalysisResponse(
            id=analysis_data.get("id"),
            image_id=image_id,
            analysis_text=analysis_data.get("analysis_text"),
            analysis_model=analysis_data.get("analysis_model"),
            cached=analysis_data.get("cached"),
            created_at=analysis_data.get("created_at")
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{image_id}", response_model=ImageAnalysisResponse)
async def get_analysis(
    image_id: str,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Get cached analysis for image"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        # Verify image belongs to user
        image_response = supabase.table("images")\
            .select("id")\
            .eq("id", image_id)\
            .eq("user_id", str(user.user.id))\
            .single()\
            .execute()
        
        if not image_response.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Image not found or not owned by user")
        
        # Fetch analysis
        response = supabase.table("image_analysis")\
            .select("*")\
            .eq("image_id", image_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
        
        analysis_data = response.data
        
        return ImageAnalysisResponse(
            id=analysis_data["id"],
            image_id=analysis_data["image_id"],
            analysis_text=analysis_data["analysis_text"],
            analysis_model=analysis_data["analysis_model"],
            cached=analysis_data["cached"],
            created_at=analysis_data["created_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{image_id}")
async def clear_analysis_cache(
    image_id: str,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Clear cached analysis for image"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        # Verify image belongs to user
        image_response = supabase.table("images")\
            .select("id")\
            .eq("id", image_id)\
            .eq("user_id", str(user.user.id))\
            .single()\
            .execute()
        
        if not image_response.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Image not found or not owned by user")
        
        # Delete analysis
        supabase.table("image_analysis").delete()\
            .eq("image_id", image_id)\
            .execute()
        
        return {"message": "Analysis cache cleared"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
