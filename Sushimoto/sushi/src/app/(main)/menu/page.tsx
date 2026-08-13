import { Metadata } from "next";
import { Search, ChevronDown, Grid3x3, List } from "lucide-react";
import { foods } from "@/data/foods";
import { FoodCard } from "@/components/cards/food-card";
import { Container } from "@/components/layout/container";
import CategoryNav from "@/components/navigation/category-nav";
import { fetchCategories } from "@/lib/fetch-categories";

export const metadata: Metadata = {
  title: "Menu | Sushimoto",
  description:
    "Explore our carefully crafted menu of authentic Japanese dishes, from fresh sushi and ramen to traditional appetizers and desserts.",
};

export default async function MenuPage() {
  const categories = await fetchCategories();

  return (
    <section className="py-16 md:py-24 lg:py-28">
      <Container>
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="sushi__subtitle">Discover Our</p>
          <h1 className="sushi__title">Our Menu</h1>
          <p className="sushi__description mx-auto max-w-2xl">
            Explore our carefully crafted menu of authentic Japanese dishes,
            from fresh sushi and ramen to traditional appetizers and desserts.
          </p>
        </div>

        {/* Category Filter */}
        <CategoryNav categories={categories} />

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              readOnly
              className="h-11 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                defaultValue="popular"
                className="h-11 appearance-none rounded-full border border-gray-200 bg-white pl-5 pr-11 text-sm font-medium text-gray-600 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex h-11 overflow-hidden rounded-full border border-gray-200 bg-white p-1">
              <button
                className="flex items-center justify-center rounded-full bg-primary px-3 text-white transition-colors"
                aria-label="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                className="flex items-center justify-center rounded-full px-3 text-gray-400 transition-colors hover:text-gray-700"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Food Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <button
            disabled
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-400 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-gray-600">Page 1 of 2</span>
          <button className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary">
            Next
          </button>
        </div>
      </Container>
    </section>
  );
}
