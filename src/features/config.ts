/**
 * Feature Flags - Configuration
 */

import type { FeatureConfig } from "./types";

/**
 * Feature flags configuration for all environments
 *
 * This configuration is static and defined at build-time.
 * Changes require redeployment.
 */
export const featureConfig: FeatureConfig = {
  /**
   * Local development environment
   * All features enabled for development and testing
   */
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

  /**
   * Integration/staging environment
   * Most features enabled, some disabled for controlled testing
   */
  integration: {
    auth: {
      login: true,
      register: true,
      resetPassword: true, // Testing without password reset
    },
    collections: {
      create: true,
      read: true,
      update: true,
      delete: true, // No deletion on integration
      visibility: true,
    },
  },

  /**
   * Production environment
   * Features controlled based on release readiness
   */
  prod: {
    auth: {
      login: true,
      register: true, // Registration disabled in production
      resetPassword: true,
    },
    collections: {
      create: true, // Collection creation disabled
      read: true,
      update: true, // Updates disabled
      delete: true, // Deletion disabled
      visibility: true,
    },
  },
};
