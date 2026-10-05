import type { Metadata } from "next";
import { BooksArchive } from "@/components/life/archive/books-archive";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Books");

export default function BooksPage() {
  return <BooksArchive />;
}
