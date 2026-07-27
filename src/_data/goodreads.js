const Parser = require("rss-parser");
const cheerio = require("cheerio");

module.exports = async function () {
  // Goodreads RSS requires a numeric user ID. This is the public profile ID
  // for goodreads.com/onur; override with GOODREADS_USER_ID if it ever changes.
  const userId = process.env.GOODREADS_USER_ID || "8143905";

  const parser = new Parser({
    customFields: {
      item: [
        ["book_image_url", "bookImageUrl"],
        ["author_name", "authorName"],
        ["user_rating", "userRating"],
        ["user_review", "userReview"],
        ["user_shelves", "userShelves"],
        ["user_read_at", "userReadAt"],
      ],
    },
  });

  // Fetch both shelves in parallel
  const [currentlyReading, read] = await Promise.all([
    fetchShelf(parser, userId, "currently-reading", 10),
    fetchShelf(parser, userId, "read", 5),
  ]);

  return { currentlyReading, read };
};

async function fetchShelf(parser, userId, shelf, limit) {
  const feedUrl = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}`;

  try {
    const feed = await parser.parseURL(feedUrl);

    const books = feed.items.map((item) => {
      // Extract review text and book cover from description HTML
      let review = "";
      let cover = item.bookImageUrl || "";
      if (item.content || item.description) {
        const $ = cheerio.load(item.content || item.description || "");

        if (item.userReview) {
          // If rss-parser captured the user_review field directly
          const $review = cheerio.load(item.userReview);
          review = $review.text().trim();
        }

        if (!review) {
          // Try extracting from the content/description HTML
          // Goodreads RSS description contains: image, book info, then review
          const allText = $("body").text().trim();
          // Look for text after common separators
          const parts = allText.split(/\n\n+/);
          if (parts.length > 1) {
            const lastPart = parts[parts.length - 1].trim();
            // Only use if it looks like a review (more than a few words)
            if (lastPart.length > 20) {
              review = lastPart;
            }
          }
        }

        if (!cover) {
          cover = $("img").attr("src") || "";
        }
      }

      // Upgrade cover image quality — replace small thumbnails with larger versions
      if (cover) {
        // Goodreads uses _SY75_, _SX50_, etc. for tiny thumbnails
        // Replace with _SY475_ for decent quality
        cover = cover
          .replace(/\._S[XY]\d+_/, "._SY475_")
          .replace(/\/s\/[^/]+\//, "/l/");
      }

      const title = (item.title || "").trim();

      // Convert numeric rating to stars
      const numRating = parseInt(item.userRating, 10);
      let stars = "";
      if (numRating > 0) {
        stars = "★".repeat(numRating);
      }

      return {
        title: title,
        author: item.authorName || "",
        cover: cover,
        rating: stars,
        numRating: numRating || 0,
        review: review,
        link: item.link || "",
        // Prefer the date the book was actually finished (user_read_at); fall
        // back to pubDate (shelf-add date) when the read date is missing.
        date: item.userReadAt || item.pubDate || "",
      };
    });

    // The feed is ordered by shelf-add date, but we display (and want to rank
    // by) the read date, so sort before trimming — otherwise a book added long
    // after it was finished jumps to the top with an older date than the ones
    // below it, and one finished recently but added earlier never makes the cut.
    books.sort((a, b) => dateValue(b.date) - dateValue(a.date));

    return books.slice(0, limit);
  } catch (e) {
    console.warn(`[data] Failed to fetch Goodreads RSS (${shelf}):`, e.message);
    return [];
  }
}

// Sortable timestamp; entries without a usable date sink to the bottom.
function dateValue(dateStr) {
  const time = dateStr ? new Date(dateStr).getTime() : NaN;
  return Number.isNaN(time) ? -Infinity : time;
}

