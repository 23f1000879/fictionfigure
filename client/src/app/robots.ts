import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const PRIVATE_PATHS = [
  "/account",
  "/account/*",
  "/admin",
  "/admin/*",
  "/checkout",
  "/checkout/*",
  "/cart",
  "/login",
  "/register",
  "/order",
  "/order/*",
  "/design-system",
];

// Search and AI answer engines that are explicitly welcome to read the public catalogue,
// so the store can be cited in Google AI Overviews, ChatGPT, Claude, Perplexity, Gemini and Copilot.
const AI_AND_SEARCH_BOTS = [
  "Googlebot",
  "Bingbot",
  "Google-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Applebot-Extended",
  "DuckAssistBot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_AND_SEARCH_BOTS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
