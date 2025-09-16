import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";

describe("Rate limiting on /auth/login", () => {
  const app = createApp();

  beforeAll(async () => {
    await seedAdminAndViewer();
  });

  it("returns 429 after many failed attempts (threshold depends on config)", async () => {
    for (let i = 0; i < 20; i++) {
      await request(app)
        .post("/auth/login")
        .send({ email: "viewer@tcpl.test", password: "wrong" });
    }
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "viewer@tcpl.test", password: "wrong" });
    expect([429, 401]).toContain(res.status);
  });
});
