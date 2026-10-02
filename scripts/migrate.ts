// Applies Drizzle migrations from ./drizzle to DATABASE_URL.
//
// Runs automatically before `next build`, but only for Vercel production
// builds, so preview builds never migrate the shared database. Run it by
// hand with `npm run db:migrate` (needs DATABASE_URL in the environment).
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  const forced = process.argv.includes("--force");
  const production = process.env.VERCEL_ENV === "production";

  if (!url || !(forced || production)) {
    console.log("[migrate] skipped (needs DATABASE_URL and a production build or --force)");
    return;
  }
  await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
  console.log("[migrate] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
