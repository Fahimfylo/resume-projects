"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Star, ChefHat } from "lucide-react"
import { getChefRecommendations } from "@/data/foods"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/layout/container"

export function ChefRecommendation() {
  const recommendations = getChefRecommendations()
  const [featured, ...others] = recommendations

  if (!featured) return null

  return (
    <section className="bg-secondary py-16 md:py-24 lg:py-28" id="chef-recommendation">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="sushi__subtitle !text-white/80" data-aos="fade-up">
            Chef&apos;s Selection
          </p>
          <h2 className="sushi__title !text-white" data-aos="fade-up">
            Chef Recommendation
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base leading-relaxed text-white/60" data-aos="fade-up">
            Handpicked by our head chef, these dishes represent the pinnacle of Japanese culinary artistry.
          </p>
        </motion.div>

        <div className="mb-10 overflow-hidden rounded-3xl bg-white/5 backdrop-blur-sm" data-aos="fade-up">
          <div className="flex flex-col md:flex-row">
            <div className="flex items-center justify-center bg-creamson/10 p-8 md:w-1/2">
              <img
                src={featured.image}
                alt={featured.name}
                className="h-64 w-64 object-contain transition-transform duration-500 hover:scale-105 md:h-80 md:w-80"
              />
            </div>

            <div className="flex flex-col justify-center p-8 md:w-1/2 md:p-12">
              <Badge variant="secondary" className="mb-4 w-fit gap-1.5 rounded-full bg-primary/20 text-primary">
                <ChefHat className="h-3.5 w-3.5" />
                Chef&apos;s Pick
              </Badge>

              <h3 className="mb-3 font-heading text-3xl font-semibold text-white">{featured.name}</h3>

              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-white/80">{featured.rating}</span>
                </div>
                <span className="text-white/40">|</span>
                <span className="text-sm text-white/60">{featured.reviews} reviews</span>
              </div>

              <p className="mb-6 font-body text-base leading-relaxed text-white/70">{featured.description}</p>

              <div className="flex items-center gap-4">
                <span className="font-heading text-3xl font-bold text-primary">${featured.price.toFixed(2)}</span>
                <Link
                  href={`/menu/${featured.slug}`}
                  className="rounded-full bg-primary px-6 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Order Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3" data-aos="fade-up">
          {others.map((food) => (
            <Link
              key={food.id}
              href={`/menu/${food.slug}`}
              className="group flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition-all duration-300 hover:bg-white/10"
            >
              <div className="flex-shrink-0 overflow-hidden rounded-xl bg-creamson/10 p-3">
                <img
                  src={food.image}
                  alt={food.name}
                  className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="truncate font-heading text-lg font-semibold text-white">{food.name}</h4>
                <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {food.rating}
                  </span>
                  <span className="font-bold text-primary">${food.price.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
