import Site from "../site";
import { readSiteContent } from "@/lib/site-content-store";
import { pageMetadata } from "@/lib/site-metadata";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await readSiteContent(), "about");
}

export default function Page() {
  return <Site page="about" />;
}
