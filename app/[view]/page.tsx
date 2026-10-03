import { HomeSite } from "@/components/home/home-site";
import { assertView } from "@/lib/view/params";

export default async function HomePage({ params }: PageProps<"/[view]">) {
  const view = assertView((await params).view);
  if (view === "dashboard") {
    // Replaced by the Overview in the next task.
    return (
      <main className="p-6">
        <h1 className="type-sans-20-medium">Overview</h1>
      </main>
    );
  }
  return <HomeSite />;
}
