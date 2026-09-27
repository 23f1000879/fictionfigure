/**
 * Single source of truth for the brand entity used by metadata, JSON-LD, sitemap and llms.txt.
 * Keep every spelling people search for in ALTERNATE_NAMES so search engines and AI answer
 * engines resolve "fictionfigure", "fiction figures", etc. to the same store.
 */
export const SITE_URL = "https://www.fictionfigures.in";
export const SITE_NAME = "Fiction Figures";
export const ALTERNATE_NAMES = ["FictionFigures", "FictionFigure", "Fiction Figure", "fictionfigures.in", "Fiction Figures India"];
export const SITE_TAGLINE = "Collect · Imagine · Own";
export const SITE_DESCRIPTION =
  "Fiction Figures (fictionfigures.in) is an Indian online store for anime figures, action figures, collectible statues, keychains and mystery boxes. Pan-India delivery, Cash on Delivery and UPI.";
export const OG_IMAGE = { url: "/og-image.png", width: 1200, height: 630, alt: "Fiction Figures — anime figures and collectibles in India" };
/** Next.js replaces (does not merge) a parent's openGraph object, so every page spreads these. */
export const OPEN_GRAPH_DEFAULTS = { siteName: SITE_NAME, locale: "en_IN", type: "website" as const };
export const LOGO_URL = `${SITE_URL}/icon-512.png`;
export const INSTAGRAM_URL = "https://www.instagram.com/fictionfiguresclub/";
export const SAME_AS = [INSTAGRAM_URL];

export const SITE_KEYWORDS = [
  "Fiction Figures",
  "FictionFigures",
  "FictionFigure",
  "fiction figure",
  "fictionfigures.in",
  "anime figures India",
  "anime figures online India",
  "action figures India",
  "collectible figures India",
  "anime collectibles",
  "anime merchandise India",
  "anime keychains",
  "mystery box anime",
  "buy anime figures online",
];

export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

// Built with the constructor because the tsconfig target predates regex-literal "u" flags.
const EMOJI = new RegExp("[\\p{Extended_Pictographic}\\u{FE0F}\\u{200D}\\u{20E3}]", "gu");

