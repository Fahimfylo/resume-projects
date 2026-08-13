"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/types";

interface CategoryNavProps {
  categories: Category[];
}

const SCROLL_AMOUNT = 300;

export default function CategoryNav({ categories }: CategoryNavProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const isAllActive = pathname === "/menu";

  const activeSlug = useMemo(() => {
    if (isAllActive) return null;
    const match = pathname.match(/\/menu\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname, isAllActive]);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const epsilon = 2;
    setCanScrollLeft(el.scrollLeft > epsilon);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - epsilon);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateFades);
      ro.disconnect();
    };
  }, [updateFades]);

  // Wheel → horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!Math.abs(e.deltaY) && !Math.abs(e.deltaX)) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Auto-center active category
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const target = el.querySelector<HTMLElement>(
        `[data-cat="${activeSlug ?? "__all__"}"]`
      );
      if (!target) return;
      const centerOffset =
        target.offsetLeft - el.clientWidth / 2 + target.offsetWidth / 2;
      el.scrollTo({ left: Math.max(0, centerOffset), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [activeSlug, isAllActive]);

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: "smooth" });
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollBy(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); scrollBy(-1); }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const pill = (active: boolean) =>
    [
      "shrink-0 rounded-full px-5 py-2 text-sm font-medium whitespace-nowrap",
      "transition-all duration-200 ease-out",
      active
        ? "bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]"
        : "border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary hover:shadow-sm",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    ].join(" ");

  return (
    <div className="relative mb-8 select-none">
      {/* Left fade */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-gray-50 to-transparent transition-opacity duration-300"
        style={{ opacity: canScrollLeft ? 1 : 0 }}
        aria-hidden="true"
      />
      {/* Right fade */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-gray-50 to-transparent transition-opacity duration-300"
        style={{ opacity: canScrollRight ? 1 : 0 }}
        aria-hidden="true"
      />

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Food categories"
        onKeyDown={handleKeyDown}
        className="flex items-center gap-3 overflow-x-auto py-1.5"
        style={{ scrollbarWidth: "none" }}
      >
        <Link
          href="/menu"
          data-cat="__all__"
          role="tab"
          aria-selected={isAllActive}
          tabIndex={0}
          className={pill(isAllActive)}
        >
          All
        </Link>

        {categories.map((cat) => {
          const active = activeSlug === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/menu/${cat.slug}`}
              data-cat={cat.slug}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              className={pill(active)}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Global style to hide webkit scrollbar */}
      <style>{`
        div[role="tablist"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
