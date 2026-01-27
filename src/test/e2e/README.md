# E2E Tests Documentation

## Overview

End-to-end tests for FishCards application using Playwright.

## Test Structure

### Test Projects

- **chromium-no-auth**: Tests for unauthenticated users (login, registration, home page)
- **chromium-auth**: Tests for authenticated users (dashboard, navigation, logout)

### Test Files

- `auth.setup.ts` - Login flow validation test
- `auth-flow.spec.ts` - Unauthenticated auth flows (login, registration)
- `auth-flow.authenticated.spec.ts` - Authenticated user flows
- `home.spec.ts` - Home page tests
- `pages/` - Page Object Models
- `helpers/auth-helpers.ts` - Reusable auth functions

## Running Tests

```bash
# Run all tests
bunx playwright test

# Run specific project
bunx playwright test --project=chromium-no-auth
bunx playwright test --project=chromium-auth

# Run specific file
bunx playwright test auth-flow.spec.ts

# Run with UI mode
bunx playwright test --ui

# Run with debug
bunx playwright test --debug
```

## Configuration Requirements

### Supabase Email Confirmation

**⚠️ IMPORTANT:** For registration tests to work, you need to **disable email confirmation** in Supabase:

1. Go to Supabase Dashboard
2. Navigate to: **Authentication → Email Auth**
3. **Disable "Confirm email"** toggle
4. Save changes

**Why?** 
- Test emails use `@mailinator.com` domain (test email service)
- If email confirmation is enabled, users can't log in until they confirm
- Tests can't access Mailinator inbox to confirm emails
- Disabling confirmation allows tests to complete the registration flow

**Alternative:** If you can't disable confirmation:
- Skip the registration test with `test.skip()`
- Or manually confirm emails via Mailinator during test runs
- Or use a different email domain with API access

### Test User Credentials

Tests use a pre-existing test user for login flows:

- Email: `process.env.E2E_USERNAME` (default: `testuser01@gmail.com`)
- Password: `process.env.E2E_PASSWORD` (default: `testUser01`)

Create this user manually in Supabase or update the credentials in `helpers/auth-helpers.ts`.

## Known Issues

### Email Bounce Rate

**Problem:** Creating fake email addresses (like `test-123@gmail.com`) causes bounce emails in Supabase, which can lead to account restrictions.

**Solution:** Tests now use `@mailinator.com` domain which:
- Accepts all emails (no bounces)
- Provides free test inbox
- Prevents Supabase bounce rate issues

### SessionStorage Persistence

The app uses `sessionStorage` for tokens (not `localStorage` or cookies). This means:
- Playwright `storageState` doesn't work
- Each test must log in manually using helper functions
- Navigation must use `.click()` on links (not `page.goto()`) to preserve session

## Best Practices

1. **Use helper functions** from `auth-helpers.ts` for login/logout
2. **Use Page Objects** for all page interactions
3. **Clean up after tests** - logout at the end of authenticated tests
4. **Avoid creating real users** - use test email services
5. **Run tests against test environment** - never against production

## Troubleshooting

### Tests fail with "User not authenticated"
- Check if test user exists in Supabase
- Verify credentials in `auth-helpers.ts`
- Check browser console for auth errors

### Registration tests fail
- Verify email confirmation is disabled in Supabase
- Check Supabase logs for errors
- Ensure `@mailinator.com` emails aren't blocked

### Tests are flaky
- Increase timeouts for slow operations
- Add explicit waits for dynamic content
- Check for race conditions in auth state

## Further Reading

- [Playwright Documentation](https://playwright.dev)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Mailinator](https://www.mailinator.com) - Test email service
