import type { Post } from "../types";

// X posts about PrimeIcons, newest first. Summaries are our own words, never the post's text
// (@w00f may quote Onur). Each account, id and date was checked against the scan in
// .superpowers/research/x-prime-posts.md and x-w00f-posts.md.
export const primeiconsPosts: Post[] = [
  {
    date: "2024-03-29",
    account: "w00f",
    id: "1773662703183118550",
    summary: "Onur on PrimeIcons 7: \"the icon update of the year is here\", a little late.",
    entryId: "7-0",
  },
  {
    date: "2024-03-29",
    account: "primefaces",
    id: "1773661861151432797",
    summary: "PrimeIcons 7.0.0 released: 50-plus new icons, at more than 2 million downloads a month.",
    entryId: "7-0",
  },
  {
    date: "2019-04-30",
    account: "w00f",
    id: "1123275841079795712",
    summary: "Onur noted PrimeIcons had passed one million downloads.",
    entryId: "1m",
  },
  {
    date: "2018-10-19",
    account: "prime_ng",
    id: "1053188095045234688",
    summary: "PrimeIcons 1.0.0 released for PrimeNG with 30-plus new icons.",
    entryId: "1-0",
  },
  {
    date: "2018-10-16",
    account: "primefaces",
    id: "1052145185948389378",
    summary: "PrimeFaces 7.0 to replace its image-based icons with PrimeIcons.",
    entryId: "1-0",
  },
  {
    date: "2018-10-16",
    account: "w00f",
    id: "1052113437382328320",
    summary: "Onur: \"PrimeIcons 1.0 is released\", with a standalone website as the next step.",
    entryId: "1-0",
  },
  {
    date: "2018-09-11",
    account: "w00f",
    id: "1039612365258547200",
    summary: "Onur announced the push to PrimeIcons 1.0, already at 150,000 downloads.",
    entryId: "150k",
  },
  {
    date: "2018-05-02",
    account: "w00f",
    id: "991654451231494144",
    summary: "Onur: three icons left before the first PrimeIcons alpha.",
    entryId: "alpha",
  },
  {
    date: "2018-02-13",
    account: "primereact",
    id: "963322417467789312",
    summary: "Early word of PrimeIcons, a free icon set meant to drop the Font Awesome dependency.",
    entryId: "start",
  },
];
