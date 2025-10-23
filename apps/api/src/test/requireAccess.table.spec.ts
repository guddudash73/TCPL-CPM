import request from "supertest";
import { createApp } from "../app";
import { getPrisma } from "./helpers/prisma-test";
import { seedAdminAndViewer } from "./helpers/seed";

const prisma = getPrisma();
const app = createApp();

const login = async (email: string, password: string) => {
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
};

jest.setTimeout(60_000);

describe("Access control on BOQ writes", () => {
  let adminToken: string;
  let viewerToken: string;
  let projectId: string;

  beforeAll(async () => {
    await seedAdminAndViewer();
    adminToken = await login("admin@tcpl.test", "Passw0rd!");
    viewerToken = await login("viewer@tcpl.test", "Passw0rd!");

    const project = await prisma.project.create({
      data: { code: `ACC-${Date.now()}`, name: `Access Test ${Date.now()}` },
    });
    projectId = project.id;

    // Ensure both users are members so membership is not the reason for 403
    const [admin, viewer] = await Promise.all([
      prisma.user.findFirstOrThrow({
        where: { emailLower: "admin@tcpl.test" },
        select: { id: true, roleId: true },
      }),
      prisma.user.findFirstOrThrow({
        where: { emailLower: "viewer@tcpl.test" },
        select: { id: true, roleId: true },
      }),
    ]);

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: admin.id } },
      update: {},
      create: { projectId, userId: admin.id, roleId: admin.roleId },
    });
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: viewer.id } },
      update: {},
      create: { projectId, userId: viewer.id, roleId: viewer.roleId },
    });
  });

  it("ADMIN can create BOQ (201)", async () => {
    await request(app)
      .post(`/projects/${projectId}/boq`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "ACCADM",
        description: "Admin created",
        unit: "NOS",
        qtyPlanned: "1",
        ratePlanned: "1",
      })
      .expect(201);
  });

  it("VIEWER cannot create BOQ (403)", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/boq`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        code: "ACCVIEW",
        description: "Viewer attempt",
        unit: "NOS",
        qtyPlanned: "1",
        ratePlanned: "1",
      });
    expect(res.status).toBe(403);
    expect(res.body?.code ?? res.body?.error?.code).toMatch(/FORBIDDEN/i);
  });
});
