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
    return [];
  }

  const parser = new Parser({
    customFields: {
      item: [
        ["book_image_url", "bookImageUrl"],
        ["author_name", "authorName"],
        ["user_rating", "userRating"],
      ],
    },
  });

  const feedUrl = `https://www.goodreads.com/review/list_rss/${userId}?shelf=read`;

  try {
    const feed = await parser.parseURL(feedUrl);

    return feed.items.slice(0, 5).map((item) => {
      // Extract book cover from description HTML if not in custom field
      let cover = item.bookImageUrl || "";
      if (!cover && (item.content || item.description)) {
        const $ = cheerio.load(item.content || item.description || "");
        cover = $("img").attr("src") || "";
      }

      const title = (item.title || "").trim();

      return {
        title: title,
        author: item.authorName || "",
        cover: cover,
        rating: item.userRating || "",
        link: item.link || "",
        date: item.pubDate || "",
      };
    });
  } catch (e) {
    console.warn(`[data] Failed to fetch Goodreads RSS:`, e.message);
    return [];
  }
};

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
