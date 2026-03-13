# Deckoviz Backend API

A comprehensive Django REST API backend for the Deckoviz mobile app, featuring user authentication, collection management, AI image generation, and social discovery.

## Features

- **Authentication**: Google OAuth integration with JWT tokens
- **User Profiles**: Extended user profiles with preferences and social metrics
- **Collections**: Create and manage collections of curated artwork
- **AI Features**: Dream visualizer, style transfer, image generation (integrated with Runware & Stability AI)
- **Social Features**: Follow users, share collections, trending discovery
- **Forums**: Community discussion boards with threaded replies
- **Search**: Powerful search and discovery by mood, style, and tags

## Architecture

```
backend/
├── deckoviz_backend/       # Django project settings
│   ├── settings.py         # Project configuration
│   ├── urls.py             # URL routing
│   └── wsgi.py             # WSGI configuration
├── api/                    # Main Django app
│   ├── models.py           # Database models
│   ├── views.py            # API endpoints
│   ├── serializers.py      # Data serialization
│   ├── authentication.py    # Auth system
│   └── tasks.py            # Async tasks (Celery)
├── manage.py               # Django management
├── requirements.txt        # Python dependencies
└── API_DOCUMENTATION.md    # Full API reference
```

## Database Models

- **UserProfile**: Extended user information
- **Collection**: User-curated collections
- **Media**: Individual artworks in collections
- **AITask**: AI generation history and results
- **SocialShare**: Collection sharing relationships
- **UserFollow**: User follow relationships
- **ForumPost**: Community forum posts
- **ForumReply**: Replies to forum posts

## API Endpoints

### Authentication
- `POST /auth/login/google/` - Google OAuth login
- `POST /auth/refresh-token/` - Refresh JWT token

### User Profile
- `GET /profile/profile/` - Get current user
- `PATCH /profile/update_profile/` - Update profile
- `GET /profile/public/{user_id}/` - Get public profile
- `POST /profile/preferences/` - Set preferences

### Collections
- `POST /collections/` - Create collection
- `GET /collections/` - List collections (paginated)
- `GET /collections/{id}/` - Get collection details
- `PATCH /collections/{id}/` - Update collection
- `DELETE /collections/{id}/` - Delete collection
- `POST /collections/{id}/add_media/` - Add artwork
- `DELETE /collections/{id}/remove_media/` - Remove artwork
- `POST /collections/{id}/favorite/` - Star collection

### AI Features
- `POST /ai/dream-visualizer/` - Generate dream visualization
- `POST /ai/generate-image/` - Generate image from text
- `GET /ai/` - List AI tasks
- `GET /ai/{task_id}/` - Get task result

See `API_DOCUMENTATION.md` for complete endpoint reference.

## Setup Instructions

### Prerequisites
- Python 3.9+
- PostgreSQL 12+
- Redis 6+ (for Celery)
- Virtual environment

### 1. Environment Setup
```bash
# Clone repository
git clone <repo-url>
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# - Database credentials
# - Google OAuth keys
# - API keys for Runware and Stability AI
```

### 3. Database Setup
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 4. Run Development Server
```bash
# Start Django development server
python manage.py runserver

# In another terminal, start Celery (for async tasks)
celery -A deckoviz_backend worker -l info
```

The API will be available at `http://localhost:8000/api/`

## Testing

### Test Google OAuth Login
```bash
curl -X POST http://localhost:8000/api/auth/login/google/ \
  -H "Content-Type: application/json" \
  -d '{"token": "google_oauth_token"}'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:8000/api/profile/profile/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Collection
```bash
curl -X POST http://localhost:8000/api/collections/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Collection",
    "description": "Description",
    "mood": "inspiration",
    "style": "abstract",
    "is_public": true,
    "tags": ["tag1", "tag2"]
  }'
```

## Deployment

### Production Checklist
- Set `DEBUG=False` in production
- Use strong `DJANGO_SECRET_KEY`
- Configure PostgreSQL database
- Setup Redis for Celery
- Use Gunicorn or similar WSGI server
- Enable HTTPS
- Configure CORS properly
- Setup environment variables securely
- Run `python manage.py collectstatic`

### Docker Deployment
```bash
# Build image
docker build -t deckoviz-backend .

# Run container
docker run -p 8000:8000 deckoviz-backend
```

## Key Technologies

- **Django 4.2**: Web framework
- **Django REST Framework**: API development
- **PostgreSQL**: Primary database
- **Redis**: Caching and Celery broker
- **Celery**: Async task queue for AI processing
- **Google Auth**: OAuth authentication
- **JWT**: Token-based authentication
- **Runware & Stability AI**: AI image generation

## API Response Format

All endpoints return standardized JSON responses:

```json
{
  "count": 100,
  "next": "url_to_next_page",
  "previous": null,
  "results": [...]
}
```

Error responses:
```json
{
  "error": "Error message",
  "status": "error_code"
}
```

## Rate Limiting

AI generation endpoints are rate-limited to prevent abuse:
- 10 requests per minute for authenticated users
- 5 requests per minute for image generation

## Next Steps

1. **Implement async tasks** for AI features in `tasks.py`
2. **Add social endpoints** for following, sharing, forums
3. **Implement search functionality** with filtering
4. **Add real-time notifications** with WebSockets
5. **Setup monitoring and logging**
6. **Add API versioning** for backward compatibility

## Support

For questions or issues, contact the development team or file an issue in the repository.

## License

Proprietary - Deckoviz, Inc.
