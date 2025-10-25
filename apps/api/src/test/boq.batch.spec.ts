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

function fakeIdLike(id: string): string {
  if (!id || id.length < 2) return id + "1";
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const last = id[id.length - 1].toLowerCase();
  const idx = alphabet.indexOf(last);
  const next = idx === -1 ? "1" : alphabet[(idx + 1) % alphabet.length];
  return id.slice(0, -1) + next;
}

jest.setTimeout(60_000);

describe("BOQ batch upsert/delete", () => {
  const app = createApp();

  let adminToken: string;
  let viewerToken: string;
  let projectId: string;
  let materialId: string | undefined;

  beforeAll(async () => {
    await seedAdminAndViewer();
    adminToken = await login("admin@tcpl.test", "Passw0rd!");
    viewerToken = await login("viewer@tcpl.test", "Passw0rd!");

    const project = await prisma.project.create({
      data: {
        code: `PRJ-${Date.now()}`,
        name: `BOQ BATCH TEST ${Date.now()}`,
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

    const viewer = await prisma.user.findFirstOrThrow({
      where: { emailLower: "viewer@tcpl.test" },
      select: { id: true, roleId: true },
    });

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: viewer.id } },
      update: {},
      create: { projectId, userId: viewer.id, roleId: viewer.roleId },
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

  it("POST /projects/:projectId/boq/batch?op=upsert (verbose=1) creates or updates items -> 200", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/boq/batch?op=upsert&verbose=1`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        items: [
          {
            code: "CEM-OPC43",
            description: "OPC 43 cement for PCC",
            unit: "NOS",
            qtyPlanned: 250,
            ratePlanned: 360,
            materialId,
          },
          {
            code: "REB-12",
            description: "12mm rebar",
            unit: "KG",
            qtyPlanned: 1200,
            ratePlanned: 40,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(typeof res.body.upserted).toBe("number");
    expect(res.body.upserted).toBe(2);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBe(2);
    expect(res.body.results[0]).toHaveProperty("code");
    expect(res.body.results[0]).toHaveProperty("action");
  });

  it("Idempotent upsert: sending partial changes updates existing rows -> 200 with action 'updated'", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/boq/batch?op=upsert&verbose=1`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        items: [
          { code: "CEM-OPC43", qtyPlanned: 300 },
          { code: "REB-12", ratePlanned: 72 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.upserted).toBe(2);
    const actions = res.body.results.map((r: any) => r.action);
    expect(actions.every((a: string) => a === "updated")).toBe(true);

    const cem = await prisma.bOQItems.findFirst({
      where: { projectId, code: "CEM-OPC43" },
      select: { qtyPlanned: true },
    });
    const reb = await prisma.bOQItems.findFirst({
      where: { projectId, code: "REB-12" },
      select: { ratePlanned: true },
    });
    expect(cem?.qtyPlanned.toNumber()).toBe(300);
    expect(reb?.ratePlanned.toNumber()).toBe(72);
  });

  it("Validation error: missing 'items' -> 400 BAD_REQUEST", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/boq/batch/?op=upsert`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ nope: [] });

    expect(res.status).toBe(400);

    const err = res.body.error;
    const code = typeof err === "string" ? err : err?.code;

    expect(code).toBe("BAD_REQUEST");
  });

  it("FK conflict: valid-looking but non-existent materialId -> 409 FK_CONFLICT", async () => {
    const nonExistentMaterialId = materialId
      ? fakeIdLike(materialId)
      : "akfakefakefakefakefakefak";

    const res = await request(app)
      .post(`/projects/${projectId}/boq/batch?op=upsert`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        items: [
          {
            code: "BAD-FK",
            unit: "NOS",
            qtyPlanned: 1,
            ratePlanned: 1,
            materialId: nonExistentMaterialId,
          },
        ],
      });

    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe("FK_CONFLICT");
  });

  it("Viewer forbidden on batch upsert -> 403", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/boq/batch?op=upsert`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        items: [
          { code: "VIEWER-TRY", unit: "NOS", qtyPlanned: 1, ratePlanned: 1 },
        ],
      });
    expect(res.status).toBe(403);
  });

  it("Batch delete removes requested codes -> 200", async () => {
    await request(app)
      .post(`/projects/${projectId}/boq/batch?op=upsert`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        items: [
          {
            code: "DEL-ME",
            unit: "NOS",
            qtyPlanned: 1,
            ratePlanned: 1,
          },
        ],
      })
      .expect(200);

    const res = await request(app)
      .post(`/projects/${projectId}/boq/batch?op=delete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ codes: ["DEL-ME"] });

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBeGreaterThanOrEqual(1);

    const check = await prisma.bOQItems.findFirst({
      where: { projectId, code: "DEL-ME" },
    });
    expect(check).toBeNull();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