/** Product names in the catalogue may carry emoji; titles and structured data should not. */
export function cleanText(input: string | null | undefined): string {
  return (input || "")
    .replace(EMOJI, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Category names are stored in capitals ("MYSTERY BOXES"); titles read better as "Mystery Boxes". */
export function titleCase(input: string | null | undefined): string {
  const text = cleanText(input);
  if (text !== text.toUpperCase()) return text;
  return text.toLowerCase().replace(/(^|[\s\-/(])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** The catalogue brand field is the store itself for own-label items ("fictionfigures"). */
export function displayBrand(brand: string | null | undefined): string {
  const b = cleanText(brand);
  if (!b || /^fiction\s*figures?$/i.test(b.replace(/[^a-z\s]/gi, ""))) return SITE_NAME;
  return b;
}

export function metaDescription(input: string | null | undefined, fallback = SITE_DESCRIPTION, max = 158): string {
  const text = cleanText((input || "").replace(/<[^>]*>/g, " ")) || fallback;
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

/** Store policies as published on /shipping, /returns and in store settings. */
export interface StoreFacts {
  shippingFee: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  supportPhone: string;
  supportEmail: string;
  supportHours: string;
}

export const DEFAULT_STORE_FACTS: StoreFacts = {
  shippingFee: 30,
  freeShippingThreshold: 499,
  codEnabled: true,
  supportPhone: "+91 8905219869",
  supportEmail: "fictionfiguresclub@gmail.com",
  supportHours: "Monday - Saturday, 10:00 AM - 7:00 PM",
};

export function storeFactsFromSettings(settings: Record<string, any> | null | undefined): StoreFacts {
  const s = settings || {};
  const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && String(v).trim() !== "" ? Number(v) : d);
  return {
    shippingFee: num(s.shipping_fee, DEFAULT_STORE_FACTS.shippingFee),
    freeShippingThreshold: num(s.free_shipping_threshold, DEFAULT_STORE_FACTS.freeShippingThreshold),
    codEnabled: s.cod_enabled === undefined ? DEFAULT_STORE_FACTS.codEnabled : String(s.cod_enabled) !== "false",
    supportPhone: s.support_phone || DEFAULT_STORE_FACTS.supportPhone,
    supportEmail: s.support_email || DEFAULT_STORE_FACTS.supportEmail,
    supportHours: s.support_hours || DEFAULT_STORE_FACTS.supportHours,
  };
}

/** Plain-language Q&A used by the visible FAQ, FAQPage JSON-LD and llms.txt. */
export function storeFaqs(f: StoreFacts): { q: string; a: string }[] {
  return [
    {
      q: "What is Fiction Figures?",
      a: "Fiction Figures (also written FictionFigures or FictionFigure) is an Indian online store at fictionfigures.in selling anime figures, action figures, collectible statues, keychains and mystery boxes for collectors across India.",
    },
    {
      q: "Is Fiction Figures the same as fictionfigures.in?",
      a: "Yes. fictionfigures.in is the official website of Fiction Figures. Our official Instagram is @fictionfiguresclub.",
    },
    {
      q: "Do you deliver across India?",
      a: "Yes. We ship from Bikaner, Rajasthan to serviceable PIN codes across India. Orders are usually dispatched within 1–3 business days, and tracking is shared once your parcel is handed to the courier.",
    },
    {
      q: "How much is shipping?",
      a: `Shipping is ₹${f.shippingFee} on orders below ₹${f.freeShippingThreshold}. Orders of ₹${f.freeShippingThreshold} or more ship free.`,
    },
    ...(f.codEnabled
      ? [{ q: "Is Cash on Delivery available?", a: "Yes. You can pay with Cash on Delivery, or pay online with any UPI app such as Google Pay, PhonePe, Paytm or BHIM." }]
      : [{ q: "How can I pay?", a: "You can pay online with any UPI app such as Google Pay, PhonePe, Paytm or BHIM." }]),
    {
      q: "What if my figure arrives damaged?",
      a: "Report it to us within 48 hours of delivery with photos (an unboxing video helps), and keep the original packaging. Damaged or incorrect items are handled as per our returns policy.",
    },
    {
      q: "How do I contact Fiction Figures?",
      a: `Call or WhatsApp ${f.supportPhone} or email ${f.supportEmail}. Support hours: ${f.supportHours}.`,
    },
  ];
}

export function faqPageSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

export function organizationSchema(f: StoreFacts) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ALTERNATE_NAMES,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
    image: absoluteUrl(OG_IMAGE.url),
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    email: f.supportEmail,
    telephone: f.supportPhone,
    sameAs: SAME_AS,
    address: { "@type": "PostalAddress", addressLocality: "Bikaner", addressRegion: "Rajasthan", addressCountry: "IN" },
    areaServed: { "@type": "Country", name: "India" },
    currenciesAccepted: "INR",
    paymentAccepted: f.codEnabled ? "Cash on Delivery, UPI" : "UPI",
    knowsAbout: ["Anime figures", "Action figures", "Collectible statues", "Anime merchandise", "Mystery boxes"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: f.supportPhone,
      email: f.supportEmail,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
      hoursAvailable: f.supportHours,
    },
    hasMerchantReturnPolicy: merchantReturnPolicy(),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ALTERNATE_NAMES,
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?query={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function merchantReturnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    // /returns: damaged or incorrect items must be reported within 48 hours of delivery.
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 2,
    returnMethod: "https://schema.org/ReturnByMail",
    merchantReturnLink: absoluteUrl("/returns"),
  };
}

export function shippingDetails(f: StoreFacts, price: number) {
  const free = price >= f.freeShippingThreshold;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: free ? 0 : f.shippingFee, currency: "INR" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      // /shipping: dispatch in 1–3 business days; transit time is not published, so it is omitted.
      handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** Serialises JSON-LD safely for a <script> tag (no "</script>" breakouts from catalogue text). */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });

/** Live store facts (shipping fee / free threshold / COD / support) from the public settings API. */
export async function getStoreFacts(): Promise<StoreFacts> {
  try {
    const { API_BASE } = await import("@/lib/api");
    const res = await fetch(`${API_BASE}/settings`, { next: { revalidate: 300 } });
    if (!res.ok) return DEFAULT_STORE_FACTS;
    const data = await res.json();
    return storeFactsFromSettings(data?.settings);
  } catch {
    return DEFAULT_STORE_FACTS;
  }
}
