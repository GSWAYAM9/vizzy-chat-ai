# Vizzy Chat AI - API Quick Reference

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

All endpoints require Bearer token (except registration):

```bash
Authorization: Bearer {access_token}
```

Get token from login/register responses.

## Endpoints

### AUTH - User Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "username": "display_name"
}

Response (200):
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "display_name",
    "avatar_url": null,
    "bio": null,
    "created_at": "2024-03-17T..."
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

Response (200): Same as register
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}

Response (200):
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "display_name",
  "avatar_url": null,
  "bio": null,
  "created_at": "2024-03-17T..."
}
```

---

### IMAGES - Image Generation & History

#### Generate Image
```http
POST /images/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "prompt": "a barber salon design with Beauty Oasis",
  "refined_prompt": "Modern barber salon interior, warm lighting..."
}

Response (200):
{
  "image": {
    "id": "uuid",
    "image_url": "https://...",
    "prompt_id": "uuid",
    "fal_image_id": "fal-123",
    "generation_model": "fal-ai",
    "created_at": "2024-03-17T..."
  },
  "prompt": {
    "id": "uuid",
    "original_prompt": "a barber salon design...",
    "refined_prompt": "Modern barber salon...",
    "created_at": "2024-03-17T..."
  },
  "analysis": null
}
```

#### Get Image History
```http
GET /images/history?limit=50&offset=0
Authorization: Bearer {token}

Response (200):
[
  {
    "id": "uuid",
    "image_url": "https://...",
    "prompt_id": "uuid",
    "fal_image_id": "fal-123",
    "generation_model": "fal-ai",
    "created_at": "2024-03-17T..."
  },
  ...
]
```

#### Get Image Details
```http
GET /images/{image_id}
Authorization: Bearer {token}

Response (200):
{
  "image": { ... },
  "prompt": { ... },
  "analysis": null
}
```

---

### GALLERY - Image Collections

#### Add to Gallery
```http
POST /gallery
Authorization: Bearer {token}
Content-Type: application/json

{
  "image_id": "uuid",
  "title": "My Favorite Design",
  "description": "Beautiful barber shop concept",
  "is_favorite": true
}

Response (200):
{
  "id": "uuid",
  "image": { ... },
  "title": "My Favorite Design",
  "description": "Beautiful barber shop concept",
  "is_favorite": true,
  "saved_at": "2024-03-17T..."
}
```

#### Get Gallery
```http
GET /gallery?is_favorite=true&limit=50&offset=0
Authorization: Bearer {token}

Response (200):
[
  {
    "id": "uuid",
    "image": { ... },
    "title": "My Favorite Design",
    "description": "...",
    "is_favorite": true,
    "saved_at": "2024-03-17T..."
  },
  ...
]
```

#### Update Gallery Item
```http
PATCH /gallery/{gallery_item_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "image_id": "uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "is_favorite": false
}

Response (200): Updated item
```

#### Delete from Gallery
```http
DELETE /gallery/{gallery_item_id}
Authorization: Bearer {token}

Response (200):
{
  "message": "Gallery item deleted"
}
```

---

### ANALYSIS - Image Analysis Caching

#### Cache Analysis
```http
POST /analysis/{image_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "image_id": "uuid",
  "analysis_text": "- Beautiful design\n- Professional layout\n- Color harmony",
  "analysis_model": "llama-3.3-70b-versatile"
}

Response (200):
{
  "id": "uuid",
  "image_id": "uuid",
  "analysis_text": "- Beautiful design...",
  "analysis_model": "llama-3.3-70b-versatile",
  "cached": true,
  "created_at": "2024-03-17T..."
}
```

#### Get Analysis
```http
GET /analysis/{image_id}
Authorization: Bearer {token}

Response (200):
{
  "id": "uuid",
  "image_id": "uuid",
  "analysis_text": "- Beautiful design...",
  "analysis_model": "llama-3.3-70b-versatile",
  "cached": true,
  "created_at": "2024-03-17T..."
}
```

#### Clear Cache
```http
DELETE /analysis/{image_id}
Authorization: Bearer {token}

Response (200):
{
  "message": "Analysis cache cleared"
}
```

---

### BATCH - Batch Image Generation

#### Create Batch Job
```http
POST /batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "job_name": "Summer Collection",
  "prompts": [
    "barber salon design",
    "modern barbershop interior",
    "luxury hair salon"
  ]
}

Response (200):
{
  "id": "uuid",
  "job_name": "Summer Collection",
  "status": "pending",
  "total_images": 3,
  "generated_images": 0,
  "failed_images": 0,
  "created_at": "2024-03-17T...",
  "completed_at": null
}
```

#### Get Batch Job Details
```http
GET /batch/{batch_job_id}
Authorization: Bearer {token}

Response (200):
{
  "id": "uuid",
  "job_name": "Summer Collection",
  "status": "processing",
  "total_images": 3,
  "generated_images": 2,
  "failed_images": 0,
  "created_at": "2024-03-17T...",
  "completed_at": null,
  "prompts": ["barber salon design", ...],
  "images": [
    {
      "id": "uuid",
      "image_url": "https://...",
      ...
    }
  ]
}
```

#### List Batch Jobs
```http
GET /batch?status=completed&limit=50&offset=0
Authorization: Bearer {token}

Response (200):
[
  {
    "id": "uuid",
    "job_name": "Summer Collection",
    "status": "completed",
    "total_images": 3,
    "generated_images": 3,
    "failed_images": 0,
    "created_at": "2024-03-17T...",
    "completed_at": "2024-03-17T..."
  },
  ...
]
```

---

## Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad request
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (RLS policy violation)
- **404** - Not found
- **500** - Server error

---

## Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Example: Complete Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123",
    "username": "john_doe"
  }'

# Response contains access_token

# 2. Generate image (save TOKEN from response)
TOKEN="eyJhbGc..."

curl -X POST http://localhost:8000/api/v1/images/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "barber salon design"
  }'

# Response contains image_id

# 3. Add to gallery
IMAGE_ID="uuid-from-response"

curl -X POST http://localhost:8000/api/v1/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "'$IMAGE_ID'",
    "title": "My Design",
    "is_favorite": true
  }'

# 4. Get gallery
curl http://localhost:8000/api/v1/gallery \
  -H "Authorization: Bearer $TOKEN"

# 5. Cache analysis
curl -X POST http://localhost:8000/api/v1/analysis/$IMAGE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_text": "- Great design\n- Professional",
    "analysis_model": "llama-3.3-70b-versatile"
  }'
```

---

## Testing Tools

### Swagger UI (Auto-generated)
```
http://localhost:8000/docs
```

### ReDoc (Alternative docs)
```
http://localhost:8000/redoc
```

### cURL Examples
See examples above

### Postman Collection
Import endpoints into Postman for easy testing

---

## Rate Limiting

Currently no rate limiting, but can be added per endpoint:
- 10 requests/minute for standard endpoints
- 5 requests/minute for generation endpoints

---

## Pagination

List endpoints support:
- `limit` - Number of items (default: 50)
- `offset` - Starting position (default: 0)

```http
GET /images/history?limit=25&offset=50
```

Returns items 50-75.
