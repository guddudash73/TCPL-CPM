import { z } from "zod";

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  roleId: z.string().cuid(),
  name: z.string().min(1).max(120),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createUserOutputSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  roleId: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

export type CreateUserOutput = z.infer<typeof createUserOutputSchema>;
