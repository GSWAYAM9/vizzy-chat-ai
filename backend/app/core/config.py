from pydantic_settings import BaseSettings
from decouple import config

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = config("SUPABASE_URL", default="")
    SUPABASE_KEY: str = config("SUPABASE_KEY", default="")
    SUPABASE_JWT_SECRET: str = config("SUPABASE_JWT_SECRET", default="")
    
    # FastAPI
    ALLOWED_ORIGINS: str = config("ALLOWED_ORIGINS", default="http://localhost:3000")
    DEBUG: bool = config("DEBUG", default=True, cast=bool)
    
    # JWT
    SECRET_KEY: str = config("SECRET_KEY", default="your-secret-key-change-this")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis
    REDIS_URL: str = config("REDIS_URL", default="redis://localhost:6379")
    
    # Fal AI (for image generation)
    FAL_API_KEY: str = config("FAL_API_KEY", default="")
    
    # Groq (for prompt refinement and analysis)
    GROQ_API_KEY: str = config("GROQ_API_KEY", default="")
    
    class Config:
        env_file = ".env"

settings = Settings()
