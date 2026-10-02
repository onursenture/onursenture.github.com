import type { Metadata } from "next";
import Link from "next/link";
import { Picture } from "@/components/picture";
import { getPhotos } from "@/lib/content/photos";

export const metadata: Metadata = { title: "Photos" };

export default async function PhotosPage() {
  const photos = await getPhotos();
  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold">Photos</h1>
      <ul className="grid grid-cols-2 gap-4 dashboard:grid-cols-4">
        {photos.map((photo) => (
          <li key={photo.slug}>
            <Link href={`/photos/${photo.slug}/`}>
              <Picture image={photo.image} alt={photo.title} sizes="(min-width: 768px) 50vw, 100vw" />
              {photo.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
