import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, CalendarDays, Clock, User, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BlogCard } from "@/components/cards/blog-card";
import { Container } from "@/components/layout/container";
import { blogPosts } from "@/data/blogs";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog | Sushimoto",
};

const categories = [...new Set(blogPosts.map((p) => p.category))];
const featuredPost = blogPosts.find((p) => p.featured) || blogPosts[0];
const otherPosts = blogPosts.filter((p) => p.id !== featuredPost.id);

export default function BlogPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-creamson py-16 md:py-24 lg:py-28">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary" />
        </div>
        <Container className="relative text-center">
          <p className="font-body text-sm font-medium uppercase tracking-widest text-primary">
            Stories &amp; Insights
          </p>
          <h1 className="mt-3 font-heading text-5xl font-bold text-secondary md:text-6xl lg:text-7xl">
            Our Blog
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-500">
            Dive into the world of Japanese cuisine, culture, and the Sushimoto story.
          </p>
        </Container>
      </section>

      {featuredPost && (
        <section className="-mt-16 pb-12 md:pb-16 lg:pb-20">
          <Container>
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group relative block overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="grid md:grid-cols-2">
                <div className="relative overflow-hidden">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-full"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-10">
                  <Badge className="mb-3 w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    {featuredPost.category}
                  </Badge>
                  <h2 className="mb-3 font-heading text-2xl font-bold text-secondary transition-colors group-hover:text-primary md:text-3xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mb-4 font-body text-gray-500">{featuredPost.excerpt}</p>
                  <div className="mb-4 flex flex-wrap items-center gap-4 font-body text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {featuredPost.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {featuredPost.author}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-body text-sm font-semibold text-primary">
                    Read More
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          </Container>
        </section>
      )}

      <section className="pb-16 md:pb-20 lg:pb-28">
        <Container>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={cn(
                    "rounded-full px-5 py-2 font-body text-sm font-medium transition-colors",
                    "bg-white text-secondary hover:bg-primary hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search posts..."
                className="h-11 w-full rounded-full border pl-10 sm:w-64"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              disabled
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-body text-sm text-gray-500">Page 1 of 1</span>
            <Button
              variant="outline"
              size="icon"
              disabled
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
