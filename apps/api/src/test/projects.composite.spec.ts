import request from "supertest";
import { createApp } from "../app";
import { getPrisma } from "./helpers/prisma-test";
import { seedAdminAndViewer } from "./helpers/seed";

const login = async (email: string, password: string) => {
  const app = createApp();
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
};

describe("Composite Projects Queries", () => {
  const prisma = getPrisma();
  const app = createApp();
  let projectId: string;
  let token: string;

  beforeAll(async () => {
    await seedAdminAndViewer();
    token = await login("admin@tcpl.test", "Passw0rd!");

    const p = await prisma.project.create({
      data: {
        code: `CPM-${Date.now()}`,
        name: `Composite Demo ${Date.now()}`,
        stage: {
          create: [
            { code: "DES", name: "Design", sortOrder: 1, status: "DONE" },
            {
              code: "PROC",
              name: "Procurement",
              sortOrder: 2,
              status: "IN_PROGRESS",
            },
            {
              code: "EXEC",
              name: "Execution",
              sortOrder: 3,
              status: "NOT_STARTED",
            },
          ],
        },
      },
      include: { stage: true },
    });
    projectId = p.id;
  });

  afterAll(async () => {
    await prisma.stage.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
  });

  it("GET /projects/composite/:id/with-stages returns ordered stages and counts", async () => {
    const res = await request(app)
      .get(`/projects/composite/${projectId}/with-stages`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const body = res.body.data;
    expect(body.stage.map((s: any) => s.sortOrder)).toEqual([1, 2, 3]);
    expect(body.stageCounts).toMatchObject({
      DONE: 1,
      IN_PROGRESS: 1,
      NOT_STARTED: 1,
    });
    expect(body.stageTotal).toBe(3);
  });

  it("GET /projects/composite/portfolio supports paging", async () => {
    const res = await request(app)
      .get(`/projects/composite/portfolio?limit=10&offset=0`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it("GET /projects/composite/search filters by stage status", async () => {
    const res = await request(app)
      .get(`/projects/composite/search?status=IN_PROGRESS`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
