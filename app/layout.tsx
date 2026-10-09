import type { Metadata } from "next";
import { readSiteContent } from "@/lib/site-content-store";
import { rootMetadata } from "@/lib/site-metadata";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return rootMetadata(await readSiteContent());
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
