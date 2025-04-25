// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../env.d.ts" />

import type { APIContext, MiddlewareNext } from "astro";
import { supabaseClient } from "@/db/supabase.client";
import { log } from "@/lib/utils/logger";
import type { User } from "@supabase/supabase-js";

// Define a type for locals for better type safety
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace App {
    interface Locals {
      supabase: typeof supabaseClient;
      user: User | null;
    }
  }
}

// Define protected routes
const protectedRoutes = ["/generate", "/my-flashcards", "/repeat"]; // Add other routes as needed
const authRoutes = ["/login", "/register"];

export async function onRequest(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  let user: User | null = null;

  const serverSupabase = supabaseClient;

  if (accessToken && refreshToken) {
    log("info", "Middleware: Found auth tokens in cookies");
    try {
      const { error: sessionError } = await serverSupabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        log("warn", "Middleware: Error setting session from tokens", undefined, sessionError);
        context.cookies.delete("sb-access-token", { path: "/" });
        context.cookies.delete("sb-refresh-token", { path: "/" });
      } else {
        const {
          data: { user: sessionUser },
          error: userError,
        } = await serverSupabase.auth.getUser();

        if (userError) {
          log("warn", "Middleware: Error getting user from session", undefined, userError);
          context.cookies.delete("sb-access-token", { path: "/" });
          context.cookies.delete("sb-refresh-token", { path: "/" });
        } else if (sessionUser) {
          user = sessionUser;
          log("info", `Middleware: User authenticated: ${user.id}`);
        } else {
          log("info", "Middleware: Tokens present but no active user session found.");
        }
      }
    } catch (e: unknown) {
      log(
        "error",
        "Middleware: Unexpected error during session validation",
        undefined,
        e instanceof Error ? e : undefined
      );
    }
  } else {
    log("info", "Middleware: No auth tokens found in cookies.");
  }

  context.locals.supabase = serverSupabase;
  context.locals.user = user;

  const currentPath = context.url.pathname;

  // Route Protection Logic
  // 1. If user is NOT logged in and trying to access a protected route
  if (!user && protectedRoutes.some((route) => currentPath.startsWith(route))) {
    log("info", `Middleware: Unauthorized access attempt to ${currentPath}. Redirecting to login.`);
    // Redirect to login, preserving the intended destination
    return context.redirect(`/login?redirect=${encodeURIComponent(currentPath)}`, 307); // 307 Temporary Redirect
  }

  // 2. If user IS logged in and trying to access login/register pages
  if (user && authRoutes.some((route) => currentPath.startsWith(route))) {
    log("info", `Middleware: Authenticated user accessing ${currentPath}. Redirecting to home.`);
    // Redirect to home page
    return context.redirect("/", 307);
  }

  // If none of the above conditions are met, proceed to the requested page
  log("info", `Middleware: Allowing access to ${currentPath} for user: ${user?.id ?? "Guest"}`);
  return next();
}
