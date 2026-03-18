from fastapi import APIRouter, Depends, HTTPException, Header, status
from app.core.supabase_client import get_supabase
from app.schemas import ImageGenerate, ImageResponse, PromptResponse, FullImageResponse
from supabase import Client
from uuid import uuid4
import httpx
from typing import Optional

router = APIRouter()

@router.post("/generate", response_model=FullImageResponse)
async def generate_image(
    image_data: ImageGenerate,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Generate an image using Fal AI"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from token
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user_id = user.user.id
        
        # Store prompt
        prompt_response = supabase.table("prompts").insert({
            "user_id": str(user_id),
            "original_prompt": image_data.prompt,
            "refined_prompt": image_data.refined_prompt or image_data.prompt,
        }).execute()
        
        prompt_data = prompt_response.data[0] if prompt_response.data else {}
        prompt_id = prompt_data.get("id")
        
        # Call Fal AI to generate image (using Runware endpoint from frontend)
        # In production, you'd call Fal directly, but we'll assume it's done in frontend
        # and just store the result here
        
        # For now, return a placeholder
        image_id = str(uuid4())
        
        image_response = supabase.table("images").insert({
            "user_id": str(user_id),
            "prompt_id": prompt_id,
            "image_url": "",  # Will be updated after generation
            "generation_model": "fal-ai",
        }).execute()
        
        image_data_result = image_response.data[0] if image_response.data else {}
        
        return FullImageResponse(
            image=ImageResponse(
                id=image_data_result.get("id"),
                image_url=image_data_result.get("image_url"),
                prompt_id=prompt_id,
                fal_image_id=image_data_result.get("fal_image_id"),
                generation_model=image_data_result.get("generation_model"),
                created_at=image_data_result.get("created_at")
            ),
            prompt=PromptResponse(
                id=prompt_id,
                original_prompt=image_data.prompt,
                refined_prompt=image_data.refined_prompt,
                created_at=prompt_data.get("created_at")
            ),
            analysis=None
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/history", response_model=list[ImageResponse])
async def get_image_history(
    limit: int = 50,
    offset: int = 0,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Get user's image generation history"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user_id = user.user.id
        
        # Fetch images
        response = supabase.table("images")\
            .select("*")\
            .eq("user_id", str(user_id))\
            .order("created_at", desc=True)\
            .range(offset, offset + limit)\
            .execute()
        
        images = [
            ImageResponse(
                id=img["id"],
                image_url=img["image_url"],
                prompt_id=img["prompt_id"],
                fal_image_id=img["fal_image_id"],
                generation_model=img["generation_model"],
                created_at=img["created_at"]
            )
            for img in response.data
        ]
        
        return images
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{image_id}", response_model=FullImageResponse)
async def get_image_details(
    image_id: str,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Get image with its analysis"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        # Fetch image
        image_response = supabase.table("images")\
            .select("*")\
            .eq("id", image_id)\
            .eq("user_id", str(user.user.id))\
            .single()\
            .execute()
        
        image_data = image_response.data
        
        # Fetch prompt
        prompt_data = None
        if image_data.get("prompt_id"):
            prompt_response = supabase.table("prompts")\
                .select("*")\
                .eq("id", image_data["prompt_id"])\
                .single()\
                .execute()
            prompt_data = prompt_response.data
        
        # Fetch analysis
        analysis_data = None
        analysis_response = supabase.table("image_analysis")\
            .select("*")\
            .eq("image_id", image_id)\
            .single()\
            .execute()
        if analysis_response.data:
            analysis_data = analysis_response.data
        
        return FullImageResponse(
            image=ImageResponse(
                id=image_data["id"],
                image_url=image_data["image_url"],
                prompt_id=image_data["prompt_id"],
                fal_image_id=image_data["fal_image_id"],
                generation_model=image_data["generation_model"],
                created_at=image_data["created_at"]
            ),
            prompt=PromptResponse(
                id=prompt_data["id"],
                original_prompt=prompt_data["original_prompt"],
                refined_prompt=prompt_data["refined_prompt"],
                created_at=prompt_data["created_at"]
            ) if prompt_data else None,
            analysis=None  # Analysis handled in separate endpoint
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
