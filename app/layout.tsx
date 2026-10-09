import type { Metadata } from "next";
import { siteBrandMetadata } from "@/lib/site-metadata";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = siteBrandMetadata;

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
