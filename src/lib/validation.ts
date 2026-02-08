import { z } from "zod";
import { Translations } from "./translations";

export const createAuthSchemas = (t: Translations) => {
  const emailSchema = z
    .string()
    .min(1, { message: t.emailRequired })
    .email({ message: t.invalidEmail })
    .max(255);

  const passwordSchema = z
    .string()
    .min(1, { message: t.passwordRequired })
    .min(6, { message: t.passwordTooShort })
    .regex(/[A-Z]/, { message: t.passwordNeedsUppercase })
    .regex(/[0-9]/, { message: t.passwordNeedsNumber });

  const loginPasswordSchema = z
    .string()
    .min(1, { message: t.passwordRequired });

  return {
    loginSchema: z.object({
      email: emailSchema,
      password: loginPasswordSchema,
    }),
    signupSchema: z.object({
      email: emailSchema,
      password: passwordSchema,
    }),
    forgotSchema: z.object({
      email: emailSchema,
    }),
    resetPasswordSchema: z
      .object({
        password: passwordSchema,
        confirmPassword: z.string().min(1, { message: t.passwordRequired }),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t.passwordsDoNotMatch,
        path: ["confirmPassword"],
      }),
  };
};

export type LoginFormData = z.infer<ReturnType<typeof createAuthSchemas>["loginSchema"]>;
export type SignupFormData = z.infer<ReturnType<typeof createAuthSchemas>["signupSchema"]>;
export type ForgotFormData = z.infer<ReturnType<typeof createAuthSchemas>["forgotSchema"]>;
export type ResetPasswordFormData = z.infer<ReturnType<typeof createAuthSchemas>["resetPasswordSchema"]>;
