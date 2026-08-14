import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";

export const metadata: Metadata = {
  title: "Privacy Policy | FictionFigure",
  description:
    "Read FictionFigure's Privacy Policy explaining how customer information, payments, third-party services, and delivery details are handled.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-12 sm:py-16 space-y-10 text-[#111111]">
        {/* Page Title */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            PRIVACY & DATA PROTECTION
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-2xl leading-relaxed">
            FictionFigure respects your privacy. This policy outlines how personal details are collected, used, and protected during your store visit and purchases.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs text-[#6B6B6B] leading-relaxed max-w-4xl">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              1. Information We Collect
            </h3>
            <p>
              When you browse our store, create an account, or place an order, we collect necessary personal details, including:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Full Name</li>
              <li>Mobile Phone Number (used for account authentication and OTP verification)</li>
              <li>Shipping & Billing Address</li>
              <li>Order History & Saved Wishlist Items</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              2. How Information Is Used
            </h3>
            <p>
              Your information is used strictly for core e-commerce functions:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Account creation, customer sign-in, and mobile OTP authentication</li>
              <li>Processing order payments and completing checkouts</li>
              <li>Packing and delivering packages across India via national courier services</li>
              <li>Providing customer support regarding your orders</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              3. Payments
            </h3>
            <p>
              FictionFigure currently offers Cash on Delivery (COD) and UPI/online payment options where available at checkout.
            </p>
            <p>
              For online payments, customers may be redirected to or interact with the applicable payment service to complete their transaction.
            </p>
            <p>
              Payment information is handled according to the payment provider's applicable security and privacy practices.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              4. Third-Party Services
            </h3>
            <p>
              We may use trusted third-party service providers to help us operate FictionFigure, process orders and payments, deliver products, provide customer support, send necessary notifications, and maintain the website.
            </p>
            <p>
              These service providers may process information only as necessary to provide their services to us and are expected to handle information in accordance with applicable privacy and security requirements.
            </p>
            <p>Examples may include:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Payment service providers</li>
              <li>Shipping and delivery partners</li>
              <li>Communication and notification providers</li>
              <li>Website and infrastructure providers</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              5. Cookies and Local Storage
            </h3>
            <p>
              FictionFigure may use cookies and browser storage technologies to support essential website functionality, maintain customer sessions, remember certain preferences, and help provide a smooth browsing experience.
            </p>
            <p>
              These technologies may be necessary for features such as authentication, cart functionality, security, and website operation.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              6. Privacy Inquiries
            </h3>
            <p>
              If you have questions regarding data privacy or wish to request profile updates, contact our support line at{" "}
              <a href="tel:+919797494639" className="font-mono font-semibold text-[#111111] hover:underline">
                +91 9797494639
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
