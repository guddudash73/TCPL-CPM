import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";

describe("POST /auth/login", () => {
  const app = createApp();

  beforeAll(async () => {
    await seedAdminAndViewer();
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "admin@tcpl.test",
      password: "Passw0rd!",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("tokens");
    expect(res.body.tokens).toHaveProperty("accessToken");
    expect(res.body.tokens).toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("admin@tcpl.test");
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@tcpl.test", password: "wrong" });

    expect([400, 401]).toContain(res.status);
  });
});
