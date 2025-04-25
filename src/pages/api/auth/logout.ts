import type { APIContext } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "@/lib/utils/logger";

export const prerender = false;

// Use POST for logout as it changes server state (session)
export async function POST(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase as SupabaseClient;
  const user = context.locals.user;

  if (!supabase) {
    log("error", "Logout API: Supabase client not found in context");
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }

  if (!user) {
    // User is already logged out, or session is invalid
    log("info", "Logout API: No active user session found to log out.");
    // Clear cookies just in case they are somehow stale
    context.cookies.delete("sb-access-token", { path: "/" });
    context.cookies.delete("sb-refresh-token", { path: "/" });
    return new Response(JSON.stringify({ message: "No active session" }), { status: 200 });
  }

  log("info", `Logout API: Attempting to log out user: ${user.id}`);

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      log("error", `Logout API: Supabase sign out error for user ${user.id}`, undefined, error);
      // Still proceed to clear cookies, but report internal error
      context.cookies.delete("sb-access-token", { path: "/" });
      context.cookies.delete("sb-refresh-token", { path: "/" });
      return new Response(JSON.stringify({ error: "Błąd podczas wylogowywania" }), { status: 500 });
    }

    // Clear the cookies on successful sign out
    context.cookies.delete("sb-access-token", { path: "/" });
    context.cookies.delete("sb-refresh-token", { path: "/" });

    log("info", `Logout API: User ${user.id} logged out successfully.`);
    return new Response(JSON.stringify({ message: "Wylogowano pomyślnie" }), { status: 200 });
  } catch (e: unknown) {
    log(
      "error",
      `Logout API: Unexpected error during sign out for user ${user.id}`,
      undefined,
      e instanceof Error ? e : undefined
    );
    // Attempt to clear cookies even if there was an unexpected error
    context.cookies.delete("sb-access-token", { path: "/" });
    context.cookies.delete("sb-refresh-token", { path: "/" });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

// Optional: Allow GET for simpler link-based logout, though POST is preferred
export async function GET(context: APIContext): Promise<Response> {
  log("warn", "Logout API: Received GET request for logout. POST is preferred.");
  // Reuse POST logic for simplicity here
  return POST(context);
}
