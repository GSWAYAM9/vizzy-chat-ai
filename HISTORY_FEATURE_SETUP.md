# Generation History Feature - Setup & Troubleshooting

## What Was Added

A complete Generation History feature that displays all user-generated images with filtering, sorting, and management capabilities.

### New Files Created:
- `app/history/page.tsx` - History page route
- `components/generation-history.tsx` - Main history component with filtering
- `app/api/gallery/images/route.ts` - API route to fetch images
- `app/api/gallery/images/[id]/route.ts` - API route to delete images
- `app/api/gallery/images/[id]/like/route.ts` - API route to like images
- `.env.local` - Environment configuration with backend URL

## How It Works

1. **User clicks History button** in the header (Clock icon)
2. **History page loads** (`/history`)
3. **Component fetches images** from `/api/gallery/images/` (frontend proxy)
4. **Frontend proxy calls backend** at `http://localhost:8000/api/gallery/images/`
5. **Backend returns user's generated images** (GeneratedImage model)
6. **UI displays images** with filtering and sorting options

## Features

- Browse all generated images in a responsive grid
- Search by prompt with real-time filtering
- Sort by: Newest, Oldest, Most Liked
- Filter by: Aspect Ratio, Model
- Actions: Download, Copy Prompt, Like, Delete
- Shows generation time and like count
- Mobile-friendly interface

## Troubleshooting

### "Failed to load history" Error

**Issue:** History page shows error message

**Solution:**

1. **Check Backend is Running**
   ```bash
   # Backend should be running on port 8000
   curl http://localhost:8000/api/gallery/images/
   ```

2. **Check Environment Variable**
   ```bash
   # Verify .env.local exists and has correct URL
   cat .env.local
   # Should show: NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

3. **Check Authentication Token**
   - Ensure user is logged in
   - Token should be stored in localStorage under key: `token`
   - Browser DevTools → Application → Local Storage → token

4. **Check API Endpoint**
   - Backend should have GeneratedImage model registered
   - Verify URL in logs: `/api/gallery/images/`

### No Images Displayed

**Possible Causes:**
1. No images have been generated yet
2. Token is not valid or expired
3. Backend database is empty

**Solution:**
1. Generate an image first using the chat
2. Verify token is valid by checking authenticated API calls
3. Check backend database for GeneratedImage records

### CORS Errors

**Issue:** "Access to XMLHttpRequest blocked by CORS policy"

**Solution:**
The frontend proxy routes should handle this. If still occurring:
1. Verify backend has CORS middleware enabled
2. Check backend settings.py has correct ALLOWED_HOSTS
3. Ensure CORS_ALLOWED_ORIGINS includes frontend URL

### Images Not Updating

**Solution:**
Click the retry button or refresh the page. The component uses SWR which caches data. Manual refresh will force new fetch.

## Database Models Used

- **GeneratedImage** - Stores all generated images with metadata (prompt, aspect_ratio, seed, model, generation_time, likes_count, is_favorited)
- **AITask** - Tracks which AI task created each image

## API Endpoints

- `GET /api/gallery/images/` - List all user images
- `DELETE /api/gallery/images/{id}/` - Delete image
- `POST /api/gallery/images/{id}/like/` - Like image
- `GET /api/gallery/images/favorites/` - Get favorited images
- `GET /api/gallery/images/search/?q=query` - Search images

## Environment Setup

For production deployment, update `.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

The `NEXT_PUBLIC_` prefix makes this variable accessible to frontend code.
