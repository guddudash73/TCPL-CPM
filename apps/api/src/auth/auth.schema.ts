import z from "zod";

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginBody = z.infer<typeof LoginBody>;

export const RefreshBody = z.object({
  refreshToken: z.string().min(20),
});

export type RefreshBody = z.infer<typeof RefreshBody>;

export const TokenPair = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const AuthUser = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  roleId: z.string(),
});

export type AuthUser = z.infer<typeof AuthUser>;

export const AuthSucess = z.object({
  user: AuthUser,
  tokens: TokenPair,
});

export type AuthSucess = z.infer<typeof AuthSucess>;
