"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GalleryCard } from "@/components/cards/gallery-card";
import { galleryItems } from "@/data/gallery";
import { X } from "lucide-react";
import type { GalleryItem } from "@/types";

const categories = [
  { value: "all", label: "All" },
  { value: "food", label: "Food" },
  { value: "restaurant", label: "Restaurant" },
  { value: "kitchen", label: "Kitchen" },
  { value: "events", label: "Events" },
] as const;

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const filteredItems =
    activeCategory === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <>
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden bg-secondary px-4">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url('/assets/subscribe_bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />
        <div className="relative z-10 text-center" data-aos="fade-up">
          <p className="font-heading text-lg font-medium tracking-[0.2em] text-primary/80">
            Our Gallery / ギャラリー
          </p>
          <h1 className="font-heading mt-2 text-6xl font-bold text-white md:text-8xl">
            Visual Journey
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-white/60">
            A glimpse into the artistry, ambiance, and moments that define the Sushimoto experience.
          </p>
        </div>
      </section>

      <section className="bg-creamson py-16 md:py-24 lg:py-28">
        <Container>
          <div className="mb-10 flex justify-center" data-aos="fade-up">
            <Tabs
              value={activeCategory}
              onValueChange={(value) => setActiveCategory(value)}
            >
              <TabsList className="flex-wrap gap-2 bg-white/60 p-2 shadow-sm">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    className="font-body capitalize data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {filteredItems.length > 0 ? (
            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              data-aos="fade-up"
            >
              {filteredItems.map((item) => (
                <Dialog key={item.id}>
                  <DialogTrigger asChild>
                    <div className="h-64 sm:h-72">
                      <GalleryCard
                        item={item}
                        onClick={() => setSelectedItem(item)}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
                    <div className="relative">
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="h-auto w-full rounded-xl object-contain"
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <p className="font-body text-sm capitalize text-white/80">
                          {item.category}
                        </p>
                        <p className="font-body text-sm text-white/60">{item.alt}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-20"
              data-aos="fade-up"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <X className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-secondary">
                No images found
              </h3>
              <p className="mt-2 font-body text-black-500">
                There are no images in the &ldquo;{activeCategory}&rdquo; category yet.
              </p>
            </div>
          )}
        </Container>
      </section>

      <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          {selectedItem && (
            <div className="relative">
              <img
                src={selectedItem.src}
                alt={selectedItem.alt}
                className="h-auto w-full rounded-xl object-contain"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="font-body text-sm capitalize text-white/80">
                  {selectedItem.category}
                </p>
                <p className="font-body text-sm text-white/60">{selectedItem.alt}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
