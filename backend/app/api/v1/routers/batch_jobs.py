from fastapi import APIRouter, Depends, HTTPException, Header, status, BackgroundTasks
from app.core.supabase_client import get_supabase
from app.schemas import BatchJobCreate, BatchJobResponse, BatchJobDetailResponse
from supabase import Client
from uuid import uuid4
from typing import List
import asyncio

router = APIRouter()

@router.post("/", response_model=BatchJobResponse)
async def create_batch_job(
    job: BatchJobCreate,
    background_tasks: BackgroundTasks,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Create a batch image generation job"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user_id = user.user.id
        
        # Create batch job
        response = supabase.table("batch_jobs").insert({
            "user_id": str(user_id),
            "job_name": job.job_name,
            "prompts": job.prompts,
            "status": "pending",
            "total_images": len(job.prompts),
        }).execute()
        
        batch_data = response.data[0] if response.data else {}
        batch_job_id = batch_data.get("id")
        
        # Start batch processing in background
        background_tasks.add_task(process_batch_job, batch_job_id, job.prompts, user_id, supabase)
        
        return BatchJobResponse(
            id=batch_job_id,
            job_name=batch_data.get("job_name"),
            status=batch_data.get("status"),
            total_images=batch_data.get("total_images"),
            generated_images=0,
            failed_images=0,
            created_at=batch_data.get("created_at"),
            completed_at=None
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{batch_job_id}", response_model=BatchJobDetailResponse)
async def get_batch_job(
    batch_job_id: str,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """Get batch job details"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        # Fetch batch job
        response = supabase.table("batch_jobs")\
            .select("*")\
            .eq("id", batch_job_id)\
            .eq("user_id", str(user.user.id))\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch job not found")
        
        batch_data = response.data
        
        # Fetch associated images
        images_response = supabase.table("batch_job_images")\
            .select("image_id, images(*)")\
            .eq("batch_job_id", batch_job_id)\
            .execute()
        
        images = []
        for item in images_response.data:
            if item.get("images"):
                image_data = item["images"]
                images.append({
                    "id": image_data["id"],
                    "image_url": image_data["image_url"],
                    "prompt_id": image_data["prompt_id"],
                    "fal_image_id": image_data["fal_image_id"],
                    "generation_model": image_data["generation_model"],
                    "created_at": image_data["created_at"]
                })
        
        return BatchJobDetailResponse(
            id=batch_data["id"],
            job_name=batch_data.get("job_name"),
            status=batch_data.get("status"),
            total_images=batch_data.get("total_images"),
            generated_images=batch_data.get("generated_images"),
            failed_images=batch_data.get("failed_images"),
            created_at=batch_data.get("created_at"),
            completed_at=batch_data.get("completed_at"),
            prompts=batch_data.get("prompts", []),
            images=images
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/", response_model=List[BatchJobResponse])
async def list_batch_jobs(
    status_filter: str = None,
    limit: int = 50,
    offset: int = 0,
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    """List user's batch jobs"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user_id = user.user.id
        
        # Build query
        query = supabase.table("batch_jobs")\
            .select("*")\
            .eq("user_id", str(user_id))
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        response = query.order("created_at", desc=True)\
            .range(offset, offset + limit)\
            .execute()
        
        jobs = [
            BatchJobResponse(
                id=job["id"],
                job_name=job.get("job_name"),
                status=job.get("status"),
                total_images=job.get("total_images"),
                generated_images=job.get("generated_images"),
                failed_images=job.get("failed_images"),
                created_at=job.get("created_at"),
                completed_at=job.get("completed_at")
            )
            for job in response.data
        ]
        
        return jobs
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

async def process_batch_job(batch_job_id: str, prompts: list, user_id: str, supabase: Client):
    """Background task to process batch images"""
    try:
        # Update job status to processing
        supabase.table("batch_jobs").update({
            "status": "processing",
            "started_at": "now()"
        }).eq("id", batch_job_id).execute()
        
        generated_count = 0
        failed_count = 0
        
        # Process each prompt
        for prompt in prompts:
            try:
                # Create batch job image record
                batch_image = supabase.table("batch_job_images").insert({
                    "batch_job_id": batch_job_id,
                    "prompt": prompt,
                    "status": "processing",
                }).execute()
                
                batch_image_data = batch_image.data[0] if batch_image.data else {}
                batch_image_id = batch_image_data.get("id")
                
                # In production, call Fal AI here to generate image
                # For now, we'll just mark as completed
                
                # Create image record
                image_response = supabase.table("images").insert({
                    "user_id": str(user_id),
                    "image_url": f"https://placeholder-image-{uuid4()}.jpg",
                    "generation_model": "fal-ai",
                }).execute()
                
                image_data = image_response.data[0] if image_response.data else {}
                image_id = image_data.get("id")
                
                # Update batch job image with image_id
                supabase.table("batch_job_images").update({
                    "image_id": image_id,
                    "status": "completed"
                }).eq("id", batch_image_id).execute()
                
                generated_count += 1
            except Exception as e:
                failed_count += 1
                if batch_image_id:
                    supabase.table("batch_job_images").update({
                        "status": "failed",
                        "error_message": str(e)
                    }).eq("id", batch_image_id).execute()
        
        # Mark job as completed
        supabase.table("batch_jobs").update({
            "status": "completed",
            "generated_images": generated_count,
            "failed_images": failed_count,
            "completed_at": "now()"
        }).eq("id", batch_job_id).execute()
    
    except Exception as e:
        # Mark job as failed
        supabase.table("batch_jobs").update({
            "status": "failed",
            "error_message": str(e),
            "completed_at": "now()"
        }).eq("id", batch_job_id).execute()
