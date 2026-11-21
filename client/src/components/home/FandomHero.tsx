import Image from "next/image";
import Link from "next/link";
import { Truck, CreditCard, LockKeyhole } from "lucide-react";

export function FandomHero() {
  return <section className="concept-hero" aria-label="Welcome to Fiction Figures">
    <div className="ff-container concept-hero-inner">
      <div className="concept-hero-copy">
        <h2>Your fandom.<br />Your shelf.</h2>
        <p>Figures, manga and little finds from<br className="hidden sm:block" /> the worlds you love.</p>
        <div className="concept-hero-actions">
          <Link href="/shop" className="ff-btn concept-pink" data-sakuga="primary">Find your next collectible</Link>
          <Link href="/shop?query=mystery" className="ff-btn ff-btn-outline">Explore mystery boxes</Link>
        </div>
      </div>
      <div className="concept-hero-art">
        <Image src="/campaign/fandom-podium.webp" alt="Anime-inspired collectible figures displayed on lavender podiums" fill priority sizes="(max-width: 767px) 100vw, 60vw" className="object-cover" />
        <span className="concept-hero-sticker">A little fiction.<br />A lot of feeling.</span>
      </div>
    </div>
    <div className="ff-container"><ul className="concept-reassurance" aria-label="Shopping with us">
      <li><Truck aria-hidden />Ships across India</li><li><CreditCard aria-hidden />UPI &amp; COD</li><li><LockKeyhole aria-hidden />Secure checkout</li>
    </ul></div>
  </section>;
}
