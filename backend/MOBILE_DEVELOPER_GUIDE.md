# Mobile Developer Quick Start Guide

## Backend API Overview

The Deckoviz backend provides a comprehensive REST API for the mobile app with the following features:

- User authentication via Google OAuth
- User profiles and preferences
- Collection management (create, read, update, delete)
- AI image generation features
- Social features (follow, share, discover)
- Search and discovery
- Community forums

## Base API URL

```
https://api.deckoviz.com/api/
```

## Authentication

All endpoints (except login) require a Bearer token in the Authorization header:

```
Authorization: Bearer $access_token
```

## Quick Start: Authentication Flow

### 1. Google OAuth Login

```
POST /auth/login/google/

Body:
{
  "token": "google_oauth_token_from_mobile_sdk"
}

Response (200):
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": "https://..."
  }
}
```

### 2. Using the Token

Store the tokens securely in the mobile app (Keychain/Keystore) and include in all subsequent requests:

```
Header: Authorization: Bearer $access_token
```

### 3. Token Refresh

When the access token expires, use the refresh token to get a new one:

```
POST /auth/refresh-token/

Body:
{
  "refresh_token": "refresh_token"
}

Response (200):
{
  "access_token": "new_jwt_access_token",
  "refresh_token": "new_jwt_refresh_token",
  "token_type": "Bearer"
}
```

## Common Mobile Workflows

### Workflow 1: User Signs Up / Logs In

```
1. Use Google OAuth mobile SDK to get ID token
2. Call POST /auth/login/google/ with the token
3. Store access_token and refresh_token securely
4. Display user profile from response
```

### Workflow 2: Get User Profile

```
GET /profile/profile/

Response (200):
{
  "user_id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "avatar_url": "https://...",
  "bio": "User bio",
  "location": "City, Country",
  "interests": ["photography", "design"],
  "followers_count": 10,
  "following_count": 5
}
```

### Workflow 3: Browse Collections (Discovery)

```
# Get trending collections
GET /discover/trending/?limit=20

# Get collections by mood
GET /discover/by-mood/inspiration/?page=1&limit=20

# Get collections by style
GET /discover/by-style/abstract/?page=1&limit=20

# Get recommended collections (requires auth)
GET /discover/recommended/?limit=20

# Random exploration
GET /discover/explore/?limit=20

Response (200):
{
  "results": [
    {
      "id": "uuid",
      "title": "Collection Title",
      "mood": "inspiration",
      "style": "abstract",
      "media_count": 5,
      "likes_count": 10,
      "media": [
        {
          "id": "uuid",
          "image_url": "https://...",
          "title": "Image Title"
        }
      ]
    }
  ]
}
```

### Workflow 4: Search Collections

```
GET /search/collections/?q=search_term&page=1&limit=20&sort_by=recent

Query Parameters:
  q: search term (searches title, description, tags)
  page: page number (default 1)
  limit: items per page (default 20)
  sort_by: recent | trending | popular (default recent)

Response (200):
{
  "count": 100,
  "page": 1,
  "limit": 20,
  "results": [...]
}
```

### Workflow 5: Create a Collection

```
POST /collections/

Body:
{
  "title": "My Collection",
  "description": "Optional description",
  "mood": "inspiration",
  "style": "abstract",
  "is_public": true,
  "tags": ["tag1", "tag2"]
}

Response (201):
{
  "id": "uuid",
  "title": "My Collection",
  "media_count": 0,
  "created_at": "2024-03-13T00:00:00Z"
}
```

### Workflow 6: Add Media to Collection

```
POST /collections/{collection_id}/add_media/

Body:
{
  "image_url": "https://...",
  "title": "Image Title",
  "description": "Optional description"
}

Response (201):
{
  "id": "uuid",
  "image_url": "https://...",
  "title": "Image Title",
  "created_at": "2024-03-13T00:00:00Z"
}
```

