import * as fs from "node:fs";
import * as path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const databaseDir = path.join(process.cwd(), ".pgdata");
const dbName = "vintagemeew_db";

async function main() {
  console.log("🐘 Starting Embedded PostgreSQL for vintagemeew...");

  const pg = new EmbeddedPostgres({
    databaseDir,
    port: 5432,
    user: "postgres",
    password: "password",
    persistent: true,
    initdbFlags: ["-E", "UTF8", "--locale=C"],
  });

  const isInitialized = fs.existsSync(path.join(databaseDir, "PG_VERSION"));
  if (!isInitialized) {
    console.log("📦 Initialising PostgreSQL cluster in .pgdata...");
    await pg.initialise();
  }

  console.log("🚀 Starting PostgreSQL on port 5432...");
  await pg.start();
  console.log("✅ PostgreSQL is running on port 5432!");

  try {
    await pg.createDatabase(dbName);
    console.log(`✅ Database "${dbName}" created.`);
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "";
    if (!msg.toLowerCase().includes("already exists")) {
      console.log(`ℹ️ Database status: ${msg}`);
    } else {
      console.log(`✅ Database "${dbName}" is ready.`);
    }
  }

  console.log("\n📡 Connection string:");
  console.log(`DATABASE_URL="postgresql://postgres:password@localhost:5432/${dbName}"\n`);
  console.log("✨ Embedded database is running. Press Ctrl+C to stop.");

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Stopping PostgreSQL...");
    try {
      await pg.stop();
      console.log("✅ PostgreSQL stopped.");
    } catch {
      // ignore
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Keep process alive
  await new Promise<void>(() => {});
}

main().catch((err) => {
  console.error("❌ Failed to start embedded postgres:", err);
  process.exit(1);
});
