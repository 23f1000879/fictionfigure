import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AIChatWidget } from "@/components/ai/AIChatWidget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "FictionFigure — Premium Collectibles & Scale Figures",
    template: "%s | FictionFigure",
  },
  description: "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",
  keywords: ["anime figures", "collectible statues", "designer toys", "character figures", "limited edition collectibles"],
  icons: {
    icon: "/fictionfigure-icon.svg",
    shortcut: "/fictionfigure-icon.svg",
    apple: "/fictionfigure-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F7F5] text-[#111111] font-sans selection:bg-[#111111] selection:text-white">
        {children}
        <AIChatWidget />
      </body>
    </html>
  );
}