### Workflow 7: Share Collection

```
POST /social/share-collection/

Body:
{
  "collection_id": "uuid",
  "share_type": "user",  // or "public"
  "recipient_email": "friend@example.com",
  "can_edit": false
}

Response (201):
{
  "id": "uuid",
  "collection_title": "Collection Name",
  "shared_by_email": "your@email.com",
  "share_type": "user",
  "can_edit": false
}
```

### Workflow 8: Follow a User

```
POST /social/follow/{user_id}/

Response (200):
{
  "message": "Following user",
  "status": "following"
}
```

### Workflow 9: Generate Image

```
POST /ai/dream-visualizer/

Body:
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
  "status": "pending",
  "prompt": "A serene mountain landscape",
  "created_at": "2024-03-13T00:00:00Z"
}

# Poll for results
GET /ai/{task_id}/

# When completed:
{
  "task_id": "uuid",
  "status": "completed",
  "images": [
    "https://..."
  ]
}
```

## Error Handling

All error responses follow this format:

```json
{
  "error": "Descriptive error message",
  "status": "error_code"
}
```

Common HTTP Status Codes:
- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid/expired token
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Example error response:

```json
{
  "error": "Collection not found",
  "status": "not_found"
}
```

## Pagination

List endpoints return paginated results with the following format:

```json
{
  "count": 100,
  "page": 1,
  "limit": 20,
  "next": "https://api.deckoviz.com/api/collections/?page=2",
  "previous": null,
  "results": [...]
}
```

Use `page` and `limit` query parameters to navigate:

```
GET /collections/?page=1&limit=20
GET /collections/?page=2&limit=20
```

## Response Time Expectations

- Authentication endpoints: < 200ms
- Collection operations: < 100ms
- Search operations: < 500ms
- Image generation: 10-60 seconds (async, check task status)

## Rate Limiting

- Standard endpoints: 100 requests/minute per user
- Image generation: 10 requests/minute per user
- Search: 60 requests/minute per user

## Mobile SDK Implementation Tips

### Swift (iOS)

```swift
import URLSession

class APIClient {
    let baseURL = "https://api.deckoviz.com/api/"
    var accessToken: String?
    
    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> T {
        var request = URLRequest(url: URL(string: baseURL + endpoint)!)
        request.httpMethod = method
        
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        // Handle errors
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw APIError.serverError
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

### Kotlin (Android)

```kotlin
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class APIClient {
    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val original = chain.request()
            val request = original.newBuilder()
                .header("Authorization", "Bearer $accessToken")
                .build()
            chain.proceed(request)
        }
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl("https://api.deckoviz.com/api/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    fun <T> create(serviceClass: Class<T>): T = retrofit.create(serviceClass)
}
```

## Testing Endpoints

You can test the API using Postman, cURL, or the provided Postman collection.

### cURL Example

```bash
# Google OAuth Login
curl -X POST https://api.deckoviz.com/api/auth/login/google/ \
  -H "Content-Type: application/json" \
  -d '{"token": "your_google_token"}'

# Get Collections
curl -X GET https://api.deckoviz.com/api/collections/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create Collection
curl -X POST https://api.deckoviz.com/api/collections/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Collection",
    "mood": "inspiration",
    "is_public": true
  }'
```

## Documentation Files

- **API_DOCUMENTATION.md** - Complete API reference with all endpoints
- **README.md** - Backend setup and architecture
- **DEPLOYMENT.md** - Deployment instructions
- **tests.py** - Test suite and examples

## Support & Contact

For questions or issues:
- GitHub Issues: [repository-url]
- Email: backend-support@deckoviz.com
- Slack: #backend-api channel

## Next Steps

1. Implement Google OAuth in your mobile app
2. Store tokens securely (Keychain/Keystore)
3. Implement API client with token management
4. Start with discovery/search workflows
5. Add collection management features
6. Integrate image generation
7. Add social features
