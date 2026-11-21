/** Keep category controls usable on both the shop and individual collection pages. */
export function buildListingUrl(baseUrl: string, search: string, updates: Record<string, string | null>): string {
  const params = new URLSearchParams(search);
  let destination = baseUrl;
  for (const [key, value] of Object.entries(updates)) {
    if (value?.trim()) params.set(key, value.trim());
    else params.delete(key);
  }
  if (baseUrl.startsWith("/collections/") && "category" in updates) {
    const category = updates.category?.trim();
    destination = category ? `/collections/${encodeURIComponent(category)}` : "/shop";
    params.delete("category");
  }
  if (!("page" in updates)) params.set("page", "1");
  const query = params.toString();
  return query ? `${destination}?${query}` : destination;
}
