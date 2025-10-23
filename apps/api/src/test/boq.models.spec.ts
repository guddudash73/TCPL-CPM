import request from "supertest";
import { createApp } from "../app";
import { getPrisma } from "./helpers/prisma-test";
import { seedAdminAndViewer } from "./helpers/seed";

const prisma = getPrisma();

const login = async (email: string, password: string) => {
  const app = createApp();
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
};

jest.setTimeout(60_000);

describe("BOQ models", () => {
  const app = createApp();

  let token: string;
  let projectId: string;
  let materialId: string | undefined;

  beforeAll(async () => {
    await seedAdminAndViewer();
    token = await login("admin@tcpl.test", "Passw0rd!");

    const project = await prisma.project.create({
      data: {
        code: `PRJ-${Date.now()}`,
        name: `BOQ TEST ${Date.now()}`,
      },
    });
    projectId = project.id;

    const admin = await prisma.user.findFirstOrThrow({
      where: { emailLower: "admin@tcpl.test" },
      select: { id: true, roleId: true },
    });
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: admin.id } },
      update: {},
      create: { projectId, userId: admin.id, roleId: admin.roleId },
    });

    const cat = await prisma.material.findFirst({
      where: { sku: "MAT-CEM-OPC43" },
      select: { id: true },
    });
    if (cat) {
      materialId = cat.id;
    } else {
      const created = await prisma.material.create({
        data: {
          sku: `MAT-${Date.now()}`,
          name: "Cement OPC 43 Grade",
          unit: "NOS",
        },
        select: { id: true },
      });
      materialId = created.id;
    }
  });

  it("POST /projects/:projectId/boq creates a BOQItem -> 201", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/boq`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "E1",
        description: "Excavation",
        unit: "NOS",
        qtyPlanned: "100.000",
        ratePlanned: "250.0000",
        materialId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      code: "E1",
      description: "Excavation",
      unit: "NOS",
    });
  });

  it("POST with invalid materialId -> 409 (P2003 - FK_CONFLICT)", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/boq`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "E2",
        description: "Invalid catalog link",
        unit: "NOS",
        qtyPlanned: "1",
        ratePlanned: "1",
        materialId: "bad-id",
      });
    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe("FK_CONFLICT");
  });

  it("Duplicate (projectid, code) -> 409 (P2002 -> UNIQUE_VIOLATION", async () => {
    await request(app)
      .post(`/projects/${projectId}/boq`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "DUP1",
        description: "First",
        unit: "NOS",
        qtyPlanned: "1",
        ratePlanned: "1",
      })
      .expect(201);

    const dup = await request(app)
      .post(`/projects/${projectId}/boq`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "DUP1",
        description: "Second",
        unit: "NOS",
        qtyPlanned: "1",
        ratePlanned: "1",
      });

    expect(dup.status).toBe(409);
    expect(dup.body?.error?.code).toBe("UNIQUE_VIOLATION");
  });

  // If you want to clean up created data after tests, uncomment:
  // afterAll(async () => {
  //   await prisma.bOQItem.deleteMany({ where: { projectId } });
  //   await prisma.project.delete({ where: { id: projectId } });
  // });
});
