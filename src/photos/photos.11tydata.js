const fs = require("fs");
const path = require("path");
const sizeLib = require("image-size");
const sizeOf = sizeLib.imageSize || sizeLib; // works across image-size v1/v2

module.exports = {
  layout: "photo.njk",
  tags: "photos",
  permalink: "/photos/{{ page.fileSlug }}/", // string permalinks still run through the engine

  eleventyComputed: {
    // Absolute URL to the JPEG (crawlers don't reliably render AVIF);
    // `image` is a bare filename like "foo.jpeg".
    socialImage: (data) => `${data.site.url}/images/photos/${data.image}`,

    // Read real pixel dimensions at build time so previews render instantly
    // and crop predictably. Fail soft (warn + null) like the other data fetchers.
    socialImageDimensions: (data) => {
      try {
        const buf = fs.readFileSync(path.resolve("images/photos", data.image));
        const { width, height } = sizeOf(buf); // buffer form is portable across versions
        return { width, height };
      } catch (e) {
        console.warn(`photos: could not read dimensions for ${data.image}: ${e.message}`);
        return null;
      }
    },
  },
};
