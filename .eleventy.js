const { execSync } = require("child_process");

module.exports = function (eleventyConfig) {
  // Pass-through copies (paths relative to project root for files outside src/)
  eleventyConfig.addPassthroughCopy({ "images": "images" });
  eleventyConfig.addPassthroughCopy({ "beatografi": "beatografi" });
  eleventyConfig.addPassthroughCopy({ "CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "keybase.txt": "keybase.txt" });

  // Build SCSS before Eleventy builds
  eleventyConfig.on("eleventy.before", async () => {
    execSync(
      "npx sass src/css/main.scss:_site/css/main.css --style=compressed --load-path=src/css",
      { stdio: "inherit" }
    );
  });

  // Nunjucks date filter (replaces Jekyll's date filters)
  eleventyConfig.addFilter("dateDisplay", function (dateObj, format) {
    const d = new Date(dateObj);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    if (format === "rfc822") {
      return d.toUTCString();
    }
    if (format === "iso") {
      return d.toISOString();
    }
    // Default: "Mon D, YYYY"
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  });

  // Relative time filter ("2 days ago", "3 weeks ago", etc.)
  eleventyConfig.addFilter("timeAgo", function (dateStr) {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 0) return "just now";

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "week", seconds: 604800 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
      }
    }
    return "just now";
  });

  // Truncate text to a max length with ellipsis
  eleventyConfig.addFilter("truncate", function (str, len) {
    if (!str) return "";
    if (str.length <= len) return str;
    return str.substring(0, len).trimEnd() + "…";
  });

  eleventyConfig.addFilter("xmlEscape", function (str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  });

  // Collections: blog posts
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/**/*.md").reverse();
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
