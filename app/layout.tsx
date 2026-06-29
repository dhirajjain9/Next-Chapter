import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Next Chapter — Acquisition Pipeline",
  description: "Chapter Home acquisition pipeline: universe, suggestions, prospects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
