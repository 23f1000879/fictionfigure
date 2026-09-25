import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SettingsProvider } from "@/context/SettingsContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Condensed display face for collection-poster titles (reference: "ONE PIECE", "NARUTO").
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "FictionFigure - Premium Collectibles & Scale Figures",
    template: "%s | FictionFigure",
  },
  description: "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",
  keywords: ["anime figures", "collectible figures", "anime collectibles", "action figures", "anime merchandise", "figures in India", "collectibles in India"],
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
    <html lang="en" className={`${inter.variable} ${oswald.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#08090B] text-[#F7F7F5] font-sans selection:bg-[#F5C518] selection:text-[#0A0A0C]">
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <AIChatWidget />
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
