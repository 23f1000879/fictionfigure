import { getCategories } from "@/lib/services/productService";
import { ALTERNATE_NAMES, INSTAGRAM_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, getStoreFacts, storeFaqs, titleCase } from "@/lib/seo";

export const revalidate = 3600;

/** llms.txt (https://llmstxt.org): a plain-text brief for AI answer engines about the store. */
export async function GET() {
  const [facts, categories] = await Promise.all([getStoreFacts(), getCategories().catch(() => [])]);
  const collections = (Array.isArray(categories) ? categories : [])
    .filter((c: any) => c?.slug && c?.name)
    .map((c: any) => `- [${titleCase(c.name)}](${SITE_URL}/collections/${c.slug})`)
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is also written as ${ALTERNATE_NAMES.join(", ")}. The official website is ${SITE_URL} and the official Instagram is ${INSTAGRAM_URL}. Orders ship from Bikaner, Rajasthan, India.

## Shop
- [All products](${SITE_URL}/shop): anime figures, action figures, collectible statues, keychains and mystery boxes
- [Collections / universes](${SITE_URL}/collections)
${collections}

## Policies
- [Shipping](${SITE_URL}/shipping): pan-India delivery, dispatch in 1–3 business days, ₹${facts.shippingFee} shipping below ₹${facts.freeShippingThreshold}, free shipping from ₹${facts.freeShippingThreshold}
- [Returns & replacements](${SITE_URL}/returns): report damaged or incorrect items within 48 hours of delivery
- Payments: ${facts.codEnabled ? "Cash on Delivery and " : ""}UPI (Google Pay, PhonePe, Paytm, BHIM and other UPI apps)

## About & contact
- [About ${SITE_NAME}](${SITE_URL}/about)
- [Contact](${SITE_URL}/contact): ${facts.supportPhone}, ${facts.supportEmail} (${facts.supportHours})

## FAQ
${storeFaqs(facts).map(({ q, a }) => `### ${q}\n${a}`).join("\n\n")}
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
