import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";
import { getPrisma } from "./helpers/prisma-test";

const login = async (
  app: ReturnType<typeof createApp>,
  email: string,
  password: string
) => {
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
};

describe("POST /users RBAC", () => {
  const app = createApp();

  beforeAll(async () => {
    await seedAdminAndViewer();
  });

  it("allows ADMIN to create user", async () => {
    const prisma = getPrisma();
    const viewer = await prisma.role.findUnique({ where: { name: "VIEWER" } });
    if (!viewer) throw new Error("VIEWER role missing in test DB");

    const token = await login(app, "admin@tcpl.test", "Passw0rd!");
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: `rbac.test-${Math.random()}@tcpl.test`,
        password: "Passw0rd!",
        name: "New User",
        roleId: viewer.id,
      });

    expect([200, 201]).toContain(res.status);
  });

  it("block USER from creating user", async () => {
    const token = await login(app, "viewer@tcpl.test", "Passw0rd!");
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "nope@tcpl.test",
        password: "Passw0rd!",
        name: "Nope User",
        roleId: "dummy",
      });

    expect([401, 403]).toContain(res.status);
  });
});
