import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DrizzleEnrichmentStore, DrizzleLifeLogStore } from "@/lib/life-log/drizzle-store";
import { MemoryEnrichmentStore, MemoryLifeLogStore } from "@/lib/life-log/memory-store";
import { lifeLogStoreContract } from "../helpers/life-log-store-contract";

lifeLogStoreContract("MemoryLifeLogStore", async () => ({
  log: new MemoryLifeLogStore(),
  enrichments: new MemoryEnrichmentStore(),
}));

lifeLogStoreContract("DrizzleLifeLogStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return { log: new DrizzleLifeLogStore(db), enrichments: new DrizzleEnrichmentStore(db) };
});
