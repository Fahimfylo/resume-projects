import { Star } from "lucide-react";
import type { Review } from "@/types";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6"
      )}
    >
      <div className="flex items-center gap-3">
        <img
          src={review.avatar}
          alt={review.name}
          className="h-12 w-12 rounded-full object-cover"
        />

        <div className="flex-1">
          <h4 className="font-semibold text-secondary">{review.name}</h4>
          <span className="text-xs text-gray-400">{review.date}</span>
        </div>

        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-gray-600">{review.text}</p>
    </div>
  );
}
