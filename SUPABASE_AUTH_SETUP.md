# Supabase Auth Configuration for FishCards

## Overview
This document describes the required Supabase configuration to support the FishCards authentication system based on the implemented integration.

## Required Supabase Settings

### 1. Email Authentication Configuration

In your Supabase Dashboard → Authentication → Settings:

#### Email Settings
- **Enable email confirmations**: `DISABLED` 
  - Reason: US-001 requirement for immediate account activation
  - Users should be auto-confirmed upon registration

#### Auth Settings  
- **Enable email confirmations**: `false`
- **Enable phone confirmations**: `false` (not used in MVP)
- **Enable manual linking**: `false`

### 2. URL Configuration

#### Site URL
Set your site URL in Authentication → Settings → Site URL:
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

#### Redirect URLs
Add these redirect URLs in Authentication → Settings → Redirect URLs:
- `http://localhost:3000/auth/reset-password` (development)
- `https://yourdomain.com/auth/reset-password` (production)

### 3. Email Templates

#### Password Reset Template
Customize the password reset email template:
- Go to Authentication → Templates → Reset Password
- Ensure the reset link redirects to: `{{ .SiteURL }}/auth/reset-password`

### 4. Security Settings

#### JWT Settings (Authentication → Settings → JWT Settings)
- **JWT expiry**: 3600 (1 hour) - recommended for security
- **Refresh token rotation**: `enabled`
- **Reuse interval**: 10 (seconds)

#### Rate Limiting
Configure rate limits in Authentication → Rate Limits:
- **Auth**: 60 requests per hour per IP
- **Anonymous sign-ups**: 30 per hour per IP

### 5. Database Policies (Row Level Security)

Ensure RLS is enabled for user-related tables with proper policies:

```sql
-- Enable RLS on flashcards table
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own flashcards
CREATE POLICY "Users can manage own flashcards" ON flashcards
    FOR ALL USING (auth.uid() = user_id);

-- Similar policies for other user-specific tables
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own generations" ON generations
    FOR ALL USING (auth.uid() = user_id);
```

### 6. Environment Variables

Ensure these environment variables are set:

```env
# .env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# For production, also set:
SUPABASE_SERVICE_KEY=your_service_role_key  # Only if needed for admin operations
```

## Testing Authentication

### Development Testing

The application includes development tokens for testing API endpoints:
- `dev-token-user1` → maps to user ID `81ae3963-b7c1-495e-bef5-4be876d4390a`
- `dev-token-user2` → maps to user ID `fc161727-fbda-42f5-bd8b-8a0d219e363b`

These work only in development mode for security.

### Manual Testing Steps

1. **Registration Flow**:
   - Go to `/auth/register`
   - Register with valid email/password
   - Should be automatically logged in (US-001)
   - Should redirect to `/generator`

2. **Login Flow**:
   - Go to `/auth/login` 
   - Login with registered credentials
   - Should redirect to `/generator` or specified redirect URL

3. **Protected Routes**:
   - Try accessing `/generator` or `/flashcards` without login
   - Should redirect to `/auth/login?redirect=<original_path>`
   - After login, should redirect back to original path

4. **Guest-Only Routes**:
   - While logged in, try accessing `/auth/login`
   - Should redirect to `/generator`

## Troubleshooting

### Common Issues

1. **"Invalid or expired token" errors**:
   - Check JWT expiry settings
   - Ensure cookies are being set properly
   - Verify SUPABASE_URL and SUPABASE_KEY

2. **Email confirmations required** (should not happen):
   - Ensure "Enable email confirmations" is DISABLED
   - Check email template configuration

3. **CORS errors**:
   - Verify Site URL matches your domain
   - Add all redirect URLs to allowed list

4. **Session not persisting**:
   - Check cookie settings (secure, httpOnly, sameSite)
   - Verify middleware is running correctly

### Debug Commands

```bash
# Check middleware is working
curl -X GET http://localhost:3000/generator
# Should redirect to login if not authenticated

# Test login API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'

# Test with dev token (development only)
curl -X GET http://localhost:3000/api/flashcards \
  -H "Authorization: Bearer dev-token-user1"
```

## Production Deployment

### Security Checklist

- [ ] Email confirmations disabled (US-001 requirement)
- [ ] HTTPS enforced for production
- [ ] Secure cookies enabled (`secure: true` in production)
- [ ] Rate limiting configured
- [ ] Development tokens disabled in production
- [ ] RLS policies properly configured
- [ ] Environment variables secured

### Monitoring

Monitor these metrics in Supabase Dashboard:
- Authentication success/failure rates
- API usage patterns
- Error logs in Functions → Logs

## Integration Architecture

The implemented system uses:
- **Bearer tokens** for API endpoints (`/api/*`)
- **Session cookies** for Astro pages (server-side rendering)
- **Supabase SSR** package for proper session management
- **Middleware** for route protection and authentication

This hybrid approach maintains the existing API authentication while adding proper session management for the web interface.