import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DTNH · Pointage Assemblée Générale",
  description: "Pointage des membres de Dream Team New Hope",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
