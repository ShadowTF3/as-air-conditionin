import sharp from "sharp";
import { writeFileSync } from "node:fs";
writeFileSync(
  "public/images/hero.webp",
  await sharp("assets/source/hero.png")
    .resize(1400)
    .webp({ quality: 84 })
    .toBuffer(),
  { flush: true },
);
writeFileSync(
  "public/images/tadiran.webp",
  await sharp("assets/source/tadiran.png").webp({ quality: 90 }).toBuffer(),
  { flush: true },
);
writeFileSync(
  "public/images/electra.webp",
  await sharp("assets/source/electra.jpg")
    .resize({ width: 710, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer(),
  { flush: true },
);
writeFileSync(
  "public/favicon.svg",
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#12344b"/><g stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M16 7v18M8 11l16 10M8 21l16-10M12 9l4 4 4-4M12 23l4-4 4 4"/></g><circle cx="25" cy="7" r="3" fill="#e66e27"/></svg>',
  { flush: true },
);
console.log("Optimized website images and favicon ready");
