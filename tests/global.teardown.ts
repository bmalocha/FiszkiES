/* eslint-disable no-console */
import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types"; // Adjust path if needed
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const e2eUserId = process.env.E2E_USERNAME_ID; // Ensure this is set in .env.test

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined in environment variables.");
}

if (!e2eUserId) {
  console.warn("E2E_USERNAME_ID not set, skipping flashcard cleanup.");
}

// Initialize Supabase client directly for teardown logic
// Note: Cannot use Astro context or service layers here as it's outside the app runtime
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

teardown("Clean up E2E user flashcards", async () => {
  if (!e2eUserId) {
    console.log("Skipping teardown: E2E_USERNAME_ID not provided.");
    return;
  }

  console.log(`Starting teardown: Deleting flashcards for user ${e2eUserId}...`);

  const { error } = await supabase.from("flashcards").delete().eq("user_id", e2eUserId);

  if (error) {
    console.error("Error deleting flashcards during teardown:", error.message);
    // Decide if the teardown should fail the run. Usually, teardown errors are logged but don't fail the suite.
  } else {
    console.log(`Successfully deleted flashcards for user ${e2eUserId}.`);
  }
});
