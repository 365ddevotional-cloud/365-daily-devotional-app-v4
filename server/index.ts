import { createApp, log } from "./app";

async function startServer() {
  const { httpServer } = await createApp({ enableStatic: true });
  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    async () => {
      const dbHost = process.env.PGHOST || "unknown";
      const dbHash = dbHost
        .split("")
        .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
        .toString(16);

      log(`serving on port ${port}`);
      log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
      log(`Database host hash: ${dbHash}`);
      log(`Build time: ${new Date().toISOString()}`);

      if (process.env.AUTO_SYNC_DEVOTIONALS === "true") {
        const [{ seedAllDevotionals }, { storage }, { syncProductionData }, { seedSundaySchoolLessons }] = await Promise.all([
          import("./seed-devotionals"),
          import("./storage"),
          import("./sync-production-data"),
          import("./seed-sunday-school"),
        ]);

        const before = await storage.getDevotionals();
        const beforeCount = before.length;
        log(
          `Devotional auto-sync starting (beforeCount: ${beforeCount}, NODE_ENV: ${process.env.NODE_ENV || "development"})`,
        );

        await seedAllDevotionals();
        const after = await storage.getDevotionals();
        const afterCount = after.length;
        log(
          `Devotional auto-sync complete (beforeCount: ${beforeCount}, afterCount: ${afterCount}, inserted: ${afterCount - beforeCount})`,
        );

        const result = await syncProductionData();
        log(`Data standardization complete (scanned: ${result.scanned}, updated: ${result.updated})`);
        await seedSundaySchoolLessons();
      }
    },
  );
}

startServer().catch((error) => {
  console.error("Server start failed:", error);
  process.exit(1);
});
