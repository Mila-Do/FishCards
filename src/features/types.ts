/**
 * Feature Flags - Type Definitions
 */

/**
 * Supported environments
 */
export type Environment = "local" | "integration" | "prod";

/**
 * Auth-related feature flags
 */
export interface AuthFeatures {
  login: boolean;
  register: boolean;
  resetPassword: boolean;
}

/**
 * Collections-related feature flags
 */
export interface CollectionsFeatures {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  visibility: boolean;
}

/**
 * Complete feature flags structure
 */
export interface Features {
  auth: AuthFeatures;
  collections: CollectionsFeatures;
}
/**
 * Feature flags configuration per environment
 */
export type FeatureConfig = Record<Environment, Features>;

/**
 * Valid feature flag keys using dot notation
 */
export type FeatureKey =
  | "auth.login"
  | "auth.register"
  | "auth.resetPassword"
  | "collections.create"
  | "collections.read"
  | "collections.update"
  | "collections.delete"
  | "collections.visibility";
