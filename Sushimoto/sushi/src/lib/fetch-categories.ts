import type { Category } from "@/types";

const POS_API = process.env.POS_API_URL || "http://localhost:8000";

interface ApiCategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  bgColor: string;
  image: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${POS_API}/api/menu/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const raw: ApiCategory[] = json.data ?? [];
    return raw.map((c) => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      image: c.image || "/assets/sushi-1.png",
      description: c.description || "",
      itemCount: 0,
    }));
  } catch {
    return [];
  }
}

export async function fetchCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const categories = await fetchCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}
