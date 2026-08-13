"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { getFeaturedDishes } from "@/data/foods"
import { FoodCard } from "@/components/cards/food-card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"

export function FeaturedDishes() {
  const dishes = getFeaturedDishes()

  return (
    <section className="py-16 md:py-24 lg:py-28" id="featured">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="sushi__subtitle">Today&apos;s Selection</p>
          <h2 className="sushi__title">Featured Dishes</h2>
          <p className="sushi__description mx-auto mt-4 max-w-2xl">
            Discover our handpicked selection of the finest Japanese dishes, crafted to perfection by our expert chefs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid auto-rows-fr grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {dishes.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link href="/menu">
            <Button variant="outline" size="lg" className="group gap-2 rounded-full border-primary text-primary hover:bg-primary hover:text-white">
              View Full Menu
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </Container>
    </section>
  )
}
