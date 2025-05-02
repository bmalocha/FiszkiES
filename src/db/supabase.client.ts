import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

import type { Database } from "./database.types";

// Remove the old constants if they exist
// const supabaseUrl = import.meta.env.SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
