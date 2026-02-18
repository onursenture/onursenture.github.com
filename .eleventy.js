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
