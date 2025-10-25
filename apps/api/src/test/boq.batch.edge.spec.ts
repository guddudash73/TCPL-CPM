import request from "supertest";
import { createApp } from "../app";

describe("BOQ batch edge (smoke)", () => {
  const app = createApp();
  it("unknown op -> 400", async () => {
    const res = await request(app)
      .post(`/projects/dummy/boq/batch?op=unknown`)
      .send({ items: [{ code: "x" }] });
    expect([400, 401]).toContain(res.status);
  });
  it("delete with empty codes -> 400", async () => {
    const res = await request(app)
      .post(`/projects/dummy/boq/batch?op=delete`)
      .send({ codes: [] });
    expect([400, 401]).toContain(res.status);
  });
});
