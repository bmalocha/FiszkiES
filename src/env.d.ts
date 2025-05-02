/// <reference types="astro/client" />
// This triple-slash directive tells TypeScript to include type definitions for Astro's client-side runtime.
// It enables proper type checking and autocompletion for Astro-specific features in the client environment.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

// Define the schema for environment variables
// https://docs.astro.build/en/guides/environment-variables/#intellisense-for-typescript
interface ImportMetaEnv extends Record<string, string | undefined | boolean> {
  // Server-side variables
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;

  // Add other environment variables here as needed
  // Example public client-side variable:
  // readonly PUBLIC_GOOGLE_ANALYTICS_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
