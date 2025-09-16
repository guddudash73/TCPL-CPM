import { envSchema } from "./env";

const withVars = (vars: Record<string, string>) => ({
  ...process.env,
  ...vars,
});

describe("env schema", () => {
  it('accepts valid TTLs like "15m" and "7d"', () => {
    const parsed = envSchema.parse(
      withVars({
        JWT_SECRET: "secret",
        JWT_EXPIRES_IN: "15m",
        REFRESH_TOKEN_TTL: "7d",
        DATABASE_URL: "postgres://user:pass@localhost:5432/db",
        PORT: "4000",
      })
    );
    expect(parsed.JWT_EXPIRES_IN).toBeDefined();
  });

  it("rejects invalid TTLs", () => {
    expect(() =>
      envSchema.parse(
        withVars({
          JWT_SECRET: "secret",
          JWT_EXPIRES_IN: "fifteen",
          REFRESH_TOKEN_TTL: "forever",
          DATABASE_URL: "postgres://user:pass@localhost:5432/db",
          PORT: "4000",
        })
      )
    ).toThrow();
  });
});
