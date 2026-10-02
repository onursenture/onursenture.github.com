import { formatDate } from "@/lib/format";
import type { Book, Books } from "@/lib/sources/goodreads";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function BookList({ books }: { books: Book[] }) {
  if (books.length === 0) return <Empty />;
  return (
    <ul>
      {books.map((book) => (
        <li key={book.link}>
          <a href={book.link}>{book.title}</a> · {book.author} {book.rating}
        </li>
      ))}
    </ul>
  );
}

function Site({ data }: { data: Books }) {
  return (
    <>
      <h3>Currently reading</h3>
      <BookList books={data.currentlyReading} />
      <h3>Read</h3>
      <BookList books={data.read} />
    </>
  );
}

function Dashboard({ data, lastSuccessAt }: { data: Books; lastSuccessAt: string | null }) {
  const rows = [
    ...data.currentlyReading.map((b) => ({ ...b, shelf: "reading" })),
    ...data.read.map((b) => ({ ...b, shelf: "read" })),
  ];
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <table>
          <tbody>
            {rows.map((book) => (
              <tr key={`${book.shelf}-${book.link}`}>
                <td>{book.shelf}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.numRating || "–"}</td>
                <td>{formatDate(book.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export const books: SectionDefinition<Books> = {
  id: "books",
  title: "Books",
  visibility: "both",
  load: () => readSource("goodreads"),
  Site,
  Dashboard,
};
