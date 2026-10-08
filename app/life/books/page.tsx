import type { Metadata } from "next";
import { BooksArchive } from "@/components/life/archive/books-archive";
import { DESCRIPTIONS } from "@/content/descriptions";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Books", DESCRIPTIONS.books);

export default function BooksPage() {
  return <BooksArchive />;
}
