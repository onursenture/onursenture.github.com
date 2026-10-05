import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DrizzlePhotoStore } from "@/lib/photos/drizzle-store";
import { describePhotoStore } from "../helpers/photo-store-contract";

describePhotoStore("DrizzlePhotoStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return new DrizzlePhotoStore(db);
});
