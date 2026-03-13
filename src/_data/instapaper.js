const cheerio = require("cheerio");

module.exports = async function () {
  const username = "w00f";
  const url = `https://www.instapaper.com/p/${username}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; personal-site-builder/1.0)",
      },
    });

    if (!response.ok) {
      console.warn(`[data] Instapaper returned ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const articles = [];
    $(".article_item").each((i, el) => {
      if (i >= 15) return false;

      const $el = $(el);
      const title = $el.find(".article_title").text().trim();
      const link = $el.find(".article_title").attr("href") || "";
      const domain = $el.find(".js_domain_linkout").text().trim();
      const timeAgo = $el.find("time.date").text().trim();

      if (title && link) {
        articles.push({ title, link, domain, timeAgo });
      }
    });

    console.log(`[data] Fetched ${articles.length} Instapaper articles`);
    return articles;
  } catch (e) {
    console.warn("[data] Failed to fetch Instapaper:", e.message);
    return [];
  }
};
