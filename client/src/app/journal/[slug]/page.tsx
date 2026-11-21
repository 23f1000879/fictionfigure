import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";

const guides = {
  "your-first-anime-figure": {
    title: "Your first anime figure: a simple guide",
    intro: "You don’t need a huge shelf or a huge budget to start collecting. Start with a character you love and a piece that makes you smile.",
    sections: [
      ["Start with your favourite world", "Think about the series, character or scene that means something to you. A collection feels more personal when it follows your interests rather than whatever happens to be popular."],
      ["Set a comfortable budget", "Compare the product price with the full delivered cost before you buy. Check the shipping threshold, payment options and any fees at checkout. Smaller desk figures and keychains can be an easy way to begin."],
      ["Look closely at the listing", "Check the photos, dimensions, material, variant and manufacturer information when provided. For a mystery item, read what is guaranteed and what is random. Don’t assume that a character shown in an example image is the one you will receive."],
      ["Choose a spot before it arrives", "Measure your shelf or desk, leave space around the figure and keep it away from direct sunlight and heat. Follow the maker’s care guidance, and keep the packaging if you might move or store the piece later."],
    ],
  },
  "style-a-small-collection": {
    title: "How to style a small collection",
    intro: "A small collection can make a big impression. Give each piece a little room and let your favourite characters do the talking.",
    sections: [
      ["Build around one favourite", "Choose a centrepiece and arrange a few smaller items around it. A figure, a manga volume and a simple backdrop can be enough to create a little corner of your favourite world."],
      ["Use different heights", "A stable display riser can make a back row easier to see. Check its weight capacity and make sure figures sit securely on a level surface. Keep fragile pieces away from shelf edges."],
      ["Leave breathing room", "You don’t have to fill every gap. A little empty space makes shapes and details easier to appreciate. Group by series, colour or size, then step back and see what feels balanced."],
      ["Keep your display easy to care for", "Avoid direct sun, damp areas and heat sources. Dust gently with a clean soft brush, following the manufacturer’s instructions. Rotate pieces when you want a fresh look rather than crowding more into the same space."],
    ],
  },
};
type GuideSlug = keyof typeof guides;
export function generateStaticParams() { return Object.keys(guides).map(slug => ({ slug })); }
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = guides[params.slug as GuideSlug];
  return guide ? { title: guide.title, description: guide.intro, alternates: { canonical: `/journal/${params.slug}` } } : {};
}
export default function JournalPage({ params }: { params: { slug: string } }) {
  const guide = guides[params.slug as GuideSlug];
  if (!guide) notFound();
  return <><Header /><SearchModal /><CartDrawer /><main className="ff-container flex-1"><article className="concept-article">
    <nav className="concept-shop-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / Collector journal</nav>
    <span className="ff-eyebrow">The collector journal</span><h1>{guide.title}</h1><p>{guide.intro}</p>
    <div className="relative aspect-[2/1] rounded-2xl overflow-hidden my-8"><Image src="/campaign/fandom-podium.webp" alt="Anime-inspired figurines arranged at different heights" fill sizes="(max-width: 800px) 100vw, 800px" className="object-cover" /></div>
    {guide.sections.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}
    <Link href="/shop" className="ff-btn ff-btn-gold">Find your next collectible</Link>
  </article></main><Footer showValueStrip={false} /></>;
}
