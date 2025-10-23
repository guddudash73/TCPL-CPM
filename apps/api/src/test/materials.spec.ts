import request from "supertest";
import { createApp } from "../app";
import { seedAdminAndViewer } from "./helpers/seed";

const app = createApp();

const login = async (email: string, password: string) => {
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
};

jest.setTimeout(60_000);

describe("Materials catalog", () => {
  let token: string;

  beforeAll(async () => {
    await seedAdminAndViewer();
    token = await login("admin@tcpl.test", "Passw0rd!");
  });

  it("GET /materials returns list and supports q & take", async () => {
    const res = await request(app)
      .get("/materials?q=cement&take=10")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("POST /materials creates material", async () => {
    const res = await request(app)
      .post("/materials")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sku: `id-item-${Date.now()}`,
        name: `item-name-${Date.now()}`,
        unit: "NOS",
      })
      .expect(200);
  });

  it("GET /meterial without auth -> 401", async () => {
    await request(app).get("/materials?q=cement&take=10").expect(401);
  });
});
