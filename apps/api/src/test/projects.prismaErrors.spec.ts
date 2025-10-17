import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";

async function login(email: string, password: string) {
  const app = createApp();
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
}

describe("Projects - Prisma error mapping", () => {
  const app = createApp();
  let token: string;

  beforeAll(async () => {
    await seedAdminAndViewer();
    token = await login("admin@tcpl.test", "Passw0rd!");
  });

  it("returns 409 FK_CONFLICT when projectManagerUserId is invalid (P2003)", async () => {
    const NON_EXISTENT_PM_ID = "vhko123sdfjkaf23laf2";
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: `INV-${Date.now()}`,
        name: `Invalid PM ${Date.now()}`,
        projectManagerUserId: NON_EXISTENT_PM_ID,
      });

    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe("FK_CONFLICT");
  });
});
