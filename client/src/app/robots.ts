import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
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
      ],
    },
    sitemap: "https://www.fictionfigures.in/sitemap.xml",
  };
}
