import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Lock, ShieldCheck, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | FictionFigure",
  description:
    "Read FictionFigure's Privacy Policy explaining how customer information, mobile OTP verification, and delivery details are handled securely.",
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
              <li>Processing order payments (via integrated payment providers such as Razorpay or UPI)</li>
              <li>Packing and delivering packages across India via national courier services</li>
              <li>Providing customer support regarding your orders</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              3. Payment Credentials & Gateway Security
            </h3>
            <p>
              FictionFigure does not store sensitive payment credentials (such as card numbers or banking passwords) on our servers. Online payments are processed through secure payment gateway services (e.g., Razorpay) operating over encrypted connections.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              4. Third-Party Service Integration
            </h3>
            <p>
              We utilize trusted infrastructure providers to run our store services effectively:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>MSG91</strong>: Used for SMS delivery and mobile One-Time Password (OTP) verification.</li>
              <li><strong>Cloudinary</strong>: Used for media storage and figure image delivery.</li>
              <li><strong>Database & Hosting Services</strong>: Secure cloud servers used for database storage and website hosting.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              5. Local Storage
            </h3>
            <p>
              Our website uses browser local storage (`fictionfigure_token`) to maintain your authenticated customer session so you do not need to log in repeatedly during active browsing.
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
