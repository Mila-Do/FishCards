# Feature Flags Module

Universal TypeScript module for managing feature flags across frontend and backend in Astro application.

## 🎯 Purpose

Separate deployments from releases by controlling feature availability per environment (local, integration, production).

## 📁 Structure

```
src/features/
├── index.ts      # Main module with API functions
├── config.ts     # Feature flags configuration per environment
├── types.ts      # TypeScript type definitions
└── README.md     # This file
```

## 🚀 Usage

### Basic Usage

```typescript
import { isFeatureEnabled } from '@/features';

// Check if feature is enabled
if (isFeatureEnabled('auth.login')) {
  // Handle login functionality
}

if (isFeatureEnabled('collections.create')) {
  // Handle collection creation
}
```

### Backend - API Endpoints

```typescript
// src/pages/api/auth/register.ts
import { isFeatureEnabled } from '@/features';

export async function POST(context: APIContext) {
  if (!isFeatureEnabled('auth.register')) {
    return new Response(JSON.stringify({ error: 'Registration disabled' }), {
      status: 403,
    });
  }

  // Registration logic...
}
```

### Frontend - Astro Pages

```astro
---
// src/pages/auth/register.astro
import { isFeatureEnabled } from '@/features';

const isRegistrationEnabled = isFeatureEnabled('auth.register');

if (!isRegistrationEnabled) {
  return Astro.redirect('/auth/login');
}
---

<div>
  {isRegistrationEnabled && (
    <RegisterForm />
  )}
</div>
```

### React Components

```tsx
import { isFeatureEnabled } from '@/features';

export function CollectionsList() {
  const canCreate = isFeatureEnabled('collections.create');
  
  return (
    <div>
      {canCreate && <CreateButton />}
      <CollectionItems />
    </div>
  );
}
```

## 📋 API Reference

### `isFeatureEnabled(featureKey: string): boolean`

Check if a feature is enabled for the current environment.

**Parameters:**
- `featureKey` - Feature flag key in dot notation

**Returns:**
- `true` if feature is enabled
- `false` if disabled, undefined, or environment not set

**Example:**
```typescript
isFeatureEnabled('auth.login')        // true/false
isFeatureEnabled('collections.read')  // true/false
```

---

### `getAllFeatures(): Features`

Get all feature flags for the current environment.

**Returns:** 
- Complete feature configuration object for current environment
- If environment is not set (null/undefined), returns all flags as `false`

**Example:**
```typescript
const features = getAllFeatures();
console.log(features.auth.login);           // true/false
console.log(features.collections.create);   // true/false
```

---

### `featureExists(featureKey: string): boolean`

Check if a feature flag exists in the configuration.

**Parameters:**
- `featureKey` - Feature flag key to check

**Returns:**
- `true` if feature exists in config
- `false` otherwise or if environment not set

**Example:**
```typescript
if (featureExists('auth.login')) {
  console.log('Feature is defined');
}
```

---

### `getEnvironment(): Environment | null`

Get the current environment name.

**Returns:** 
- `'local'` | `'integration'` | `'prod'` - if environment is properly set
- `null` - if `ENV_NAME` is not defined or invalid

**Example:**
```typescript
const env = getEnvironment();
if (env) {
  console.log(`Running in ${env} environment`);
} else {
  console.log('Environment not defined - all flags are disabled');
}
```

## 🏗️ Available Feature Flags

### Auth Features

| Flag | Description |
|------|-------------|
| `auth.login` | User login functionality |
| `auth.register` | User registration |
| `auth.resetPassword` | Password reset functionality |

### Collections Features

| Flag | Description |
|------|-------------|
| `collections.create` | Create new collections |
| `collections.read` | Read/view collections |
| `collections.update` | Update existing collections |
| `collections.delete` | Delete collections |
| `collections.visibility` | Show collections to users |

## ⚙️ Configuration

Feature flags are configured in `src/features/config.ts`:

```typescript
export const featureConfig: FeatureConfig = {
  local: {
    auth: {
      login: true,
      register: true,
      resetPassword: true,
    },
    collections: {
      create: true,
      read: true,
      update: true,
      delete: true,
      visibility: true,
    },
  },
  // ... integration, prod
};
```

### Environment Detection

The module reads `ENV_NAME` variable:
- From `import.meta.env.ENV_NAME` (Vite/Astro)
- From `process.env.ENV_NAME` (Node.js)

**Valid values:** `local`, `integration`, `prod`

**Behavior when ENV_NAME is not set or invalid:**
- All feature flags return `false` (safe default)
- `getEnvironment()` returns `null`
- No exceptions thrown - fail-safe design
- Warning logged to console for diagnostics

### Setting Environment Variable

```bash
# .env.local
ENV_NAME=local

# .env.integration
ENV_NAME=integration

# .env.production
ENV_NAME=prod
```

## 🔍 Logging

The module logs all feature flag checks for diagnostics:

```
[FeatureFlag] Checking 'auth.login' in 'local': true
[FeatureFlag] Checking 'collections.create' in 'prod': false
[FeatureFlag] Feature "unknown.feature" not found in "local" environment, returning false
[FeatureFlag] Environment not defined (ENV_NAME is null/undefined), returning false for "auth.login"
```

## 🛡️ Error Handling

- **Undefined flag:** Returns `false` + warning log
- **Invalid ENV_NAME:** All flags return `false` + warning log
- **Missing ENV_NAME:** All flags return `false` + warning log  
- **Null environment:** `getEnvironment()` returns `null`, all flags are `false`
- **No exceptions thrown:** Fail-safe design ensures application continues to work

## ✅ Benefits

- ✅ Single source of truth for feature availability
- ✅ Type-safe with TypeScript
- ✅ Works on both frontend and backend
- ✅ Easy to test different configurations
- ✅ Safe rollback (just change flag value)
- ✅ No runtime dependencies
- ✅ **Safe by default:** Undefined environment = all features disabled
- ✅ **Fail-safe design:** Never breaks application, always returns valid values

## ⚠️ Limitations

- Static configuration (changes require redeploy)
- No dynamic runtime changes
- No per-user feature flags
- No management dashboard

## 🔮 Future Enhancements

- Dynamic flag updates (without redeploy)
- Per-user feature flags
- A/B testing support
- Feature flag analytics
- Management UI/dashboard

## 📝 Adding New Features

1. Add types in `types.ts`:
```typescript
export interface NewFeatures {
  feature1: boolean;
  feature2: boolean;
}

export interface Features {
  auth: AuthFeatures;
  collections: CollectionsFeatures;
  new: NewFeatures; // Add new group
}
```

2. Add configuration in `config.ts`:
```typescript
export const featureConfig: FeatureConfig = {
  local: {
    // ...
    new: {
      feature1: true,
      feature2: true,
    },
  },
  // ... other environments
};
```

3. Use in code:
```typescript
if (isFeatureEnabled('new.feature1')) {
  // New functionality
}
```

## 🧪 Testing

```typescript
// Mock ENV_NAME for testing
process.env.ENV_NAME = 'local';

// Test feature flag
const result = isFeatureEnabled('auth.login');
expect(result).toBe(true);
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-14
