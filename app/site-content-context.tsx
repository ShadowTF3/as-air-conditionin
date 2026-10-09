"use client";

import { createContext, useContext } from "react";
import type { Lang } from "./locale";
import { defaultSiteContent, type SiteContent } from "./site-content-data";

type SiteContentContextValue = {
  content: SiteContent;
  lang: Lang;
};

const SiteContentContext = createContext<SiteContentContextValue>({
  content: defaultSiteContent,
  lang: "he",
});

export const SiteContentProvider = SiteContentContext.Provider;

export function useSiteContent() {
  return useContext(SiteContentContext);
}
