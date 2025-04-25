import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy adres email" }),
  password: z.string().min(1, { message: "Hasło jest wymagane" }),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy adres email" }),
  // Add Supabase password requirements if needed (e.g., min length)
  password: z.string().min(6, { message: "Hasło musi mieć co najmniej 6 znaków" }),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
