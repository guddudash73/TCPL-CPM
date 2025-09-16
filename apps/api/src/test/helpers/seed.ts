import bcrypt from "bcrypt";
import { ensureUserWithRole } from "./prisma-test";

export const seedAdminAndViewer = async () => {
  const adminPass = await bcrypt.hash("Passw0rd!", 10);
  const viewerPass = await bcrypt.hash("Passw0rd!", 10);

  const admin = await ensureUserWithRole(
    "admin@tcpl.test",
    adminPass,
    "ADMIN",
    "Admin Test"
  );

  const normal = await ensureUserWithRole(
    "viewer@tcpl.test",
    viewerPass,
    "VIEWER",
    "Viewer Test"
  );

  return { admin, normal };
};
