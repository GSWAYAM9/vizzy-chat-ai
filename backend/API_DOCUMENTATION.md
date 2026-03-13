# Deckoviz Mobile Backend API Documentation

## Base URL
```
https://api.deckoviz.com/api/
```

## Authentication
All endpoints (except login) require Bearer token authentication:
```
Authorization: Bearer $access_token
```

---

## Authentication Endpoints

### POST /auth/login/google/
Google OAuth login
```json
Request:
{
  "token": "google_oauth_token_string"
}

Response (200):
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": "https://...",
    "bio": "User bio",
    "followers_count": 0,
    "following_count": 0
  }
}
```

### POST /auth/refresh-token/
Refresh access token
```json
Request:
{
  "refresh_token": "refresh_token_string"
}

Response (200):
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token",
  "token_type": "Bearer"
}
```

---

## User Profile Endpoints

### GET /profile/profile/
Get current user profile
```
Headers: Authorization: Bearer $token

Response (200):
{
  "user_id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "avatar_url": "https://...",
  "bio": "Bio text",
  "location": "City, Country",
  "interests": ["photography", "design"],
  "favourite_artists": ["Artist1", "Artist2"],
  "favourite_moods": ["inspiration", "calm"],
  "followers_count": 10,
  "following_count": 5,
  "created_at": "2024-03-13T00:00:00Z"
}
```

### PATCH /profile/update_profile/
Update user profile
```json
Request:
{
  "avatar_url": "https://...",
  "bio": "New bio",
  "location": "New Location",
  "name": "New Name",
  "interests": ["art", "design"],
  "favourite_artists": ["Artist1"],
  "favourite_moods": ["inspiration"]
}

Response (200): Updated profile object
```

### GET /profile/public/{user_id}/
Get public user profile (no auth required)
```
Response (200): Public profile object
```

### POST /profile/preferences/
Set user preferences
```json
Request:
{
  "interests": ["photography", "design"],
  "favourite_artists": ["Artist1"],
  "favourite_moods": ["inspiration"]
}

Response (200):
{
  "interests": [...],
  "favourite_artists": [...],
  "favourite_moods": [...]
}
```

### GET /profile/get_preferences/
Get user preferences
```
Response (200):
{
  "interests": [...],
  "favourite_artists": [...],
  "favourite_moods": [...]
}
```

---

## Collection Management Endpoints

### POST /collections/
Create collection
```json
Request:
{
  "title": "Collection Title",
  "description": "Description",
  "mood": "inspiration",
  "style": "abstract",
  "is_public": true,
  "tags": ["tag1", "tag2"]
}

Response (201): Collection object
```

### GET /collections/
List user's collections (paginated)
```
Query Parameters:
  ?page=1&limit=20
  ?public=true (to get public collections)

Response (200):
{
  "count": 100,
  "next": "url_to_next_page",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "title": "Collection Title",
      "description": "...",
      "mood": "inspiration",
      "style": "abstract",
      "is_public": true,
      "tags": ["tag1"],
      "media_count": 5,
      "likes_count": 10,
      "shares_count": 2,
      "media": [
        {
          "id": "uuid",
          "image_url": "https://...",
          "title": "Media Title",
          "description": "...",
          "created_at": "2024-03-13T00:00:00Z"
        }
      ],
      "created_at": "2024-03-13T00:00:00Z"
    }
  ]
}
```

### GET /collections/{collection_id}/
Get collection details
```
Response (200): Collection object with all media
```

### PATCH /collections/{collection_id}/
Update collection metadata
```json
Request:
{
  "title": "New Title",
  "description": "New Description",
  "mood": "calm",
  "is_public": false
}

Response (200): Updated collection
```

### DELETE /collections/{collection_id}/
Delete collection
```
Response (204): No content
```

### POST /collections/{collection_id}/add_media/
Add media to collection
```json
Request:
{
  "image_url": "https://...",
  "title": "Media Title",
  "description": "Optional description"
}

Response (201): Media object
```

### DELETE /collections/{collection_id}/remove_media/
Remove media from collection
```json
Request:
{
  "media_id": "uuid"
}

Response (204): No content
```

### POST /collections/{collection_id}/favorite/
Favorite/star collection
```
Response (200):
{
  "likes_count": 11
}
```

---

## AI Feature Endpoints

### POST /ai/dream-visualizer/
Generate dream visualization
```json
Request:
{
  "prompt": "A serene mountain landscape",
  "art_style": "impressionist",
  "mood": "calm",
  "num_variations": 1,
  "aspect_ratio": "16:9"
}

Response (201):
{
  "task_id": "uuid",
  "id": "uuid",
  "task_type": "dream_visualizer",
  "prompt": "...",
  "status": "pending",
  "images": [],
  "metadata": {
    "art_style": "impressionist",
    "mood": "calm",
    "num_variations": 1,
    "aspect_ratio": "16:9"
  },
  "created_at": "2024-03-13T00:00:00Z"
}
```

### POST /ai/generate-image/
Generate image from text prompt
```json
Request:
{
  "prompt": "A futuristic city",
  "aspect_ratio": "16:9",
  "num_results": 1
}

Response (201): AI task object
```

### GET /ai/
List user's AI tasks (paginated)
```
Query Parameters: ?page=1&limit=20

Response (200):
{
  "count": 50,
  "next": "...",
  "results": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "task_type": "dream_visualizer",
      "prompt": "...",
      "status": "completed",
      "images": ["https://...", "https://..."],
      "metadata": {...},
      "created_at": "2024-03-13T00:00:00Z",
      "completed_at": "2024-03-13T00:05:00Z"
    }
  ]
}
```

### GET /ai/{task_id}/
Get specific AI task result
```
Response (200): AI task object with images
```

---

## Status Codes
- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid/expired token
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create `.env` file:
```
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=deckoviz_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
CELERY_BROKER_URL=redis://localhost:6379/0
RUNWARE_API_KEY=your-runware-key
STABILITY_API_KEY=your-stability-key
```

### 3. Run Migrations
```bash
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`
