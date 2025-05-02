// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
// import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "public" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    // Workaround for React 19 + Cloudflare: https://github.com/withastro/astro/issues/12824#issuecomment-2563095382
    resolve: {
      alias: import.meta.env.PROD
        ? {
            "react-dom/server": "react-dom/server.edge",
          }
        : {},
    },
  },
  adapter: cloudflare(),
  experimental: {
    session: true,
  },
});
