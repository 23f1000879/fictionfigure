export interface HomepageSectionConfig {
  id: string; // "hero" | "categories" | "new_arrivals" | "featured_collection" | "more_to_collect" | "promo_banner" | "trust_strip"
  name: string;
  enabled: boolean;
  sortOrder: number;
}

export interface ShopByCategoryConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  selectedCategoryIds: string[]; // empty array = automatic (show all categories)
  imageOverrides: Record<string, string>; // categoryId -> custom image URL
  ctaText: string;
  ctaUrl: string;
}

export interface ProductSelectionConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  mode: "automatic" | "manual"; // automatic = newest/popular API, manual = selectedProductIds
  limit: number;
  selectedProductIds: string[];
  ctaText: string;
  ctaUrl: string;
}

export interface FeaturedCollectionConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaDestinationType: "category" | "product" | "url";
  ctaDestinationValue: string;
}

export interface PromoBannerConfig {
  enabled: boolean;
  eyebrow: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaDestinationType: "category" | "product" | "url";
  ctaDestinationValue: string;
  bgImageUrl: string;
  mobileImageUrl: string;
  overlayStrength: number; // 0 to 100
  textAlign: "left" | "center" | "right";
}

export interface TrustBenefitItem {
  id: string;
  icon: string; // Lucide icon name
  title: string;
  description: string;
  enabled: boolean;
}

export interface TrustStripConfig {
  enabled: boolean;
  items: TrustBenefitItem[];
}

export interface AnnouncementConfigItem {
  id: string;
  text: string;
  link?: string;
  linkText?: string;
  enabled: boolean;
  desktopVisible: boolean;
  mobileVisible: boolean;
  sortOrder: number;
}

export interface HeaderNavItemConfig {
  id: string;
  label: string;
  type: "category" | "collection" | "product" | "page" | "url";
  destination: string;
  enabled: boolean;
  sortOrder: number;
}

