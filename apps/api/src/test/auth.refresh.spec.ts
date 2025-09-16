import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";

describe("POST /auth/refresh", () => {
  const app = createApp();
  let refresh1 = "";

  beforeAll(async () => {
    await seedAdminAndViewer();
    const login = await request(app)
      .post("/auth/login")
      .send({ email: "admin@tcpl.test", password: "Passw0rd!" });

    refresh1 = login.body.tokens.refreshToken;
  });

  it("rotates refresh token and return new tokens", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: refresh1 });
    expect(res.status).toBe(200);
    expect(res.body.tokens).toHaveProperty("accessToken");
    expect(res.body.tokens).toHaveProperty("refreshToken");
    expect(res.body.tokens.refeshToken).not.toEqual(refresh1);
  });

  it("detects reuse of an already-used refresh token", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: refresh1 });
    expect([401, 403]).toContain(res.status);
  });
});
