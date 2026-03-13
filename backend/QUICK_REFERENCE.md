# Deckoviz Backend API - Quick Reference Card

## Base URL
```
https://api.deckoviz.com/api/
```

## Authentication
```
Authorization: Bearer $access_token
```

---

## Authentication Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/login/google/` | ✗ | Google OAuth login |
| POST | `/auth/refresh-token/` | ✗ | Refresh access token |

---

## User Profile Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/profile/profile/` | ✓ | Get current user profile |
| PATCH | `/profile/update_profile/` | ✓ | Update profile info |
| GET | `/profile/public/{user_id}/` | ✗ | Get public profile |
| POST | `/profile/preferences/` | ✓ | Set user preferences |
| GET | `/profile/get_preferences/` | ✓ | Get user preferences |

---

## Collection Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/collections/` | ✓ | Create collection |
| GET | `/collections/` | ✓ | List user's collections |
| GET | `/collections/{id}/` | ✓ | Get collection details |
| PATCH | `/collections/{id}/` | ✓ | Update collection |
| DELETE | `/collections/{id}/` | ✓ | Delete collection |
| POST | `/collections/{id}/add_media/` | ✓ | Add image to collection |
| DELETE | `/collections/{id}/remove_media/` | ✓ | Remove image from collection |
| POST | `/collections/{id}/favorite/` | ✓ | Star/like collection |
| GET | `/collections/{id}/media/` | ✓ | Get collection media |

---

## AI Feature Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/ai/dream-visualizer/` | ✓ | Generate dream visualization |
| POST | `/ai/style-transfer/` | ✓ | Apply art style to image |
| POST | `/ai/moodboard/create/` | ✓ | Create moodboard |
| POST | `/ai/poster/create/` | ✓ | Create poster |
| POST | `/ai/brand-assets/` | ✓ | Generate brand assets |
| POST | `/ai/generate-image/` | ✓ | Generate image from text |
| GET | `/ai/` | ✓ | List AI tasks (paginated) |
| GET | `/ai/{task_id}/` | ✓ | Get AI task result |

---

## Social & Sharing Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/social/share-collection/` | ✓ | Share collection |
| GET | `/social/shared-with-me/` | ✓ | Get shared collections |
| GET | `/social/my-shares/` | ✓ | Get my shared collections |
| POST | `/social/follow/{user_id}/` | ✓ | Follow user |
| POST | `/social/unfollow/{user_id}/` | ✓ | Unfollow user |
| GET | `/social/followers/{user_id}/` | ✓ | Get user's followers |
| GET | `/social/following/{user_id}/` | ✓ | Get users following |
| GET | `/social/discover/trending/` | ✓ | Get trending collections |
| GET | `/social/discover/recommended/` | ✓ | Get recommendations |

---

## Forum Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/forums/` | ✓ | Create forum post |
| GET | `/forums/` | ✓ | List forum posts |
| GET | `/forums/{id}/` | ✓ | Get post details |
| POST | `/forums/{id}/reply/` | ✓ | Reply to post |
| GET | `/forums/{id}/replies/` | ✓ | Get post replies |

---

## Search Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/search/collections/` | ✗ | Search collections |
| GET | `/search/users/` | ✗ | Search users |
| GET | `/search/artworks/` | ✗ | Search artworks |

Query Parameters for Search:
```
?q=search_term
?page=1&limit=20
?sort_by=recent|trending|popular
?mood=inspiration
?style=abstract
?tags=landscape,nature
```

---

## Discovery Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/discover/trending/` | ✗ | Trending collections |
| GET | `/discover/recommended/` | ✓ | AI recommendations |
| GET | `/discover/by-mood/{mood}/` | ✗ | Collections by mood |
| GET | `/discover/by-style/{style}/` | ✗ | Collections by style |
| GET | `/discover/explore/` | ✗ | Random collections |
| GET | `/discover/featured/` | ✗ | Featured collections |

---

## Filter/Saved Searches

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/filters/create_filter/` | ✓ | Save search filter |
| GET | `/filters/my_filters/` | ✓ | Get saved filters |

---

## Query Parameters Reference

### Pagination
```
?page=1          # Page number (default: 1)
?limit=20        # Items per page (default: 20)
```

### Sorting
```
?sort_by=recent      # Most recent first
?sort_by=trending    # Trending first
?sort_by=popular     # Most liked first
```

### Filtering
```
?mood=inspiration              # By mood
?style=abstract               # By art style
?tags=landscape,nature        # By tags
?is_public=true              # Public only
?q=search_term               # Text search
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful GET/PATCH |
| 201 | Created - Successful POST |
| 204 | No Content - Successful DELETE |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Invalid token |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource missing |
| 500 | Server Error |

---

## Common Response Format

### List Response (Paginated)
```json
{
  "count": 100,
  "page": 1,
  "limit": 20,
  "next": "https://...",
  "previous": null,
  "results": [...]
}
```

### Single Resource Response
```json
{
  "id": "uuid",
  "title": "Example",
  "created_at": "2024-03-13T00:00:00Z",
  ...
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": "error_code"
}
```

---

## Common Request Patterns

### Create Resource
```
POST /endpoint/

{
  "field1": "value1",
  "field2": "value2"
}
```

### Update Resource
```
PATCH /endpoint/{id}/

{
  "field1": "updated_value"
}
```

### Delete Resource
```
DELETE /endpoint/{id}/
```

### List with Filters
```
GET /endpoint/?page=1&limit=20&sort_by=recent&filter=value
```

---

## Rate Limits

- Standard endpoints: 100 req/min per user
- Image generation: 10 req/min per user
- Search: 60 req/min per user

---

## Common Moods
```
inspiration
calm
romantic
focus
party
meditation
creative
energetic
```

## Common Styles
```
abstract
impressionist
realism
surrealism
digital art
photography
illustration
minimalist
vintage
fantasy
```

---

## Authentication Flow

1. **Login**
   ```
   POST /auth/login/google/ → access_token + refresh_token
   ```

2. **Use Token**
   ```
   GET /profile/profile/ (with Authorization header)
   ```

3. **Token Expires?**
   ```
   POST /auth/refresh-token/ (with refresh_token)
   ```

---

## Mobile Implementation Examples

### Swift (iOS)
```swift
let headers = ["Authorization": "Bearer \(accessToken)"]
var request = URLRequest(url: url)
request.allHTTPHeaderFields = headers
```

### Kotlin (Android)
```kotlin
val headers = mapOf("Authorization" to "Bearer $accessToken")
val request = request.newBuilder()
    .headers(headers.toHeaders())
    .build()
```

### JavaScript/React Native
```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};

fetch(url, { headers })
```

---

## Useful Links

- Full API Documentation: `API_DOCUMENTATION.md`
- Mobile Developer Guide: `MOBILE_DEVELOPER_GUIDE.md`
- Backend README: `README.md`
- Deployment Guide: `DEPLOYMENT.md`

---

## Support

- Email: backend@deckoviz.com
- GitHub: https://github.com/deckoviz/backend
- Docs: https://docs.deckoviz.com

