import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from decouple import config

# Create FastAPI app
app = FastAPI(
    title="Vizzy Chat AI - DASP 1.2",
    description="Backend API for image generation and analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config("ALLOWED_ORIGINS", default="http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "vizzy-chat-ai-backend"}

# Import routers
from app.api.v1.routers import auth, images, gallery, analysis, batch_jobs

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(images.router, prefix="/api/v1/images", tags=["images"])
app.include_router(gallery.router, prefix="/api/v1/gallery", tags=["gallery"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(batch_jobs.router, prefix="/api/v1/batch", tags=["batch"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
