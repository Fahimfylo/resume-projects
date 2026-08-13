"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { testimonials } from "@/data/testimonials"
import { Card, CardContent } from "@/components/ui/card"
import { Container } from "@/components/layout/container"

export function Testimonials() {
  const displayed = testimonials.slice(0, 3)

  return (
    <section className="py-16 md:py-24 lg:py-28" id="testimonials">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="sushi__subtitle">Testimonials / お客様の声</p>
          <h2 className="sushi__title">What Our Customers Say</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid auto-rows-fr gap-8 md:grid-cols-3"
        >
          {displayed.map((testimonial, index) => (
          <Card key={testimonial.id} className="relative h-full border-none bg-white shadow-sm">
            <CardContent className="flex flex-1 flex-col gap-5 p-8">
                <Quote className="h-8 w-8 text-primary/20" />

                <p className="font-body text-base leading-relaxed text-gray-600">&ldquo;{testimonial.text}&rdquo;</p>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-auto flex items-center gap-3 border-t border-gray-100 pt-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-heading text-sm font-semibold text-secondary">{testimonial.name}</h4>
                    <p className="text-xs text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
