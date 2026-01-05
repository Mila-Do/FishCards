# Bearer Token Authentication System

This directory contains the unified Bearer token authentication system that replaces the previous hybrid session/bearer approach.

## Architecture Overview

The new authentication system uses **Bearer tokens exclusively** for both API endpoints and page authentication, providing:

- ✅ **Unified authentication** across web, mobile, and API
- ✅ **Better security** with controlled token lifecycle
- ✅ **Improved scalability** with stateless authentication
- ✅ **Mobile-ready** architecture
- ✅ **Easier debugging** and testing

## Core Components

### 1. Token Storage (`token-storage.ts`)
- Secure token persistence using sessionStorage
- Automatic token refresh logic
- Token validation and expiration handling
- Fallback to Supabase session management

### 2. Auth Service (`auth-service.ts`)
- Unified authentication API
- Login, register, logout operations
- Password reset and update functionality
- Auth state management and notifications
- Error handling with user-friendly messages

### 3. Authenticated API Client (`authenticated-api-client.ts`)
- Extends base ApiClient with automatic Bearer token injection
- Handles token refresh and authentication errors
- Provides type-safe API calls with authentication

### 4. React Hooks (`../hooks/useAuth.ts`)
- `useAuth()` - Complete authentication state management
- `useUser()` - Simple user state access
- `useRequireAuth()` - Enforced authentication for components

## Migration from Session Cookies

The system maintains backward compatibility during migration:

### Before (Hybrid Approach - REMOVED)
```typescript
// OLD: Pages used session cookies (removed)
// OLD: API used Bearer tokens (now unified)
```

### After (Unified Bearer Tokens)
```typescript
// Both pages and API use Bearer tokens
const token = await authService.getToken();
const authenticatedClient = await authService.getAuthenticatedClient();
```

## Usage Examples

### In React Components
```tsx
import { useAuth } from '../lib/hooks/useAuth';

function LoginComponent() {
  const { login, isAuthenticated, user, loading } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    const result = await login({ email, password });
    if (result.success) {
      // Login successful
    } else {
      // Handle error: result.error
    }
  };
}
```

### In API Calls
```typescript
import { authenticatedApiClient } from '../lib/auth/authenticated-api-client';

// Automatically includes Bearer token
const result = await authenticatedApiClient.get<FlashcardsResponse>('/api/flashcards');
```

### In Astro Pages
```astro
---
// Token is automatically validated by middleware
const user = Astro.locals.user; // Available if authenticated
const supabase = Astro.locals.supabase; // Authenticated client
---
```

## Security Features

### Token Security
- Tokens stored in sessionStorage (more secure than localStorage)
- Automatic token refresh before expiration
- Secure httpOnly cookie fallback for SSR
- Token validation on every request

### Request Security
- Automatic Bearer token injection
- CSRF protection not needed (stateless)
- Rate limiting per user
- Proper error handling and logging

### Route Protection
- Unified middleware for all routes
- Automatic redirects for unauthenticated users
- Guest-only route protection
- API vs page route handling

## Configuration

### Environment Variables
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### Supabase Settings
- JWT expiry: 3600 seconds (1 hour)
- Refresh token rotation: enabled
- Email confirmations: disabled (auto-confirm)
- Rate limiting: 60 requests/hour per IP

## Testing

### Manual Testing
1. **Login Flow**: Visit `/auth/login`, login, verify redirect to `/generator`
2. **Protected Routes**: Access `/flashcards` without login, verify redirect to login
3. **API Calls**: Check that flashcards and generator work correctly
4. **Token Refresh**: Wait for token expiration, verify automatic refresh
5. **Logout**: Verify complete session cleanup

### Debug Tools
```typescript
// Check current auth state
import { authService } from '../lib/auth/auth-service';

console.log('User:', authService.getCurrentUser());
console.log('Token:', await authService.getToken());
console.log('Authenticated:', await authService.isAuthenticated());
```

## Troubleshooting

### Common Issues

1. **"Authentication required" errors**
   - Check if token is present: `await authService.getToken()`
   - Verify token validity: `await authService.isAuthenticated()`
   - Check Supabase JWT settings

2. **Infinite redirect loops**
   - Verify route protection configuration
   - Check middleware token extraction logic
   - Ensure proper fallbacks in token storage

3. **API calls failing**
   - Verify Bearer token in request headers
   - Check Supabase RLS policies
   - Ensure authenticated client is used

### Debug Commands
```bash
# Check if middleware is working
curl -X GET http://localhost:3000/generator
# Should redirect to login if not authenticated

# Test API with token
curl -X GET http://localhost:3000/api/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Migration Checklist

- [x] ✅ Create token storage system
- [x] ✅ Create unified auth service  
- [x] ✅ Refactor middleware for Bearer tokens only
- [x] ✅ Update API client with authentication
- [x] ✅ Update auth forms to use auth service
- [x] ✅ Mark session cookie logic as deprecated
- [x] ✅ Create React hooks for auth state
- [ ] 🔄 Test complete implementation
- [ ] 📝 Update documentation
- [ ] 🧹 Remove deprecated session code (future cleanup)

## Future Improvements

1. **Token Encryption**: Encrypt tokens in storage for additional security
2. **Biometric Auth**: Add fingerprint/face ID support for mobile
3. **Multi-Factor Auth**: Implement TOTP/SMS verification
4. **Session Management**: Add device management and remote logout
5. **Analytics**: Add authentication event tracking