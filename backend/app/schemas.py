from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# Auth models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: UUID
    email: str
    username: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserProfile

# Prompt models
class PromptCreate(BaseModel):
    original_prompt: str

class PromptResponse(BaseModel):
    id: UUID
    original_prompt: str
    refined_prompt: Optional[str]
    created_at: datetime

# Image models
class ImageGenerate(BaseModel):
    prompt: str
    refined_prompt: Optional[str] = None

class ImageResponse(BaseModel):
    id: UUID
    image_url: str
    prompt_id: Optional[UUID]
    fal_image_id: Optional[str]
    generation_model: Optional[str]
    created_at: datetime

# Analysis models
class ImageAnalysisCreate(BaseModel):
    image_id: UUID
    analysis_text: str
    analysis_model: str = "llama-3.3-70b-versatile"

class ImageAnalysisResponse(BaseModel):
    id: UUID
    image_id: UUID
    analysis_text: str
    analysis_model: str
    cached: bool
    created_at: datetime

# Gallery models
class GalleryItemCreate(BaseModel):
    image_id: UUID
    title: Optional[str] = None
    description: Optional[str] = None
    is_favorite: bool = False

class GalleryItemResponse(BaseModel):
    id: UUID
    image: ImageResponse
    title: Optional[str]
    description: Optional[str]
    is_favorite: bool
    saved_at: datetime

# Batch job models
class BatchJobCreate(BaseModel):
    job_name: str
    prompts: List[str]

class BatchJobResponse(BaseModel):
    id: UUID
    job_name: str
    status: str
    total_images: int
    generated_images: int
    failed_images: int
    created_at: datetime
    completed_at: Optional[datetime]

class BatchJobDetailResponse(BatchJobResponse):
    prompts: List[str]
    images: List[ImageResponse]

# Combined response models
class FullImageResponse(BaseModel):
    image: ImageResponse
    prompt: Optional[PromptResponse]
    analysis: Optional[ImageAnalysisResponse]
