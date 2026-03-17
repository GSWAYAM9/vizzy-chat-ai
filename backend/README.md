# Vizzy Chat AI - DASP 1.2 Backend

Production-ready backend for Vizzy Chat AI with FastAPI for APIs and Django for admin dashboard.

## Architecture

- **FastAPI**: High-performance REST API for image generation, analysis, gallery, and batch processing
- **Django**: Admin dashboard for analytics, user management, and system monitoring
- **Supabase**: PostgreSQL database with built-in authentication and RLS policies
- **Redis**: Caching and background task queue (Celery)

## Project Structure

```
backend/
├── main.py                          # FastAPI application entry point
├── app/
│   ├── core/
│   │   ├── config.py               # Environment settings
│   │   └── supabase_client.py       # Supabase client initialization
│   ├── api/
│   │   └── v1/
│   │       └── routers/
│   │           ├── auth.py         # Authentication endpoints
│   │           ├── images.py       # Image generation endpoints
│   │           ├── gallery.py      # Gallery management endpoints
│   │           ├── analysis.py     # Analysis caching endpoints
│   │           └── batch_jobs.py   # Batch processing endpoints
│   └── schemas.py                  # Pydantic models
├── vizzy_admin/                     # Django admin application
│   ├── settings.py                 # Django configuration
│   ├── urls.py                     # URL routing
│   ├── views.py                    # Admin API views
│   ├── wsgi.py                     # WSGI application
│   └── asgi.py                     # ASGI application
├── migrations/
│   └── 001_init_schema.sql        # Database schema
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
└── manage.py                       # Django CLI
```

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anonymous key
- `SUPABASE_JWT_SECRET` - Your Supabase JWT secret
- `FAL_API_KEY` - Fal AI API key for image generation
- `GROQ_API_KEY` - Groq API key for prompt refinement and analysis
- `REDIS_URL` - Redis connection string (optional, for caching)

### 3. Initialize Database

Run the SQL migration in Supabase:

```sql
-- Go to Supabase SQL Editor and run:
-- Copy contents of migrations/001_init_schema.sql
```

### 4. Run FastAPI Server

```bash
python main.py
# OR
uvicorn main:app --reload
```

Server will be available at: `http://localhost:8000`

### 5. Run Django Admin (optional)

```bash
python manage.py runserver 8001
```

Admin dashboard at: `http://localhost:8001/admin`

## API Endpoints

### Authentication (`/api/v1/auth`)

- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user profile

### Images (`/api/v1/images`)

- `POST /generate` - Generate image from prompt
- `GET /history` - Get user's image history
- `GET /{image_id}` - Get image details with analysis

### Gallery (`/api/v1/gallery`)

- `POST /` - Add image to gallery
- `GET /` - Get user's gallery (supports favorite filtering)
- `PATCH /{gallery_item_id}` - Update gallery item
- `DELETE /{gallery_item_id}` - Remove from gallery

### Analysis (`/api/v1/analysis`)

- `POST /{image_id}` - Cache image analysis
- `GET /{image_id}` - Get cached analysis
- `DELETE /{image_id}` - Clear analysis cache

### Batch Jobs (`/api/v1/batch`)

- `POST /` - Create batch generation job
- `GET /{batch_job_id}` - Get batch job details
- `GET /` - List user's batch jobs (supports status filtering)

### Admin Analytics (Django)

- `GET /api/analytics/` - System metrics and stats
- `GET /api/users/` - List users with stats
- `GET /api/jobs/` - List batch jobs

## Authentication

All FastAPI endpoints (except `/health`) require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer <access_token>" http://localhost:8000/api/v1/images/history
```

The access token is obtained from the `/api/v1/auth/login` or `/api/v1/auth/register` endpoints.

## Database Schema

### Users Table
- `id` (UUID, PK) - Supabase Auth user ID
- `email` (VARCHAR) - User email
- `username` (VARCHAR, nullable) - Display name
- `avatar_url` (TEXT, nullable) - Profile picture URL
- `bio` (TEXT, nullable) - User bio
- `created_at` (TIMESTAMP) - Account creation date

### Images Table
- `id` (UUID, PK)
- `user_id` (UUID, FK) - Image owner
- `prompt_id` (UUID, FK) - Associated prompt
- `image_url` (TEXT) - Generated image URL
- `fal_image_id` (VARCHAR) - Fal AI image ID
- `generation_model` (VARCHAR) - Model used
- `created_at` (TIMESTAMP)

### Image Analysis Table
- `id` (UUID, PK)
- `image_id` (UUID, FK, UNIQUE) - Associated image
- `analysis_text` (TEXT) - Analysis content (bullet points)
- `analysis_model` (VARCHAR) - Model used
- `cached` (BOOLEAN) - Whether this is cached
- `created_at` (TIMESTAMP)

### Batch Jobs Table
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `job_name` (VARCHAR)
- `prompts` (TEXT[]) - Array of prompts
- `status` (VARCHAR) - pending/processing/completed/failed
- `total_images` (INT)
- `generated_images` (INT)
- `failed_images` (INT)
- `started_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)

### Gallery Items Table
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `image_id` (UUID, FK)
- `title` (VARCHAR, nullable)
- `description` (TEXT, nullable)
- `is_favorite` (BOOLEAN)
- `saved_at` (TIMESTAMP)

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view/modify their own data
- Gallery items are private to the owner
- Analysis is only visible to image owner

## Performance Optimization

- Indexes on `user_id`, `created_at`, and `image_id`
- Analysis caching to avoid redundant API calls
- Batch processing for multiple image generations
- RLS policies for efficient data filtering

## Production Deployment

### Environment Variables
```bash
DEBUG=False
SECRET_KEY=<generate-secure-key>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Run with Gunicorn (FastAPI)
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Run Django with Gunicorn
```bash
gunicorn vizzy_admin.wsgi:application
```

## Future Enhancements

- WebSocket support for real-time batch job progress
- Image storage integration (S3/Blob storage)
- Advanced analytics and reporting
- Rate limiting and quota management
- Payment processing integration

