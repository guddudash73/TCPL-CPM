import "dotenv/config";

import http from "http";
import { createApp } from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

async function main() {
  const app = createApp();
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[api] received ${signal}, closing...`);

    server.close(async () => {
      try {
        await prisma.$disconnect();
      } finally {
        process.exit(0);
      }
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
