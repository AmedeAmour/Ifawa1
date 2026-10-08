import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IfâWa — Consultation des seize cauris",
  description: "Application de consultation traditionnelle des seize cauris.",
  icons: { icon: "/ifawa-logo.png", apple: "/ifawa-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
