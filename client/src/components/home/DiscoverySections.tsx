import Image from "next/image";
import Link from "next/link";
import { BookOpen, Sparkles, Gift } from "lucide-react";

export function GiftFinder() {
  return <section className="concept-gifts" aria-labelledby="gift-title">
    <h2 id="gift-title">Good gifts, without<br />the guesswork.</h2>
    <div className="concept-budget-links">{[199, 499, 999].map(price => <Link key={price} href={`/shop?maxPrice=${price}`} className={`ff-btn ff-btn-outline ${price === 499 ? "concept-budget-featured" : ""}`}>Under ₹{price}</Link>)}</div>
    <Gift className="concept-gift-icon" aria-hidden />
  </section>;
}

const articles = [
  { slug: "your-first-anime-figure", title: "Your first anime figure: a simple guide", text: "New to collecting? Find a piece you love, at a price that feels right.", icon: BookOpen },
  { slug: "style-a-small-collection", title: "How to style a small collection", text: "A few thoughtful touches can turn a shelf into your favourite corner.", icon: Sparkles },
];

export function CollectorJournal() {
  return <section className="concept-journal" aria-labelledby="journal-title"><h2 id="journal-title" className="concept-section-title">From the collector journal</h2><div className="concept-journal-grid">
    {articles.map(({slug, title, text, icon: Icon}, index) => <Link href={`/journal/${slug}`} key={slug} className="concept-journal-card">
      <div className={`concept-journal-image concept-journal-image-${index}`}><Image src="/campaign/fandom-podium.webp" alt="" fill sizes="(max-width: 640px) 40vw, 240px" className="object-cover" /><Icon aria-hidden /></div>
      <div><h3>{title}</h3><p>{text}</p><span className="concept-text-link">Read the guide</span></div>
    </Link>)}
  </div></section>;
}
