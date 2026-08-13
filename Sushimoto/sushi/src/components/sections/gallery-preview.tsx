"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { galleryItems } from "@/data/gallery"
import { GalleryCard } from "@/components/cards/gallery-card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"

export function GalleryPreview() {
  const previewItems = galleryItems.slice(0, 6)

  return (
    <section className="bg-secondary py-16 md:py-24 lg:py-28" id="gallery">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="sushi__subtitle !text-white/80">Our Gallery / ギャラリー</p>
          <h2 className="sushi__title !text-white">Visual Journey</h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base leading-relaxed text-white/60">
            A glimpse into the artistry and ambiance that makes Sushimoto an unforgettable experience.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-3"
        >
          {previewItems.map((item) => (
            <div key={item.id} className={previewItems.indexOf(item) === 0 ? "md:col-span-2 md:row-span-2" : ""}>
              <GalleryCard item={item} />
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link href="/gallery">
            <Button
              variant="outline"
              size="lg"
              className="group gap-2 rounded-full border-white/30 text-white hover:bg-white hover:text-secondary"
            >
              View Gallery
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </Container>
    </section>
  )
}
