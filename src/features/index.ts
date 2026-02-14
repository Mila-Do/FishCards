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
 * Get current environment from ENV_NAME variable
 * Defaults to "local" if not set or invalid
 */
function getCurrentEnvironment(): Environment {
  const currentEnv: Environment = (import.meta.env.ENV_NAME as Environment) || "local";
  return currentEnv;
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
 * @returns `true` if feature is enabled, `false` if disabled or undefined
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
 * @returns Complete feature configuration for current environment
 *
 * @example
 * ```typescript
 * const features = getAllFeatures();
 * console.log(features.auth.login); // true/false
 * ```
 */
export function getAllFeatures(): Features {
  const env = getCurrentEnvironment();
  return featureConfig[env];
}

/**
 * Check if a feature flag exists in the configuration
 *
 * @param featureKey - Feature flag key to check
 * @returns `true` if feature exists in config, `false` otherwise
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
 * @returns Current environment ("local", "integration", or "prod")
 *
 * @example
 * ```typescript
 * const env = getEnvironment();
 * console.log(`Running in ${env} environment`);
 * ```
 */
export function getEnvironment(): Environment {
  return getCurrentEnvironment();
}

// Re-export types for convenience
export type { Environment, Features, FeatureKey } from "./types";
