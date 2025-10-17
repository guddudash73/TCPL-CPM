import request from "supertest";
import { createApp } from "../app";
import { getPrisma } from "./helpers/prisma-test";
import { seedAdminAndViewer } from "./helpers/seed";

const prisma = getPrisma();
const app = createApp();

jest.setTimeout(60_000);

async function login(email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  if (res.status !== 200 || !res.body?.tokens?.accessToken) {
    throw new Error(`Login faild for ${email}: ${res.status} ${res.text}`);
  }
  return res.body.tokens.accessToken as string;
}

describe("requireAccess middleware (projects)", () => {
  let projectId: string;
  let adminToken: string;
  let pmToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    await seedAdminAndViewer();

    // const admin = await prisma.user.findUniqueOrThrow({
    //   where: { emailLower: "admin@tcpl.test" },
    //   select: { id: true },
    // });

    const pm = await prisma.user.findUniqueOrThrow({
      where: { emailLower: "pm@tcpl.test" },
      select: { id: true },
    });

    // await prisma.user.findUniqueOrThrow({
    //   where: { emailLower: "viewer@tcpl.test" },
    //   select: { id: true },
    // });

    const project = await prisma.project.create({
      data: {
        code: `PRJ-${Date.now()}`,
        name: `Secure Probe ${Date.now()}`,
      },
    });
    projectId = project.id;

    const pmRole = await prisma.role.findUniqueOrThrow({
      where: { name: "PROJECT_MANAGER" },
      select: { id: true },
    });
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: pm.id,
        roleId: pmRole.id,
      },
    });

    adminToken = await login("admin@tcpl.test", "Passw0rd!");
    pmToken = await login("pm@tcpl.test", "Passw0rd!");
    viewerToken = await login("viewer@tcpl.test", "Passw0rd!");
  });

  afterAll(async () => {
    await prisma.projectMember.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
  });

  const table = [
    {
      lable: "Admin",
      token: () => Promise.resolve(adminToken),
      expected: 200,
    },
    {
      label: "PROJECT_MANAGER (member)",
      token: () => Promise.resolve(pmToken),
      expected: 200,
    },
    {
      label: "VIEWER (not a member)",
      token: () => Promise.resolve(viewerToken),
      expected: 403,
    },
  ] as const;

  it.each(table)("role gates: %s", async ({ token, expected }) => {
    const t = await token();
    expect(t && t.length > 10).toBe(true);
    expect(projectId).toBeTruthy();

    const res = await request(app)
      .get(`/projects/${projectId}/secure-probe`)
      .set("Authorization", `Bearer ${t}`);

    if (res.status !== expected) {
      console.log("secure-probe unexpected", res.status, res.text);
    }
    expect(res.status).toBe(expected);
  });

  it("401 when missing token", async () => {
    const res = await request(app).get(`/projects/${projectId}/secure-probe`);
    expect(res.status).toBe(401);
  });
});
