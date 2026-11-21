export interface CampaignSlide {
  id: string;
  image: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  cardLabel?: string;
  cardCaption?: string;
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  description?: string;
  primaryLabel?: string;
  primaryUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  enabled?: boolean;
  sortOrder?: number;
}

type HeroData = { settings?: Record<string, string>; carouselSlides?: unknown };

/** Consume the existing settings contract; never mutate saved campaign records. */
export function resolveHeroSlides({ settings = {}, carouselSlides }: HeroData): CampaignSlide[] {
  let saved: unknown = carouselSlides;
  if (settings.homepage_carousel_slides_json) {
    try {
      const parsed: unknown = JSON.parse(settings.homepage_carousel_slides_json);
      if (Array.isArray(parsed) && parsed.length) saved = parsed;
    } catch { /* A malformed legacy value must not hide the API's valid slides. */ }
  }

  if (Array.isArray(saved) && saved.length) {
    return saved.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item, index) => {
        const string = (key: string, fallback = "") => typeof item[key] === "string" ? item[key] as string : fallback;
        return {
          id: `${string("id", "campaign")}-${index}`,
          image: string("image"), backgroundImage: string("backgroundImage"),
          backgroundPosition: string("backgroundPosition", "center center"),
          cardLabel: string("cardLabel"), cardCaption: string("cardCaption"),
          eyebrow: string("eyebrow"), title: string("title", "New arrivals"),
          titleAccent: string("titleAccent"), description: string("description"),
          primaryLabel: string("primaryLabel", "Shop the drop"), primaryUrl: string("primaryUrl", "/shop?sortBy=newest"),
          secondaryLabel: string("secondaryLabel", settings.homepage_hero_secondary_label),
          secondaryUrl: string("secondaryUrl", settings.homepage_hero_secondary_url),
          enabled: item.enabled !== false,
          sortOrder: typeof item.sortOrder === "number" && Number.isFinite(item.sortOrder) ? item.sortOrder : index,
        };
      }).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  return [{
    id: "store-campaign",
    image: settings.homepage_hero_image_url || "/campaign/fandom-podium.webp",
    eyebrow: settings.homepage_hero_eyebrow || "Find your next favourite",
    title: settings.homepage_hero_title || "Your fandom.",
    titleAccent: settings.homepage_hero_title_accent || "Your shelf.",
    description: settings.homepage_hero_description || "Figures, manga and little finds from the worlds you love.",
    primaryLabel: settings.homepage_hero_primary_label || "Explore new arrivals",
    primaryUrl: settings.homepage_hero_primary_url || "/shop?sortBy=newest",
    secondaryLabel: settings.homepage_hero_secondary_label || "Explore all collections",
    secondaryUrl: settings.homepage_hero_secondary_url || "/collections",
    enabled: true,
  }];
}
