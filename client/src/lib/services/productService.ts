import { ProductFilterInput } from "@/lib/schemas/product";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE}/admin/categories`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data.categories || [];
    }
  } catch (e) {
    console.error("getCategories error:", e);
  }
  return [];
}

export async function getCategoryBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/categories/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data.category || null;
    }
  } catch (e) {
    console.error("getCategoryBySlug error:", e);
  }
  return null;
}

export async function getProducts(filters: Partial<ProductFilterInput> & { sortBy?: string; inStockOnly?: boolean } = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.query) queryParams.set("query", filters.query);
    if (filters.category) queryParams.set("category", filters.category);
    if (filters.brand) queryParams.set("brand", filters.brand);
    if (filters.franchise) queryParams.set("franchise", filters.franchise);
    if (filters.minPrice !== undefined) queryParams.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined) queryParams.set("maxPrice", String(filters.maxPrice));
    if (filters.inStockOnly) queryParams.set("inStockOnly", "true");
    if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
    if (filters.limit) queryParams.set("limit", String(filters.limit));
    if (filters.page) queryParams.set("page", String(filters.page));

    const res = await fetch(`${API_BASE}/products?${queryParams.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return {
        products: data.products || [],
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
        categories: data.categories || [],
        brands: data.brands || [],
        franchises: data.franchises || [],
      };
    }
  } catch (e) {
    console.error("getProducts error:", e);
  }

  return {
    products: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    categories: [],
    brands: [],
    franchises: [],
  };
}

export async function getProductBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("getProductBySlug error:", e);
  }

  return {
    product: null,
    relatedProducts: [],
  };
}

export async function getBrandsAndMetadata() {
  try {
    const res = await fetch(`${API_BASE}/products?limit=100`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return {
        brands: data.brands || [],
        franchises: data.franchises || [],
        materials: ["PVC & ABS", "Polystone Resin", "Soft Vinyl", "Cold Cast Metal"],
        scales: ["1/6 Scale", "1/4 Scale", "1/7 Scale", "10-Inch Vinyl"],
      };
    }
  } catch (e) {
    console.error("getBrandsAndMetadata error:", e);
  }

  return {
    brands: [],
    franchises: [],
    materials: [],
    scales: [],
  };
}
