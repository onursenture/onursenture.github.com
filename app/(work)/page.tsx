import { HomeSite } from "@/components/home/home-site";
import { getHomeContent } from "@/lib/work";

export default async function HomePage() {
  return <HomeSite content={await getHomeContent()} />;
}
