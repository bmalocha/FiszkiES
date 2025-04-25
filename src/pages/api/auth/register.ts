import type { APIContext } from "astro";
import { type SupabaseClient, AuthApiError } from "@supabase/supabase-js";
import { RegisterSchema, type RegisterDto } from "@/lib/schemas/auth.schema";
import { log } from "@/lib/utils/logger";
import { ZodError } from "zod";

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase as SupabaseClient;

  if (!supabase) {
    log("error", "Register API: Supabase client not found in context");
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }

  let requestData: RegisterDto;
  try {
    const rawData = await context.request.json();
    requestData = RegisterSchema.parse(rawData);
    log("info", `Registration attempt for email: ${requestData.email}`);
  } catch (error: unknown) {
    let message = "Invalid request body";
    let details: Record<string, string[] | undefined> | Record<string, unknown> = {};
    if (error instanceof ZodError) {
      message = "Validation Error";
      details = error.flatten().fieldErrors;
      log("warn", "Register API: Validation Error", details as Record<string, unknown>, error);
    } else if (error instanceof Error) {
      message = error.message;
      details = { general: message };
      log("warn", "Register API: Invalid request body", details, error);
    } else {
      message = String(error);
      details = { general: message };
      log("warn", "Register API: Unknown parsing error", details);
    }
    return new Response(JSON.stringify({ error: message, details }), { status: 400 });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: requestData.email,
      password: requestData.password,
      // Add options if needed, e.g., email confirmation redirect
      // options: {
      //   emailRedirectTo: `${context.url.origin}/confirm-email`,
      // }
    });

    if (error) {
      // Handle specific errors like email already registered
      if (
        error instanceof AuthApiError &&
        (error.status === 400 || error.message.includes("User already registered"))
      ) {
        log("warn", `Register API: Email already registered: ${requestData.email}`);
        return new Response(JSON.stringify({ error: "Użytkownik o tym adresie email już istnieje" }), { status: 409 }); // 409 Conflict
      }
      log("error", `Register API: Supabase sign-up error for ${requestData.email}`, undefined, error);
      return new Response(JSON.stringify({ error: "Rejestracja nie powiodła się, spróbuj ponownie" }), { status: 500 });
    }

    if (!data.user) {
      log("error", `Register API: Sign-up succeeded but no user returned for ${requestData.email}`);
      return new Response(JSON.stringify({ error: "Rejestracja nie powiodła się, spróbuj ponownie" }), { status: 500 });
    }

    // According to US-001, no email verification is needed.
    log("info", `Registration successful for user: ${data.user.id} (${requestData.email})`);
    // Return minimal success response or user info
    return new Response(JSON.stringify({ message: "Rejestracja zakończona sukcesem", userId: data.user.id }), {
      status: 201,
    }); // 201 Created
  } catch (error: unknown) {
    const contextInfo = { email: requestData?.email };
    log(
      "error",
      "Register API: Unexpected error during sign-up",
      contextInfo,
      error instanceof Error ? error : undefined
    );
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
