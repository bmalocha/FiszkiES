import type { APIContext } from "astro";
import { type SupabaseClient } from "@supabase/supabase-js"; // Import type directly
import { LoginSchema, type LoginDto } from "@/lib/schemas/auth.schema";
import { log } from "@/lib/utils/logger";
import { ZodError } from "zod"; // Import ZodError

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  // Type assertion might be needed if middleware doesn't guarantee type
  const supabase = context.locals.supabase as SupabaseClient;

  if (!supabase) {
    log("error", "Login API: Supabase client not found in context");
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }

  let requestData: LoginDto;
  try {
    const rawData = await context.request.json();
    requestData = LoginSchema.parse(rawData);
    log("info", `Login attempt for email: ${requestData.email}`);
  } catch (error: unknown) {
    let message = "Invalid request body";
    let details: Record<string, string[] | undefined> | Record<string, unknown> = {};
    if (error instanceof ZodError) {
      message = "Validation Error";
      details = error.flatten().fieldErrors;
      log("warn", "Login API: Validation Error", details as Record<string, unknown>, error);
    } else if (error instanceof Error) {
      message = error.message;
      details = { general: message };
      log("warn", "Login API: Invalid request body", details, error);
    } else {
      message = String(error);
      details = { general: message };
      log("warn", "Login API: Unknown parsing error", details);
    }
    return new Response(JSON.stringify({ error: message, details }), { status: 400 });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: requestData.email,
      password: requestData.password,
    });

    if (error) {
      log("warn", `Login API: Supabase sign-in error for ${requestData.email}`, undefined, error);
      // Provide a generic error message for security
      return new Response(JSON.stringify({ error: "Nieprawidłowy email lub hasło" }), { status: 401 });
    }

    if (!data.session || !data.user) {
      log("error", `Login API: Sign-in succeeded but no session/user returned for ${requestData.email}`);
      return new Response(JSON.stringify({ error: "Logowanie nie powiodło się, spróbuj ponownie" }), { status: 500 });
    }

    // Set cookies for the session
    const { access_token, refresh_token } = data.session;
    context.cookies.set("sb-access-token", access_token, {
      path: "/",
      maxAge: data.session.expires_in, // Use expiration from Supabase
      httpOnly: true,
      secure: import.meta.env.PROD, // Use secure cookies in production
      sameSite: "lax",
    });
    context.cookies.set("sb-refresh-token", refresh_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // Example: 30 days, adjust as needed
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
    });

    log("info", `Login successful for user: ${data.user.id} (${requestData.email})`);
    // Return user info (optional, adjust as needed)
    return new Response(JSON.stringify({ userId: data.user.id, email: data.user.email }), { status: 200 });
  } catch (error: unknown) {
    const contextInfo = { email: requestData?.email };
    log("error", "Login API: Unexpected error during sign-in", contextInfo, error instanceof Error ? error : undefined);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
