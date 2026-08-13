"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { foods, getFoodsByCategory } from "@/data/foods";
import type { Category } from "@/types";

export function PopularFoods() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_POS_API_URL || "http://localhost:8000"}/api/menu/categories`)
      .then((r) => r.json())
      .then((json) => {
        const raw = json.data ?? [];
        setCategories(
          raw.map((c: { _id: string; name: string; slug: string; image?: string }) => ({
            id: c._id,
            name: c.name,
            slug: c.slug,
            image: c.image || "/assets/sushi-1.png",
            description: "",
            itemCount: 0,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const filterOptions = [
    { label: "All", value: "all", image: null },
    ...categories
      .filter((c) => ["sushi", "ramen", "udon-soba", "dango-sweets"].includes(c.slug))
      .map((c) => ({ label: c.name, value: c.slug, image: c.image })),
  ];

  const filteredFoods =
    activeFilter === "all"
      ? foods.slice(0, 3)
      : getFoodsByCategory(activeFilter).slice(0, 3);

  return (
    <section className="popular-foods" id="menu">
      <h2 className="popular-foods__title" data-aos="flip-up">
        Popular Food / 人気
      </h2>

      <div
        className="popular-foods__filters sushi__hide-scrollbar"
        data-aos="fade-up"
      >
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            className={`popular-foods__filter-btn${activeFilter === opt.value ? " active" : ""}`}
            onClick={() => setActiveFilter(opt.value)}
          >
            {opt.image && <img src={opt.image} alt={opt.label} />}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="popular-foods__catalogue" data-aos="fade-up">
        {filteredFoods.map((food, index) => (
          <Link key={food.id} href={`/menu/item/${food.slug}`} className="no-underline">
            <article className={`popular-foods__card${index === 1 ? " active-card" : ""}`}>
              <img
                className="popular-foods__card-image"
                src={food.image}
                alt={food.name}
              />
              <h4 className="popular-foods__card-title">{food.name}</h4>

              <div className="popular-foods__card-details flex-between">
                <div className="popular-foods__card-rating">
                  <img src="/assets/star.svg" alt="star" />
                  <p>{food.rating}</p>
                </div>

                <p className="popular-foods__card-price">
                  ${food.price.toFixed(2)}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>

      <Link
        href="/menu"
        className="popular-foods__button flex inline-flex items-center justify-center gap-2"
      >
        Explore Food
        <img
          src="/assets/arrow-right.svg"
          alt="arrow-right"
          className="h-4 w-4"
        />
      </Link>
    </section>
  );
}
