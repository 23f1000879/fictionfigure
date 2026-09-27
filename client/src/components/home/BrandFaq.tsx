import React from "react";
import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";

interface BrandFaqProps {
  faqs: { q: string; a: string }[];
}

/**
 * Visible brand intro + FAQ. The same Q&A is emitted as FAQPage JSON-LD on the homepage, so
 * search engines and AI answer engines get direct, quotable answers about the store.
 * Uses <details> so every answer is in the server-rendered HTML.
 */
export function BrandFaq({ faqs }: BrandFaqProps) {
  return (
    <section aria-labelledby="brand-faq" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 border-t border-white/[0.08] pt-12 lg:pt-16">
      <div className="lg:col-span-5 space-y-4">
        <div id="brand-faq">
          <SectionHeading eyebrow="Fiction Figures" title="Questions collectors ask" />
        </div>
        <p className="text-[14px] leading-relaxed text-[#9A9DA5] max-w-[460px]">
          Fiction Figures is an Indian online store for anime figures, action figures, collectible statues, keychains and
          mystery boxes. Every order ships from Bikaner, Rajasthan to collectors across India.
        </p>
      </div>

      <div className="lg:col-span-7 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex items-center justify-between gap-4 min-h-[56px] py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <h3 className="text-[14px] sm:text-[15px] font-semibold text-[#F7F7F5]">{q}</h3>
              <Plus className="w-4 h-4 shrink-0 text-[#F5C518] transition-transform group-open:rotate-45" aria-hidden />
            </summary>
            <p className="pb-4 pr-8 text-[13px] sm:text-[14px] leading-relaxed text-[#9A9DA5]">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
