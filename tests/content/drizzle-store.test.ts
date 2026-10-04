import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DrizzleContentStore } from "@/lib/content/drizzle-store";
import { describeContentStore } from "../helpers/content-store-contract";

describeContentStore("DrizzleContentStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return new DrizzleContentStore(db);
});
