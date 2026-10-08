import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IfâWa — Consultation des seize cauris",
  description: "Application de consultation traditionnelle des seize cauris.",
  icons: { icon: "/ifawa-app-icon.png", apple: "/ifawa-app-icon.png" },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
