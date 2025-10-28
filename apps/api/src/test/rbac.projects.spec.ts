import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";

async function login(email: string, password: string) {
  const app = createApp();
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body?.tokens?.accessToken as string;
}

function getProjectId(body: any): string | undefined {
  return body?.id ?? body?.data.id ?? body?.projectId?.id ?? body?.result.id;
}
describe("RBAC + Project-scoped routes (stages)", () => {
  const app = createApp();
  let adminToken: string;
  let viewerToken: string;
  let projectId: string;

  beforeAll(async () => {
    await seedAdminAndViewer();

    adminToken = await login("admin@tcpl.test", "Passw0rd!");
    viewerToken = await login("viewer@tcpl.test", "Passw0rd!");

    const createRes = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: `PRJ-${Date.now()}`,
        name: `RBAC Test Project ${Date.now()}`,
      });

    expect([200, 201]).toContain(createRes.status);
    projectId = getProjectId(createRes.body)!;
    expect(projectId).toBeTruthy();
  });

  it("denies VIEWER from creating a stage under a project (403)", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/stages`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ name: "Stage - Viewer should be blocked" });

    expect(res.status).toBe(403);
  });

  it("allows ADMIN (elevated) to create a stage under a project (200/201)", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/stages`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Stage - Admin allowed" });

    expect([200, 201]).toContain(res.status);
  });

  it("Returns 401 when no token provided on creating a stage", async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/stages`)
      .send({ name: "Stage - missing auth" });

    expect(res.status).toBe(401);
  });
});
