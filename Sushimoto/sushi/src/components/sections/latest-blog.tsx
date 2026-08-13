"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { blogPosts } from "@/data/blogs"
import { BlogCard } from "@/components/cards/blog-card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"

export function LatestBlog() {
  const featuredPosts = blogPosts.filter((post) => post.featured)

  if (featuredPosts.length === 0) return null

  return (
    <section className="py-16 md:py-24 lg:py-28" id="blog">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="sushi__subtitle">Our Blog / ブログ</p>
          <h2 className="sushi__title">Latest Articles</h2>
          <p className="sushi__description mx-auto mt-4 max-w-2xl">
            Insights, stories, and culinary wisdom straight from the heart of Sushimoto.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {featuredPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link href="/blog">
            <Button variant="outline" size="lg" className="group gap-2 rounded-full border-primary text-primary hover:bg-primary hover:text-white">
              View All Posts
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </Container>
    </section>
  )
}
