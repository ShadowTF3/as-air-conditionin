import { translator, type Lang, type Translate } from "./locale";
import type { ManagedCopy } from "./site-content-data";
import { copyEntryId } from "./copy-key";

export function siteTranslator(lang: Lang, entries: ManagedCopy[]): Translate {
  const fallback = translator(lang);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return (he, ar, en) => {
    const managed = byId.get(copyEntryId(he, ar, en));
    return managed?.[lang]?.trim() || fallback(he, ar, en);
  };
}
