import type { Metadata, Viewport } from "next";
import "./globals.css";

// Fonts are system fonts on purpose: no network dependency at build or run
// time, which keeps the build and the demo working on restricted Wi-Fi.

export const metadata: Metadata = {
  title: "Mandarin Message Composer",
  description:
    "Say what you mean in natural Chinese, understand how it sounds, and learn as you go.",
};

export const viewport: Viewport = {
  themeColor: "#070a13",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
