const Parser = require("rss-parser");
const cheerio = require("cheerio");

module.exports = async function () {
  // Goodreads RSS requires a numeric user ID.
  // Set GOODREADS_USER_ID env var, or it will try to discover it from the profile page.
  let userId = process.env.GOODREADS_USER_ID;

  if (!userId) {
    // Try to discover the numeric user ID from the profile page
    userId = await discoverUserId("onur");
  }

  if (!userId) {
    console.warn("[data] No Goodreads user ID found, skipping");
    return { currentlyReading: [], read: [] };
  }

  const parser = new Parser({
    customFields: {
      item: [
        ["book_image_url", "bookImageUrl"],
        ["author_name", "authorName"],
        ["user_rating", "userRating"],
        ["user_review", "userReview"],
        ["user_shelves", "userShelves"],
      ],
    },
  });

  // Fetch both shelves in parallel
  const [currentlyReading, read] = await Promise.all([
    fetchShelf(parser, userId, "currently-reading", 5),
    fetchShelf(parser, userId, "read", 5),
  ]);

  return { currentlyReading, read };
};

async function fetchShelf(parser, userId, shelf, limit) {
  const feedUrl = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}`;

  try {
    const feed = await parser.parseURL(feedUrl);

    return feed.items.slice(0, limit).map((item) => {
      // Extract review text and book cover from description HTML
      let review = "";
      let cover = item.bookImageUrl || "";
      if (item.content || item.description) {
        const $ = cheerio.load(item.content || item.description || "");

        // Extract review from the description HTML
        // Goodreads RSS puts the review inside the description after the book info
        const reviewBr = $("br");
        const fullText = $.text();

        // Try to find review text - Goodreads puts it after book metadata
        const reviewMatch = fullText.match(
          /(?:review|:\s*)([^]*?)$/i
        );

        // Better approach: look for text nodes after the last <br>
        const descHtml = item.content || item.description || "";
        const reviewHtmlMatch = descHtml.match(
          /book_description.*?<br\/?>.*?<br\/?>([^]*?)$/i
        );

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
        date: item.pubDate || "",
      };
    });
  } catch (e) {
    console.warn(`[data] Failed to fetch Goodreads RSS (${shelf}):`, e.message);
    return [];
  }
}

async function discoverUserId(username) {
  try {
    const response = await fetch(`https://www.goodreads.com/${username}`, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; personal-site-builder/1.0)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    // Look for the user ID in the page source
    const match = html.match(/\/user\/show\/(\d+)/);
    if (match) {
      console.log(`[data] Discovered Goodreads user ID: ${match[1]}`);
      return match[1];
    }
    return null;
  } catch (e) {
    console.warn("[data] Failed to discover Goodreads user ID:", e.message);
    return null;
  }
}
