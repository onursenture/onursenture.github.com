module.exports = async function () {
  const username = "w00f";
  // The public profile page (instapaper.com/p/<user>) is a React SPA served as
  // an empty shell, so there is no server-rendered HTML to scrape. This is the
  // JSON endpoint that SPA calls for the same list; it works unauthenticated.
  const url = `https://www.instapaper.com/data/profile/${username}?page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; personal-site-builder/1.0)",
      },
    });

    if (!response.ok) {
      console.warn(`[data] Instapaper returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];

    // Kept in the order the API returns, which is the order the profile page
    // itself renders — `time` is the save timestamp and isn't strictly
    // descending (bulk-saved items share one).
    const articles = bookmarks
      .filter((b) => b.title && b.url)
      .slice(0, 15)
      .map((b) => ({
        title: b.title.trim(),
        link: b.url,
        domain: b.site_name || hostname(b.url),
        date: b.time ? new Date(b.time * 1000).toISOString() : "",
      }));

    console.log(`[data] Fetched ${articles.length} Instapaper articles`);
    return articles;
  } catch (e) {
    console.warn("[data] Failed to fetch Instapaper:", e.message);
    return [];
  }
};

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
