/** General spelling matching derived from catalog text; no character-specific aliases. */
export interface SearchableProduct {
  id: string;
  name: string;
  brand?: string | null;
  franchise?: string | null;
  sku?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  category?: { name?: string | null } | null;
}

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const connectors = new Set(["a", "an", "the", "and", "of", "for", "with", "in", "on", "to", "from", "by"]);

export function canExpandSearch(query: string): boolean {
  const normalized = normalize(query);
  return query.length <= 120 && normalized.length >= 3 && normalized.split(/\s+/).some(word => !connectors.has(word));
}

/** Damerau-Levenshtein: adjacent swapped letters count as one spelling mistake. */
function distance(left: string, right: string, maximum: number): number {
  if (Math.abs(left.length - right.length) > maximum) return maximum + 1;
  let previousPrevious: number[] = [];
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        current[j] = Math.min(current[j], previousPrevious[j - 2] + 1);
      }
    }
    previousPrevious = previous;
    previous = current;
  }
  return previous[right.length];
}

function wordMatches(query: string, word: string): boolean {
  if (query === word) return true;
  if (query.length >= 3 && word.startsWith(query)) return true;
  if (query.length < 3 || word.length < 3) return false;
  // Avoid broad, accidental corrections for tiny names and numeric SKUs.
  if (/\d/.test(query) || /\d/.test(word)) return false;
  if (query.length === 3 && (word.length < 4 || query[0] !== word[0])) return false;
  const maximum = query.length >= 8 ? 2 : 1;
  return distance(query, word, maximum) <= maximum;
}

export function matchesCatalogQuery(product: SearchableProduct, query: string): boolean {
  if (!canExpandSearch(query)) return false;
  const normalized = normalize(query);
  const fields = [product.name, product.brand, product.franchise, product.sku, product.category?.name, product.shortDescription, product.description]
    .filter((value): value is string => typeof value === "string" && value.length > 0).map(normalize);
  // Match missing spaces and punctuation, such as "onepiece" and "key-chain".
  const compact = normalized.replace(/\s/g, "");
  if (fields.some(field => field.replace(/\s/g, "").includes(compact))) return true;
  const words = Array.from(new Set(fields.flatMap(field => {
    const parts = field.split(/\s+/);
    // Also recognize a mistyped joined phrase, such as "onepeice".
    return [...parts, ...parts.slice(0, -1).map((part, index) => part + parts[index + 1])];
  })));
  const queryWords = normalized.split(/\s+/).filter(word => !connectors.has(word));
  return queryWords.every(word => words.some(candidate => wordMatches(word, candidate)));
}

interface CatalogPage<T> { products: T[]; totalCount: number; totalPages: number }

/** Read cached public pages only after an exact search is empty. Never return a partial catalog. */
export async function expandCatalogSearch<T extends SearchableProduct>(
  query: string,
  readPage: (page: number) => Promise<CatalogPage<T>>,
  requestedPage = 1,
  pageSize = 12,
) {
  if (!canExpandSearch(query)) return null;
  try {
    const first = await readPage(1);
    if (!first.totalCount) return null;
    const candidates = [...first.products];
    for (let page = 2; page <= first.totalPages; page += 4) {
      const pages = await Promise.all(Array.from({ length: Math.min(4, first.totalPages - page + 1) }, (_, index) => readPage(page + index)));
      candidates.push(...pages.flatMap(result => result.products));
    }
    const unique = Array.from(new Map(candidates.map(product => [product.id, product])).values());
    if (unique.length !== first.totalCount) return null;
    // Retain the API's selected price/name/newest order after matching.
    const matches = unique.filter(product => matchesCatalogQuery(product, query));
    if (!matches.length) return null;
    const limit = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 12;
    const totalPages = Math.ceil(matches.length / limit);
    const currentPage = Number.isFinite(requestedPage) ? Math.min(totalPages, Math.max(1, Math.floor(requestedPage))) : 1;
    return { products: matches.slice((currentPage - 1) * limit, currentPage * limit), totalCount: matches.length, totalPages, currentPage };
  } catch {
    return null;
  }
}
