import type { GalleryItem } from "@/types";
import { cn } from "@/lib/utils";

interface GalleryCardProps {
  item: GalleryItem;
  onClick?: () => void;
}

export function GalleryCard({ item, onClick }: GalleryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative h-full w-full overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      <img
        src={item.src}
        alt={item.alt}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-secondary capitalize backdrop-blur-sm">
          {item.category}
        </span>
      </div>
    </button>
  );
}
