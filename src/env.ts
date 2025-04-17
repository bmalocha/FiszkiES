import { z } from "zod";

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
});

// This will throw if the environment variables are not properly set
export const env = envSchema.parse({
  OPENROUTER_API_KEY: import.meta.env.OPENROUTER_API_KEY,
});
