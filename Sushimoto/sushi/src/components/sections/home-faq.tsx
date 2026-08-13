"use client"

import { motion } from "framer-motion"
import { faqs } from "@/data/faqs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Container } from "@/components/layout/container"

export function HomeFaq() {
  const generalFaqs = faqs.filter((faq) => faq.category === "general").slice(0, 4)

  if (generalFaqs.length === 0) return null

  return (
    <section className="py-16 md:py-24 lg:py-28" id="faq">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="sushi__subtitle">FAQ / よくある質問</p>
          <h2 className="sushi__title">Frequently Asked Questions</h2>
          <p className="sushi__description mx-auto mt-4 max-w-2xl">
            Everything you need to know about dining at Sushimoto.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-3xl"
        >
          <Accordion type="single" collapsible className="w-full">
            {generalFaqs.map((faq, index) => (
              <AccordionItem key={faq.id} value={`faq-${index}`}>
                <AccordionTrigger className="text-left font-heading text-base font-semibold text-secondary hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-body text-base leading-relaxed text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </Container>
    </section>
  )
}
