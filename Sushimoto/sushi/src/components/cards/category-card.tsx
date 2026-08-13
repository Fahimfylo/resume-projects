import Link from "next/link";
import { Utensils } from "lucide-react";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/menu?category=${category.slug}`}
      className={cn(
        "group flex flex-col items-center rounded-3xl bg-white p-5 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 sm:p-6"
      )}
    >
      <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-creamson">
        <img
          src={category.image}
          alt={category.name}
          className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-secondary group-hover:text-primary">
        {category.name}
      </h3>

      <p className="mb-3 line-clamp-2 text-sm text-gray-500">
        {category.description}
      </p>

      <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <Utensils className="h-3.5 w-3.5" />
        {category.itemCount} items
      </span>
    </Link>
  );
}