export interface HomepageSeoConfig {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

export interface HomepageCMSConfig {
  sectionsOrder: HomepageSectionConfig[];
  shopByCategory: ShopByCategoryConfig;
  newArrivals: ProductSelectionConfig;
  featuredCollection: FeaturedCollectionConfig;
  moreToCollect: ProductSelectionConfig;
  promoBanner: PromoBannerConfig;
  trustStrip: TrustStripConfig;
  announcements: AnnouncementConfigItem[];
  headerNavigation: HeaderNavItemConfig[];
  seo: HomepageSeoConfig;
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  { id: "hero", name: "Hero Carousel", enabled: true, sortOrder: 1 },
  { id: "categories", name: "Shop By Category", enabled: true, sortOrder: 2 },
  { id: "new_arrivals", name: "New Arrivals", enabled: true, sortOrder: 3 },
  { id: "featured_collection", name: "Featured Collection", enabled: true, sortOrder: 4 },
  { id: "more_to_collect", name: "More To Collect", enabled: true, sortOrder: 5 },
  { id: "promo_banner", name: "Promotional Banner", enabled: true, sortOrder: 6 },
  { id: "trust_strip", name: "Trust Strip", enabled: true, sortOrder: 7 },
];

export const DEFAULT_HOMEPAGE_CMS_CONFIG: HomepageCMSConfig = {
  sectionsOrder: DEFAULT_HOMEPAGE_SECTIONS,
  shopByCategory: {
    enabled: true,
    eyebrow: "CURATED UNIVERSE",
    title: "SHOP BY CATEGORY",
    description: "Explore authentic scale figures, Nendoroids, display statues, and rare Japanese merchandise grouped by franchise and category.",
    selectedCategoryIds: [],
    imageOverrides: {},
    ctaText: "EXPLORE ALL CATEGORIES",
    ctaUrl: "/collections",
  },
  newArrivals: {
    enabled: true,
    eyebrow: "FRESHLY ADDED TO COLLECTION",
    title: "NEW ARRIVALS",
    description: "The latest authentic releases and studio imports.",
    mode: "automatic",
    limit: 8,
    selectedProductIds: [],
    ctaText: "VIEW ALL NEW",
    ctaUrl: "/shop?sortBy=newest",
  },
  featuredCollection: {
    enabled: true,
    eyebrow: "SPOTLIGHT COLLECTION",
    title: "DEMON SLAYER",
    description: "Authentic collectible figures and merchandise directly from global studios.",
    imageUrl: "",
    ctaText: "EXPLORE COLLECTION",
    ctaDestinationType: "category",
    ctaDestinationValue: "demon-slayer",
  },
  moreToCollect: {
    enabled: true,
    eyebrow: "CATALOG HIGHLIGHTS",
    title: "MORE TO COLLECT",
    description: "Curated selections from our authentic collector inventory.",
    mode: "automatic",
    limit: 8,
    selectedProductIds: [],
    ctaText: "EXPLORE ALL",
    ctaUrl: "/shop",
  },
  promoBanner: {
    enabled: true,
    eyebrow: "NEW DROPS",
    headline: "FRESH COLLECTIBLES HAVE ARRIVED",
    description: "Browse the latest additions to the FICTIONFIGURE catalog.",
    ctaText: "SHOP NOW",
    ctaDestinationType: "category",
    ctaDestinationValue: "",
    bgImageUrl: "",
    mobileImageUrl: "",
    overlayStrength: 60,
    textAlign: "left",
  },
  trustStrip: {
    enabled: true,
    items: [
      {
        id: "1",
        icon: "ShieldCheck",
        title: "AUTHENTIC PRODUCTS",
        description: "Directly imported from licensed studios",
        enabled: true,
      },
      {
        id: "2",
        icon: "CreditCard",
        title: "SECURE PAYMENTS",
        description: "Encrypted UPI, Cards, and NetBanking",
        enabled: true,
      },
      {
        id: "3",
        icon: "Truck",
        title: "PAN-INDIA SHIPPING",
        description: "Protective outer box packaging guaranteed",
        enabled: true,
      },
      {
        id: "4",
        icon: "Headphones",
        title: "CUSTOMER SUPPORT",
        description: "Dedicated collector assistance team",
        enabled: true,
      },
    ],
  },
  announcements: [
    {
      id: "1",
      text: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.",
      enabled: true,
      desktopVisible: true,
      mobileVisible: true,
      sortOrder: 1,
    },
    {
      id: "2",
      text: "FREE SHIPPING ON ORDERS OF ₹500 OR MORE.",
      enabled: true,
      desktopVisible: true,
      mobileVisible: true,
      sortOrder: 2,
    },
  ],
  headerNavigation: [
    { id: "1", label: "SHOP", type: "url", destination: "/shop", enabled: true, sortOrder: 1 },
    { id: "2", label: "COLLECTIONS", type: "url", destination: "/collections", enabled: true, sortOrder: 2 },
    { id: "3", label: "NEW ARRIVALS", type: "url", destination: "/shop?sortBy=newest", enabled: true, sortOrder: 3 },
    { id: "4", label: "ABOUT", type: "url", destination: "/about", enabled: true, sortOrder: 4 },
  ],
  seo: {
    title: "FictionFigure | Authentic Anime Figures & Collectibles India",
    metaDescription: "Explore FictionFigure for premium collectible figures, scale anime statues, designer keychains, and action figures in India.",
    ogTitle: "FictionFigure | Authentic Anime Figures & Collectibles India",
    ogDescription: "Explore FictionFigure for premium collectible figures, scale anime statues, designer keychains, and action figures in India.",
    ogImage: "https://www.fictionfigures.in/og-image.png",
  },
};

export const SAFE_LUCIDE_ICONS = [
  "ShieldCheck",
  "Truck",
  "CreditCard",
  "Headphones",
  "Box",
  "Sparkles",
  "Award",
  "RotateCcw",
  "Lock",
  "PackageCheck",
  "Flame",
  "Star",
  "Heart",
  "RefreshCw",
  "Layers",
  "CheckCircle2",
];
