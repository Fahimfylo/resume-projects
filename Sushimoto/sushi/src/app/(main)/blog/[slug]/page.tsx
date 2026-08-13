import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, User, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlogCard } from "@/components/cards/blog-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/layout/container";
import { blogPosts } from "@/data/blogs";
import type { BlogPost } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Sushimoto Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.image ? [{ url: post.image }] : [],
    },
  };
}

function getRelatedPosts(post: BlogPost, count = 3): BlogPost[] {
  return blogPosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, count);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);

  return (
    <>
      <section className="bg-creamson py-16 md:py-20">
        <Container>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/blog">Blog</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{post.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Container>
      </section>

      <article>
        <div className="relative h-64 w-full overflow-hidden md:h-96 lg:h-[500px]">
          <img
            src={post.image}
            alt={post.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <Container className="-mt-20 relative z-10">
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
            <Badge className="mb-4 w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              {post.category}
            </Badge>
            <h1 className="font-heading text-3xl font-bold text-secondary md:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 font-body text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>

            <div
              className="prose prose-gray mt-8 max-w-none font-body leading-relaxed text-gray-700 prose-headings:font-heading prose-headings:text-secondary prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:mb-4 prose-p:text-base prose-p:leading-7"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-10 border-t border-gray-100 pt-8">
              <h3 className="mb-3 font-heading text-lg font-semibold text-secondary">
                Share this post
              </h3>
              <div className="flex gap-3">
                {["Facebook", "Twitter", "LinkedIn"].map((platform) => (
                  <Button
                    key={platform}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    disabled
                  >
                    {platform}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section className="py-16 md:py-24 lg:py-28">
          <Container>
            <h2 className="mb-8 font-heading text-3xl font-semibold text-secondary md:text-4xl">
              Related Posts
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rp) => (
                <BlogCard key={rp.id} post={rp} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
