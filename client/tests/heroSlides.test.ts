import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveHeroSlides } from "../src/lib/heroSlides.ts";

test("restores saved upload, headline and campaign destination", () => {
  const [slide] = resolveHeroSlides({ settings: { homepage_carousel_slides_json: JSON.stringify([{ id: "drop", image: "/uploads/figure.webp", title: "Just landed", primaryUrl: "/shop?sortBy=newest", primaryLabel: "Shop new arrivals" }]) } });
  assert.equal(slide.image, "/uploads/figure.webp");
  assert.equal(slide.title, "Just landed");
  assert.equal(slide.primaryUrl, "/shop?sortBy=newest");
  assert.equal(slide.primaryLabel, "Shop new arrivals");
});

test("uses saved editor order without mutating the API response", () => {
  const input = [{ id: "later", title: "Later", sortOrder: 2 }, { id: "first", title: "First", sortOrder: 1 }];
  assert.deepEqual(resolveHeroSlides({ carouselSlides: input }).map(slide => slide.title), ["First", "Later"]);
  assert.equal(input[0].title, "Later");
});

test("keeps intentionally disabled slides disabled instead of substituting a promotion", () => {
  const slides = resolveHeroSlides({ carouselSlides: [{ id: "hidden", title: "Do not show", enabled: false }] });
  assert.equal(slides.length, 1);
  assert.equal(slides.filter(slide => slide.enabled).length, 0);
});

test("malformed legacy JSON does not hide valid API campaigns", () => {
  const [slide] = resolveHeroSlides({ settings: { homepage_carousel_slides_json: "broken" }, carouselSlides: [{ id: "live", title: "Live campaign" }] });
  assert.equal(slide.title, "Live campaign");
});

test("restores the single-image hero configuration when no carousel is saved", () => {
  const [slide] = resolveHeroSlides({ settings: { homepage_hero_image_url: "/uploaded-banner.png", homepage_hero_title: "This week's arrivals", homepage_hero_primary_url: "/collections/new" }, carouselSlides: [] });
  assert.equal(slide.image, "/uploaded-banner.png");
  assert.equal(slide.title, "This week's arrivals");
  assert.equal(slide.primaryUrl, "/collections/new");
});

test("preserves background focal point and optional secondary action", () => {
  const [slide] = resolveHeroSlides({ carouselSlides: [{ id: "campaign", title: "Drop", backgroundImage: "/wide.webp", backgroundPosition: "right center", secondaryLabel: "View all", secondaryUrl: "/shop" }] });
  assert.equal(slide.backgroundImage, "/wide.webp");
  assert.equal(slide.backgroundPosition, "right center");
  assert.equal(slide.secondaryUrl, "/shop");
});

test("provides a branded campaign when no uploads are configured", () => {
  const [slide] = resolveHeroSlides({});
  assert.equal(slide.image, "/campaign/fandom-podium.webp");
  assert.equal(slide.primaryUrl, "/shop?sortBy=newest");
});
