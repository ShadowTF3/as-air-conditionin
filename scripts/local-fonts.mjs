import { mkdirSync, writeFileSync } from "node:fs";
const url =
  "https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&family=Noto+Sans+Arabic:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap";
const response = await fetch(url, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
});
if (!response.ok) throw new Error("Font CSS unavailable");
let css = await response.text();
const urls = [
  ...new Set([...css.matchAll(/url\((https[^)]+)\)/g)].map((m) => m[1])),
];
mkdirSync("public/fonts", { recursive: true });
let bytes = 0;
for (let i = 0; i < urls.length; i++) {
  const r = await fetch(urls[i]);
  if (!r.ok) throw new Error("Font asset unavailable");
  const b = Buffer.from(await r.arrayBuffer());
  const filename = `font-${i}.woff2`;
  writeFileSync("public/fonts/" + filename, b, { flush: true });
  css = css.replaceAll(urls[i], "/fonts/" + filename);
  bytes += b.length;
}
writeFileSync("public/fonts/fonts.css", css, { flush: true });
console.log(JSON.stringify({ files: urls.length, bytes }));
