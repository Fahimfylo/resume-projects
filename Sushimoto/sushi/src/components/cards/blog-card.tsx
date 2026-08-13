import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";
import type { BlogPost } from "@/types";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      )}
    >
      <div className="relative overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
          {post.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-secondary group-hover:text-primary">
          {post.title}
        </h3>

        <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-gray-500">{post.excerpt}</p>

        <div className="mt-auto flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readTime}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {post.author}
          </span>
        </div>
      </div>
    </Link>
  );
}
