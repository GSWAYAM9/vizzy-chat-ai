# User Authentication System - Vizzy Chat AI

## Overview
The complete user authentication system is fully integrated into Vizzy Chat AI using Supabase Auth with email/password and Google OAuth support.

## Where Authentication Is Located

### Core Authentication Files

**`lib/supabase-client.ts`** - Supabase configuration
- Initializes Supabase client with environment variables
- Exports `isSupabaseConfigured` flag
- Handles missing credentials gracefully

**`lib/auth-context.tsx`** - React Authentication Context
- Manages user sessions and authentication state
- Provides methods: `signUp`, `signIn`, `signOut`, `signInWithGoogle`
- Accessible via `useAuth()` hook
- Automatically syncs auth state across app

### Authentication Pages

**`app/auth/login/page.tsx`** - Login Page
- Email/password login form
- Google OAuth "Sign in with Google" button
- Link to signup page: "Don't have an account? Sign up"
- Error handling and loading states

**`app/auth/signup/page.tsx`** - Signup Page
- Full Name, Email, Password fields
- Automatic user profile creation
- Link back to login: "Already have an account? Sign in"
- Redirects to login after successful signup

### Protected Routes

**`app/page.tsx`** - Main Chat Interface
- Checks if user is authenticated
- Redirects unauthenticated users to `/auth/login`
- Shows loading state while checking auth status
- Shows setup screen if Supabase isn't configured

### User Interface Integration

**`components/vizzy-chat.tsx`** - VizzyChat Component Header
- User Profile button showing user email
- Gallery link
- Logout button with LogOut icon
- All buttons have tooltips
- Logout redirects to login page

**`app/profile/page.tsx`** - User Profile Page
- Displays user account information
- Settings and preferences

**`app/gallery/page.tsx`** - Image Gallery
- User's saved images and generations
- Favorite images toggle

## User Flow

### First Time User
1. Visits `/` → Redirected to `/auth/login`
2. Clicks "Sign up" → Goes to `/auth/signup`
3. Enters name, email, password → Signup succeeds
4. Redirected to `/auth/login`
5. Signs in with credentials
6. Redirected to `/` (VizzyChat)
7. Chat interface loads with user email in profile button

### Returning User
1. Visits `/` → Redirected to `/auth/login` if not authenticated
2. Enters email and password OR signs in with Google
3. Redirected to `/` (VizzyChat)

### Logged-in User
- Can use VizzyChat for image generation
- Access Gallery via header button
- Access Profile via user email button
- Logout via LogOut button in header (redirects to login)

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

These are available in your Supabase project settings under API.

## How to Access Authentication

### In Development
- Login page: `http://localhost:3000/auth/login`
- Signup page: `http://localhost:3000/auth/signup`
- Main app: `http://localhost:3000/` (redirects to login if not authenticated)

### Features
- ✅ Email/password authentication
- ✅ Google OAuth integration
- ✅ Persistent sessions
- ✅ User profile data (name, email)
- ✅ Automatic auth state management
- ✅ Protected routes
- ✅ Logout functionality

## Integration Points

The `useAuth()` hook can be used anywhere in the app:

```tsx
import { useAuth } from "@/lib/auth-context"

export function MyComponent() {
  const { user, signOut, isLoading, isConfigured } = useAuth()
  
  return (
    <>
      <p>Welcome, {user?.email}</p>
      <button onClick={signOut}>Logout</button>
    </>
  )
}
```

## Next Steps
1. Add your Supabase credentials to environment variables
2. Refresh the app
3. You'll see the login page
4. Create an account or sign in with Google
5. Full authentication system is ready to use
