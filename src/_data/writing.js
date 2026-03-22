const Parser = require("rss-parser");

module.exports = async function () {
  const parser = new Parser();

  try {
    const feed = await parser.parseURL("https://w00f.org/feed/");

    const posts = feed.items.slice(0, 10).map((item) => ({
      title: item.title || "",
      link: item.link || item.id || "",
      date: item.isoDate || item.pubDate || "",
    }));

    console.log(`[data] Fetched ${posts.length} writing posts`);
    return posts;
  } catch (e) {
    console.warn("[data] Failed to fetch writing posts:", e.message);
    return [];
  }
};
