import { HomeDashboard } from "@/components/home/home-dashboard";
import { HomeSite } from "@/components/home/home-site";
import { assertView } from "@/lib/view/params";

export default async function HomePage({ params }: PageProps<"/[view]">) {
  const view = assertView((await params).view);
  return view === "dashboard" ? <HomeDashboard /> : <HomeSite />;
}
