/**
 * Feature Flags Module
 *
 * Universal TypeScript module for managing feature flags across frontend and backend.
 * Provides build-time configuration for different environments.
 *
 * @example
 * ```typescript
 * import { isFeatureEnabled } from "@/features";
 *
 * if (isFeatureEnabled("auth.login")) {
 *   // Handle login functionality
 * }
 * ```
 */

import { featureConfig } from "./config";
import type { Environment, Features } from "./types";

/**
 * Get current environment from PUBLIC_ENV_NAME variable
 * Returns null if not set or invalid
 *
 * Note: This works for build-time feature flags. For runtime checks in API routes,
 * use context.locals.runtime.env.PUBLIC_ENV_NAME instead.
 */
function getCurrentEnvironment(): Environment | null {
  const envValue = import.meta.env.PUBLIC_ENV_NAME as string;

  // Safety fallback: production build without explicit PUBLIC_ENV_NAME should use "prod"
  // to avoid accidentally disabling features in Cloudflare deployments.
  if (!envValue && import.meta.env.PROD) {
    return "prod";
  }

  if (!envValue) {
    return null;
  }

  const validEnvironments: Environment[] = ["local", "integration", "prod"];
  if (validEnvironments.includes(envValue as Environment)) {
    return envValue as Environment;
  }

  return null;
}

/**
 * Get nested feature value using dot notation
 * @param obj - Feature configuration object
 * @param path - Dot-notated path (e.g., "auth.login")
 */
function getNestedValue(obj: Features, path: string): boolean | undefined {
  const keys = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }

  return typeof current === "boolean" ? current : undefined;
}

/**
 * Check if a feature is enabled for the current environment
 *
 * @param featureKey - Feature flag key in dot notation (e.g., "auth.login", "collections.create")
 * @returns `true` if feature is enabled, `false` if disabled, undefined, or environment not set
 *
 * @example
 * ```typescript
 * // Backend - API endpoint
 * if (isFeatureEnabled("auth.register")) {
 *   // Handle registration
 * }
 *
 * // Frontend - Astro page
 * if (isFeatureEnabled("collections.visibility")) {
 *   // Show collections
 * }
 * ```
 */
export function isFeatureEnabled(featureKey: string): boolean {
  const env = getCurrentEnvironment();

  if (env === null) {
    // eslint-disable-next-line no-console
    console.warn(
      `[FeatureFlag] Environment not defined (PUBLIC_ENV_NAME is null/undefined), returning false for "${featureKey}"`
    );
    return false;
  }

  const features = featureConfig[env];

  if (!features) {
    // eslint-disable-next-line no-console
    console.error(`[FeatureFlag] No configuration found for environment "${env}"`);
    return false;
  }

  const value = getNestedValue(features, featureKey);

  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[FeatureFlag] Feature "${featureKey}" not found in "${env}" environment, returning false`);
    return false;
  }

  // eslint-disable-next-line no-console
  console.info(`[FeatureFlag] Checking "${featureKey}" in "${env}": ${value}`);
  return value;
}

/**
 * Get all feature flags for the current environment
 *
 * @returns Complete feature configuration for current environment. If environment is not set, returns all flags as false.
 *
 * @example
 * ```typescript
 * const features = getAllFeatures();
 * console.log(features.auth.login); // true/false
 * ```
 */
export function getAllFeatures(): Features {
  const env = getCurrentEnvironment();

  if (env === null) {
    // eslint-disable-next-line no-console
    console.warn(
      `[FeatureFlag] Environment not defined (PUBLIC_ENV_NAME is null/undefined), returning all flags as false`
    );
    return {
      auth: {
        login: false,
        register: false,
        resetPassword: false,
      },
      collections: {
        create: false,
        read: false,
        update: false,
        delete: false,
        visibility: false,
      },
    };
  }

  return featureConfig[env];
}

/**
 * Check if a feature flag exists in the configuration
 *
 * @param featureKey - Feature flag key to check
 * @returns `true` if feature exists in config, `false` otherwise or if environment not set
 *
 * @example
 * ```typescript
 * if (featureExists("auth.login")) {
 *   console.log("Feature is defined");
 * }
 * ```
 */
export function featureExists(featureKey: string): boolean {
  const env = getCurrentEnvironment();

  if (env === null) {
    return false;
  }

  const features = featureConfig[env];

  if (!features) {
    return false;
  }

  const value = getNestedValue(features, featureKey);
  return value !== undefined;
}

/**
 * Get the current environment name
 *
 * @returns Current environment ("local", "integration", or "prod"), or null if not set
 *
 * @example
 * ```typescript
 * const env = getEnvironment();
 * if (env) {
 *   console.log(`Running in ${env} environment`);
 * } else {
 *   console.log('Environment not defined');
 * }
 * ```
 */
export function getEnvironment(): Environment | null {
  return getCurrentEnvironment();
}

// Re-export types for convenience
export type { Environment, Features, FeatureKey } from "./types";
