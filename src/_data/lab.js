// Side projects and experiments.
//
// Unlike the other files here, this is not an external fetcher — the list is
// maintained inline. It used to come from lab.onursenture.com's JSON API, but
// the projects themselves are hosted elsewhere, so that indirection bought
// nothing. Add an entry below and push; the next build picks it up.
//
// url is optional — entries without one render as plain text.
const projects = [
  // {
  //   name: "Example",
  //   description: "One line about what it is.",
  //   date: "2026-03-21",
  //   url: "https://example.com",
  // },
  {
    name: "Stories for Ekşi Sözlük",
    description: "Chrome extension: flip through the images in an ekşi sözlük thread like stories.",
    date: "2026-10-12",
    url: "https://chromewebstore.google.com/detail/stories-for-ek%C5%9Fi-s%C3%B6zl%C3%BCk/kbbmjkgkpflmemfppocpgnpdebfjlfdn",
  },
];

module.exports = function () {
  return [...projects].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};
