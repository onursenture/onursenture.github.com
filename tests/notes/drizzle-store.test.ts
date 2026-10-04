import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DrizzleNoteStore } from "@/lib/notes/drizzle-store";
import { describeNoteStore } from "../helpers/note-store-contract";

describeNoteStore("DrizzleNoteStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return new DrizzleNoteStore(db);
});
