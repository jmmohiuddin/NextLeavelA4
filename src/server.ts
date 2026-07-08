import "dotenv/config";
import app from "./app";
import { config } from "./config/config";
import prisma from "./config/prisma";

const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully.");

    const server = app.listen(PORT, () => {
      console.log("\n══════════════════════════════════════════════════");
      console.log("  🏋️  GearUp Backend API");
      console.log("══════════════════════════════════════════════════");
      console.log(`  Environment : ${config.nodeEnv}`);
      console.log(`  Server      : http://localhost:${PORT}`);
      console.log(`  Health      : http://localhost:${PORT}/health`);
      console.log("══════════════════════════════════════════════════\n");
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🔄 ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("✅ Database disconnected. Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
