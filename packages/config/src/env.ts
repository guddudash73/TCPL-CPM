// packages/config/src/env.ts
import { z } from "zod";

const toLower = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : v);

// Normalize common synonyms so we accept both dev/prod variants
const normalizeAppEnv = (v: unknown) => {
  const s = typeof v === "string" ? v.toLowerCase() : undefined;
  if (!s) return s;
  if (s === "dev" || s === "development") return "local";
  if (s === "prod") return "production";
  return s; // local | staging | production (already lowercase)
};

const positiveInt = z.coerce.number().int().positive();

const envSchema = z.object({
  NODE_ENV: z
    .preprocess(toLower, z.enum(["development", "test", "production"]))
    .default("development"),

  APP_ENV: z
    .preprocess(normalizeAppEnv, z.enum(["local", "staging", "production"]))
    .default("local"),

  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),
  PRISMA_DATABASE_URL: z.string().url().optional(),

  JWT_SECRET: z.string().min(32, "JWT_SECRET should be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  BCRYPT_COST: positiveInt.default(12),
  TOKEN_HASH_PEPPER: z.string().optional(),
  SESSION_MAX_CONCURRENT: positiveInt.default(10),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
export { envSchema };
