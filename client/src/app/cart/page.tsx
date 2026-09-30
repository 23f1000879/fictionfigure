import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";

export default function CartPage() {
  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 bg-background text-foreground">
        <div className="ff-container py-8 lg:py-12">
          <CartPageClient />
        </div>
      </main>

      <Footer showValueStrip={false} />
    </>
  );
}
