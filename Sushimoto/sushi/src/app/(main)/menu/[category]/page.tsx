import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Search, ChevronDown, Grid3x3, List } from "lucide-react";
import { foods } from "@/data/foods";
import { FoodCard } from "@/components/cards/food-card";
import { Container } from "@/components/layout/container";
import { fetchCategories, fetchCategoryBySlug } from "@/lib/fetch-categories";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const categories = await fetchCategories();
  return categories.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = await fetchCategoryBySlug(category);
  if (!cat) return { title: "Category Not Found" };
  return {
    title: `${cat.name}`,
    description: `Browse our ${cat.name.toLowerCase()} menu at Sushimoto. ${cat.description}`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = await fetchCategoryBySlug(category);
  if (!cat) notFound();

  const filteredFoods = foods.filter((f) => f.category === category);

  const categories = await fetchCategories();

  return (
    <section className="py-16 md:py-24 lg:py-28">
      <Container>
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="sushi__subtitle">Explore Our</p>
          <h1 className="sushi__title">{cat.name}</h1>
          <p className="sushi__description mx-auto max-w-2xl">{cat.description}</p>
          <p className="mt-2 text-sm font-medium text-gray-500">
            {filteredFoods.length} item{filteredFoods.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Category Filter */}
        <div className="sushi__hide-scrollbar mb-8 flex gap-3 overflow-x-auto pb-2">
          <Link
            href="/menu"
            className="shrink-0 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-primary hover:text-primary"
          >
            All
          </Link>
          {categories.map((catItem) => (
            <Link
              key={catItem.id}
              href={`/menu/${catItem.slug}`}
              className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                catItem.slug === category
                  ? "bg-primary text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
              }`}
            >
              {catItem.name}
            </Link>
          ))}
        </div>

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
                className="h-11 appearance-none rounded-full border border-gray-200 bg-white pl-5 pr-11 text-sm font-medium text-gray-700 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex h-11 overflow-hidden rounded-full border border-gray-200 bg-white">
              <button className="flex items-center justify-center bg-primary px-3 text-white transition-colors" aria-label="Grid view">
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button className="flex items-center justify-center px-3 text-gray-400 transition-colors hover:text-gray-700" aria-label="List view">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Food Grid */}
        {filteredFoods.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
            {filteredFoods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-gray-500">No items found in this category.</p>
            <Link
              href="/menu"
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
            >
              View All Menu
            </Link>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            disabled
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-gray-700">Page 1 of 2</span>
          <button className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary">
            Next
          </button>
        </div>
      </Container>
    </section>
  );
}
