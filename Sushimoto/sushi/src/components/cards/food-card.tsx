import Link from "next/link";
import { Star } from "lucide-react";
import type { Food } from "@/types";
import { cn } from "@/lib/utils";

interface FoodCardProps {
  food: Food;
}

export function FoodCard({ food }: FoodCardProps) {
  return (
    <Link
      href={`/menu/item/${food.slug}`}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-6",
      )}
    >
      {/* Badge - Positioned cleanly inside padding */}
      {food.isChefRecommendation && (
        <span className="absolute left-5 top-5 z-10 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-white shadow-sm">
          Chef Choice
        </span>
      )}

      {/* Image Container - Aspect ratio locked with modern background color */}
      <div className="relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-creamson p-6">
        <img
          src={food.image}
          alt={food.name}
          className="h-36 w-36 object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      {/* Info Block - Pushes the footer cleanly to the bottom */}
      <div className="flex flex-1 flex-col px-0.5 pb-2">
        <h3 className="mb-2 text-base font-semibold tracking-tight text-secondary line-clamp-1 group-hover:text-primary transition-colors">
          {food.name}
        </h3>

        {/* Short description slot (optional: helps anchor the design if your schema has it) */}
        {food.description && (
          <p className="mb-4 text-xs leading-relaxed text-gray-400 line-clamp-2">
            {food.description}
          </p>
        )}

        {/* Footer info pinned perfectly to the bottom */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-gray-500">
              {food.rating}
            </span>
          </div>

          <span className="text-base font-bold text-primary">
            ${food.price.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}
