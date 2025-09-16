import { config as load } from "dotenv";
load({ path: process.env.ENV_FILE ?? ".env.test" });

["JWT_SECRET", "JWT_EXPIRES_IN", "REFRESH_TOKEN_TTL"].forEach((k) => {
  if (!process.env[k]) throw new Error(`Missing env for test: ${k}`);
});
