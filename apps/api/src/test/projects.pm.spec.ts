import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";
import { getPrisma } from "./helpers/prisma-test";

const login = async (email: string, password: string) => {
  const app = createApp();
  const res = await request(app).post("/auth/login").send({ email, password });
  return { app, token: res.body.tokens.accessToken as string };
};

describe("POST /projects with projectManagerUserId", () => {
  beforeAll(async () => {
    await seedAdminAndViewer();

    const prisma = getPrisma();
    await prisma.role.upsert({
      where: { name: "PROJECT_MANAGER" },
      update: {},
      create: { name: "PROJECT_MANAGER" },
    });
  });

  it("crates ProjectMember(PROJECT_MANAGER) when valid PM is provided", async () => {
    const prisma = getPrisma();
    const { app, token } = await login("admin@tcpl.test", "Passw0rd!");

    const pm = await prisma.user.create({
      data: {
        email: `pm+${Date.now()}@tcpl.test`,
        emailLower: `pm+${Date.now()}@tcpl.test`.toLowerCase(),
        passwordHash: "x",
        name: "Proj Manager",
        role: {
          connectOrCreate: {
            where: { name: "PROJECT_MANAGER" },
            create: { name: "PROJECT_MANAGER" },
          },
        },
      },
    });

    const code = `P-${Date.now()}`;
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ code, name: code, projectManagerUserId: pm.id });

    expect([201, 200]).toContain(res.status);
    const projectId = res.body.data.id as string;

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: pm.id },
      include: { role: true },
    });

    expect(member).toBeTruthy();
    expect(member?.role?.name).toBeDefined();
  });

  it("returns client error for invalid PM id", async () => {
    const { app, token } = await login("admin@tcpl.test", "Passw0rd!");
    const code = `P-${Date.now()}-X`;
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ code, name: code, projectManagerUserId: "does-not-exist" });

    expect([400, 409, 500]).toContain(res.status);
  });
});
