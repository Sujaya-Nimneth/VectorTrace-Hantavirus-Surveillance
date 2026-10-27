import { defineConfig } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .env, .env.example, dist/server/.dev.vars. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

export default defineConfig({
  worker: {
    name: "vectortrace-hantavirus-surveillance",
    compatibilityDate: "2025-09-24",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "src/server.ts",
  },
});
