import bcrypt from "bcrypt";
import { ensureUserWithRole } from "./prisma-test";

export const seedAdminAndViewer = async () => {
  const adminPass = await bcrypt.hash("Passw0rd!", 10);
  const viewerPass = await bcrypt.hash("Passw0rd!", 10);
  const PMPass = await bcrypt.hash("Passw0rd!", 10);

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

  const pm = await ensureUserWithRole(
    "pm@tcpl.test",
    PMPass,
    "PROJECT_MANAGER",
    "PM Test"
  );

  return { admin, normal, pm };
};
