# User History & Generated Media Implementation

## Overview

The history feature now automatically saves generated images when users create them. The system uses a token-based approach to track user sessions and persist image history.

## How It Works

### 1. Token Generation (First Time)
When a user generates their first image:
- The `vizzy-chat` component checks for an existing token in localStorage
- If no token exists, one is automatically generated: `user_${timestamp}_${randomId}`
- Token is saved to localStorage for future use
- Token is logged to the console for debugging

### 2. Image Generation & Auto-Save
When images are generated:
1. Images are created via `/api/generate`
2. After successful generation, each image is automatically saved to the backend
3. Each image save request includes:
   - `image_url` - The generated image URL
   - `prompt` - The refined prompt used
   - `aspect_ratio` - The image dimensions
   - `seed` - The generation seed (if available)
   - `model` - The model used (e.g., "runware")
4. Authorization header includes the user's token: `Bearer ${token}`

### 3. History Page Display
When users click the History button:
1. Token is retrieved from localStorage
2. If no token exists, error message: "No generation history yet. Start generating images!"
3. If token exists, images are fetched from `/api/gallery/images/`
4. Images are displayed in a responsive grid with filtering and sorting

## Frontend Flow

### Files Involved

**vizzy-chat.tsx** (Main Chat Component)
- Detects when images are generated
- Auto-generates and stores token in localStorage
- Saves each generated image to backend
- Uses `/api/gallery/images/` POST endpoint

**generation-history.tsx** (History Display Component)
- Retrieves token from localStorage
- Fetches images from `/api/gallery/images/` GET
- Provides filtering by prompt, aspect ratio, model
- Sorting by: newest, oldest, most liked
- Actions: download, copy prompt, like, delete

**history/page.tsx** (History Page)
- Simple page wrapper that renders GenerationHistory component

## Backend API Endpoints

### Save Image (POST)
```
POST /api/gallery/images/
Headers: Authorization: Bearer ${token}
Body: {
  image_url: string,
  prompt: string,
  aspect_ratio: string,
  seed: number,
  model: string
}
Response: { id: string, ... saved image data }
```

### Get Images (GET)
```
GET /api/gallery/images/
Headers: Authorization: Bearer ${token}
Response: [ { id, image_url, prompt, aspect_ratio, ... }, ... ]
```

### Like Image (POST)
```
POST /api/gallery/images/{id}/like/
Headers: Authorization: Bearer ${token}
```

### Delete Image (DELETE)
```
DELETE /api/gallery/images/{id}/
Headers: Authorization: Bearer ${token}
```

## How to Test

1. **First Image Generation**
   - Go to chat page
   - Type: "Generate a beautiful landscape"
   - Watch console for: "[v0] Generated temporary token: user_..."
   - Image should be saved to backend

2. **View History**
   - Click the Clock icon (History) in header
   - You should see your generated image
   - If empty, refresh the page

3. **Debug Logging**
   - All steps log to console with `[v0]` prefix
   - Watch for token generation, image saving, and fetching

## Error Handling

### No Token
- Display: "No generation history yet. Start generating images to see them here!"
- Action: Generate an image first

### API Errors
- 401: "Session expired. Generate a new image to refresh."
- Other: Show status code and error message

### Network Errors
- Show descriptive error with "Check Again" button
- SWR will auto-retry on focus

## Environment Variables

Make sure `.env.local` has:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

This tells the frontend API routes where to forward requests to the Django backend.

## Token Security Notes

Current implementation uses a simple temporary token for demo purposes. For production:
- Implement proper authentication (OAuth, JWT, etc.)
- Use secure session management
- Store tokens in httpOnly cookies instead of localStorage
- Add CSRF protection
- Implement proper token expiration and refresh
