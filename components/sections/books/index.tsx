import { Cover } from "@/components/ui/cover";
import { MetaLabel } from "@/components/ui/meta-label";
import { profile } from "@/content/profile";
import type { Book, Books } from "@/lib/sources/goodreads";
import { readSource } from "@/lib/sources/read";
import { formatRating } from "@/lib/sources/rating";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

function Reading({ books }: { books: Book[] }) {
  if (books.length === 0) return <Empty />;
  return (
    <ul className="grid grid-cols-3 gap-x-4 gap-y-8 md:grid-cols-6 md:gap-x-6">
      {books.map((book) => (
        <li key={book.link}>
          <a href={book.link} rel="noopener noreferrer" className="group flex flex-col gap-2">
            <Cover src={book.cover} alt="" />
            <span className="type-body group-hover:underline group-hover:underline-offset-[0.2em]">
              {book.title}
            </span>
            <span className="type-meta text-fg-muted">{book.author}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Read({ books }: { books: Book[] }) {
  if (books.length === 0) return <Empty />;
  return (
    <ul className="border-t">
      {books.map((book) => (
        <li key={book.link} className="grid grid-cols-12 items-baseline gap-x-6 border-b py-3">
          <ItemLink href={book.link} className="col-span-12 type-body md:col-span-6">
            {book.title}
          </ItemLink>
          <span className="col-span-8 type-meta text-fg-muted md:col-span-4">{book.author}</span>
          <span className="col-span-4 text-right type-meta md:col-span-2">{formatRating(book.numRating)}</span>
        </li>
      ))}
    </ul>
  );
}

// Covers for the reading shelf, then the read list with ratings.
function Render({ data }: { data: Books }) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <MetaLabel as="h3">Reading</MetaLabel>
        <Reading books={data.currentlyReading} />
      </div>
      <div className="flex flex-col gap-4">
        <MetaLabel as="h3">Read</MetaLabel>
        <Read books={data.read} />
      </div>
    </div>
  );
}


export const books: SectionDefinition<Books> = {
  id: "books",
  title: "Books",
  load: () => readSource("goodreads"),
  Render,
  source: "Goodreads",
  href: `https://www.goodreads.com/${profile.social.goodreads}`,
};
