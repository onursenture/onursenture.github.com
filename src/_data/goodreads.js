const cheerio = require("cheerio");

// Goodreads retired its public shelf RSS feeds on 2026-10-28: every
// /review/list_rss/ URL now returns 404 and the shelf pages ask for a sign in.
// Two signed-out pages are still public and are read instead:
//   - the profile, which shows up to three currently-reading books;
//   - Year in Books, which lists the books read in a year, oldest first, but
//     without read dates, ratings or reviews, and by short title ("Valve",
//     not "Valve: Handbook for New Employees").
// The read shelf's embeddable widget is public too, and is read for the full
// titles only; if it fails, the short ones stay.
// So "Last Read" now shows title and author only; the widget already hides
// the rating, date and review when they're empty.

const BASE_URL = "https://www.goodreads.com";
const READ_LIMIT = 5;
// Turkey has been on UTC+3 all year since 2016; Year in Books is per year in
// Onur's Goodreads time zone, while CI builds run in UTC.
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

module.exports = async function () {
  // The numeric public profile ID for goodreads.com/onur; override with
  // GOODREADS_USER_ID if it ever changes.
  const userId = process.env.GOODREADS_USER_ID || "8143905";
  const year = new Date(Date.now() + ISTANBUL_OFFSET_MS).getUTCFullYear();

  const [currentlyReading, thisYear, fullTitles] = await Promise.all([
    fetchCurrentlyReading(userId),
    fetchYearInBooks(userId, year),
    fetchFullTitles(userId),
  ]);

  // Early in a year there may be fewer than five books; top up from last year.
  let read = thisYear;
  if (read.length < READ_LIMIT) {
    read = read.concat(await fetchYearInBooks(userId, year - 1));
  }

  read = read.slice(0, READ_LIMIT).map((book) => {
    const full = fullTitles.get(bookId(book.link));
    // Only add a subtitle; never rename a book.
    return full && full.length > book.title.length && full.startsWith(book.title)
      ? { ...book, title: full }
      : book;
  });

  return { currentlyReading, read };
};

async function fetchCurrentlyReading(userId) {
  try {
    const $ = cheerio.load(await fetchText(`${BASE_URL}/user/show/${userId}`));
    return $("#currentlyReadingReviews .Updates")
      .map((_, el) => {
        const item = $(el);
        const title = item.find("a.bookTitle").first();
        return {
          title: title.text().trim(),
          author: item.find("a.authorName").first().text().trim(),
          link: absolute(title.attr("href")),
        };
      })
      .get()
      .filter((book) => book.title);
  } catch (e) {
    console.warn("[data] Failed to fetch Goodreads profile:", e.message);
    return [];
  }
}

// Newest first. A year with no books has no cover grid and comes back empty.
async function fetchYearInBooks(userId, year) {
  try {
    const $ = cheerio.load(await fetchText(`${BASE_URL}/user/year_in_books/${year}/${userId}`));
    // A sign-in or error page would otherwise read as "no books this year".
    if (!/Year in Books/i.test($("title").text())) {
      throw new Error("unexpected page title");
    }
    const books = $('.bookCovers a[href*="/book/show/"]')
      .map((_, a) => {
        const img = $(a).find("img");
        // alt is "<title> by <author>"; authors don't contain " by ", titles may.
        const alt = (img.attr("alt") || img.attr("title") || "").trim();
        const split = alt.lastIndexOf(" by ");
        return {
          title: split > 0 ? alt.slice(0, split).trim() : alt,
          author: split > 0 ? alt.slice(split + 4).trim() : "",
          link: absolute($(a).attr("href")),
        };
      })
      .get()
      .filter((book) => book.title);
    return books.reverse();
  } catch (e) {
    console.warn(`[data] Failed to fetch Goodreads Year in Books (${year}):`, e.message);
    return [];
  }
}

// Full titles by Goodreads book ID, from the read shelf's widget: a script that
// assigns its HTML to a single-quoted string.
async function fetchFullTitles(userId) {
  try {
    // Goodreads caches the widget by widget_id, so each build asks with its own.
    const params = new URLSearchParams({
      shelf: "read",
      num_books: "20",
      sort: "date_read",
      order: "d",
      widget_id: `build${Date.now()}`,
    });
    const js = await fetchText(`${BASE_URL}/review/custom_widget/${userId}.x?${params}`);
    const literal = js.match(/widget_code\s*=\s*'((?:[^'\\]|\\.)*)'/);
    if (!literal) throw new Error("no widget_code");
    const $ = cheerio.load(literal[1].replace(/\\(.)/g, (_, c) => (c === "n" ? "\n" : c)));
    const titles = new Map();
    $('img[src*="/books/"]').each((_, img) => {
      const id = ($(img).attr("src") || "").match(/\/books\/\d+[a-z]\/(\d+)[._]/);
      const title = ($(img).attr("alt") || "").trim();
      if (id && title) titles.set(id[1], title);
    });
    return titles;
  } catch (e) {
    console.warn("[data] Failed to fetch Goodreads full titles:", e.message);
    return new Map();
  }
}

function bookId(link) {
  return (link.match(/\/book\/show\/(\d+)/) || [])[1];
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function absolute(href) {
  return href ? new URL(href, BASE_URL).toString() : "";
}
