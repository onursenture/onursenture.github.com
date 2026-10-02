import Link from "next/link";

// Placeholder until the two-tier home page lands in S3.
export default function HomePage() {
  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold">Onur Senture</h1>
      <p>
        Site v2 skeleton. See <Link href="/life/">Life</Link> and <Link href="/photos/">Photos</Link>.
      </p>
    </main>
  );
}
