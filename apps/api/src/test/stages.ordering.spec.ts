import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";

const login = async (email: string, password: string) => {
  const app = createApp();
  const res = await request(app).post("/auth/login").send({ email, password });
  return { app, token: res.body.tokens.accessToken as string };
};

describe("Stages ordering (insert/reorder/delete) within project", () => {
  let app: ReturnType<typeof createApp>;
  let token: string;
  let projectId: string;

  beforeAll(async () => {
    await seedAdminAndViewer();
    const auth = await login("admin@tcpl.test", "Passw0rd!");
    app = auth.app;
    token = auth.token;

    const code = `P-${Date.now()}`;
    const project = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ code, name: code });

    projectId = project.body.data.id;
  });

  it("appends with increasing sortOrder", async () => {
    const s1 = await request(app)
      .post(`/projects/${projectId}/stages`)
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "S1", name: "Stage 1" });

    const s2 = await request(app)
      .post(`/projects/${projectId}/stages`)
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "S2", name: "Stage 2" });

    expect(s1.body.data.sortOrder).toBe(1);
    expect(s2.body.data.sortOrder).toBe(2);
  });

  it("inserts at position 1 and shofts neighbors", async () => {
    const sx = await request(app)
      .post(`/projects/${projectId}/stages`)
      .set("Authorization", `Bearer ${token}`)
      .send({ code: `SX-${Date.now()}`, name: "Inserted", sortOrder: 1 });

    console.log(sx.body);

    expect(sx.body.data.sortOrder).toBe(1);

    const list = await request(app)
      .get(`/projects/${projectId}/stages`)
      .set("Authorization", `Bearer ${token}`);
    const order = list.body.data.map((s: any) => s.sortOrder);
    expect(order).toEqual([1, 2, 3]);
  });
});
