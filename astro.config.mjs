// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import { readFileSync, existsSync } from "fs";
import { parse } from "dotenv";

/**
 * Vite plugin that loads .env.[envName].public files into import.meta.env.
 *
 * Vite only understands .env, .env.local, .env.[mode], .env.[mode].local.
 * This plugin bridges the gap by reading the project's .public convention and
 * injecting PUBLIC_* vars via vite.define (build-time literal replacement).
 *
 * Mode → env file mapping:
 *   development → .env.local.public
 *   test        → .env.test.public
 *   production  → .env.production.public
 */
function publicEnvPlugin() {
  const modeToEnvName = {
    development: "local",
    test: "test",
    production: "production",
  };

  return {
    name: "public-env-loader",
    /** @param {import('vite').UserConfig} _viteConfig @param {import('vite').ConfigEnv} env */
    config(_viteConfig, { mode }) {
      const envName = modeToEnvName[/** @type {keyof typeof modeToEnvName} */ (mode)] ?? mode;
      const envFilePath = `.env.${envName}.public`;

      if (!existsSync(envFilePath)) {
        return;
      }

      const parsed = parse(readFileSync(envFilePath, "utf-8"));
      /** @type {Record<string, string>} */
      const define = {};

      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith("PUBLIC_")) {
          define[`import.meta.env.${key}`] = JSON.stringify(value);
        }
      }

      return { define };
    },
  };
}

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [publicEnvPlugin(), tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
