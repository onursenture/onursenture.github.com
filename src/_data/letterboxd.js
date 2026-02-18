const Parser = require("rss-parser");
const cheerio = require("cheerio");

module.exports = async function () {
  const parser = new Parser();

  try {
    const feed = await parser.parseURL("https://letterboxd.com/onur/rss/");

    return feed.items.slice(0, 6).map((item) => {
      const $ = cheerio.load(
        item.content || item["content:encoded"] || ""
      );
      const posterImg = $("img").attr("src") || "";

      // Letterboxd titles often look like: "Film Name, 2024 - ★★★★"
      const titleRaw = item.title || "";
      const ratingMatch = titleRaw.match(/\s*-\s*([\u2605\u00bd]+)\s*$/);
      const cleanTitle = titleRaw
        .replace(/\s*-\s*[\u2605\u00bd]+\s*$/, "")
        .replace(/,\s*\d{4}\s*$/, "")
        .trim();

      return {
        title: cleanTitle,
        link: item.link || "",
        poster: posterImg,
        rating: ratingMatch ? ratingMatch[1] : "",
        date: item.pubDate || "",
      };
    });
  } catch (e) {
    console.warn("[data] Failed to fetch Letterboxd RSS:", e.message);
    return [];
  }
};
