from fastapi import APIRouter, Depends, HTTPException, Header, status
from app.core.supabase_client import get_supabase
from app.schemas import GalleryItemCreate, GalleryItemResponse, ImageResponse
from supabase import Client
from uuid import UUID
from typing import List

router = APIRouter()

@router.post("/", response_model=GalleryItemResponse)
async def create_gallery_item(
    item: GalleryItemCreate,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Add image to gallery"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user_id = user.user.id
        
        # Create gallery item
        response = supabase.table("gallery_items").insert({
            "user_id": str(user_id),
            "image_id": str(item.image_id),
            "title": item.title,
            "description": item.description,
            "is_favorite": item.is_favorite,
        }).execute()
        
        gallery_data = response.data[0] if response.data else {}
        
        # Fetch image details
        image_response = supabase.table("images")\
            .select("*")\
            .eq("id", str(item.image_id))\
            .single()\
            .execute()
        
        image_data = image_response.data
        
        return GalleryItemResponse(
            id=gallery_data.get("id"),
            image=ImageResponse(
                id=image_data["id"],
                image_url=image_data["image_url"],
                prompt_id=image_data["prompt_id"],
                fal_image_id=image_data["fal_image_id"],
                generation_model=image_data["generation_model"],
                created_at=image_data["created_at"]
            ),
            title=gallery_data.get("title"),
            description=gallery_data.get("description"),
            is_favorite=gallery_data.get("is_favorite"),
            saved_at=gallery_data.get("saved_at")
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/", response_model=List[GalleryItemResponse])
async def get_gallery(
    is_favorite: bool = None,
    limit: int = 50,
    offset: int = 0,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Get user's gallery"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user_id = user.user.id
        
        # Build query
        query = supabase.table("gallery_items").select("*, images(*)")\
            .eq("user_id", str(user_id))
        
        if is_favorite is not None:
            query = query.eq("is_favorite", is_favorite)
        
        response = query.order("saved_at", desc=True)\
            .range(offset, offset + limit)\
            .execute()
        
        gallery_items = []
        for item in response.data:
            image_data = item.get("images")
            gallery_items.append(GalleryItemResponse(
                id=item["id"],
                image=ImageResponse(
                    id=image_data["id"],
                    image_url=image_data["image_url"],
                    prompt_id=image_data["prompt_id"],
                    fal_image_id=image_data["fal_image_id"],
                    generation_model=image_data["generation_model"],
                    created_at=image_data["created_at"]
                ),
                title=item.get("title"),
                description=item.get("description"),
                is_favorite=item.get("is_favorite"),
                saved_at=item.get("saved_at")
            ))
        
        return gallery_items
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/{gallery_item_id}", response_model=GalleryItemResponse)
async def update_gallery_item(
    gallery_item_id: str,
    item: GalleryItemCreate,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Update gallery item (title, description, favorite status)"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        # Update gallery item
        response = supabase.table("gallery_items").update({
            "title": item.title,
            "description": item.description,
            "is_favorite": item.is_favorite,
        }).eq("id", gallery_item_id)\
         .eq("user_id", str(user.user.id))\
         .execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gallery item not found")
        
        gallery_data = response.data[0]
        
        # Fetch image details
        image_response = supabase.table("images")\
            .select("*")\
            .eq("id", str(gallery_data["image_id"]))\
            .single()\
            .execute()
        
        image_data = image_response.data
        
        return GalleryItemResponse(
            id=gallery_data["id"],
            image=ImageResponse(
                id=image_data["id"],
                image_url=image_data["image_url"],
                prompt_id=image_data["prompt_id"],
                fal_image_id=image_data["fal_image_id"],
                generation_model=image_data["generation_model"],
                created_at=image_data["created_at"]
            ),
            title=gallery_data.get("title"),
            description=gallery_data.get("description"),
            is_favorite=gallery_data.get("is_favorite"),
            saved_at=gallery_data.get("saved_at")
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{gallery_item_id}")
async def delete_gallery_item(
    gallery_item_id: str,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Remove image from gallery"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        response = supabase.table("gallery_items").delete()\
            .eq("id", gallery_item_id)\
            .eq("user_id", str(user.user.id))\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gallery item not found")
        
        return {"message": "Gallery item deleted"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
