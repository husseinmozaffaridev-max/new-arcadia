import z from "zod";

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z
      .string()
      .min(1, "New password is required")
      .min(8, "Password must be at least 8 characters"),
    password_confirmation: z
      .string()
      .min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Password confirmation does not match",
    path: ["password_confirmation"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
