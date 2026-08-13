import type { BlogPost } from "@/types";

export const blogPosts: BlogPost[] = [
  {
    id: "art-of-sushi-making",
    title: "The Art of Sushi Making: A Journey Through Tradition",
    slug: "art-of-sushi-making",
    excerpt:
      "Discover the centuries-old tradition of sushi making, from the perfect rice to the freshest fish. Learn what makes authentic Japanese sushi truly special.",
    content: `
      <p>Sushi is more than just food — it's an art form that has been perfected over centuries. At Sushimoto, we honor this tradition while embracing modern techniques.</p>
      <h2>The Perfect Rice</h2>
      <p>Every great sushi starts with the rice. We use premium Japanese short-grain rice seasoned with rice vinegar, sugar, and salt. The rice must be cooked to perfection — not too hard, not too soft — and cooled to exactly body temperature before use.</p>
      <h2>Choosing the Fish</h2>
      <p>We source our fish from the world's best fisheries. Freshness is paramount, but so is sustainability. We work only with suppliers who practice responsible fishing.</p>
      <h2>The Chef's Touch</h2>
      <p>Our chefs train for years to master the art of sushi. The gentle pressure of forming nigiri, the precise angle of the knife cut, the careful arrangement on the plate — every detail matters.</p>
    `,
    image: "/assets/sushi-1.png",
    category: "Culture",
    author: "Chef Tanaka",
    date: "2026-01-15",
    readTime: "5 min read",
    featured: true,
  },
  {
    id: "japanese-tea-guide",
    title: "A Complete Guide to Japanese Tea",
    slug: "japanese-tea-guide",
    excerpt:
      "From matcha to hojicha, explore the wonderful world of Japanese tea and find your perfect cup.",
    content: `
      <p>Japanese tea is an essential part of the dining experience. Let us guide you through the different varieties and their perfect pairings.</p>
    `,
    image: "/assets/sushi-4.png",
    category: "Beverages",
    author: "Sakura Kimura",
    date: "2026-01-10",
    readTime: "4 min read",
  },
  {
    id: "ramen-broth-secrets",
    title: "The Secrets Behind Our Legendary Ramen Broth",
    slug: "ramen-broth-secrets",
    excerpt:
      "What makes a truly great ramen broth? Our head chef reveals the techniques and ingredients that go into our signature bowls.",
    content: `
      <p>Great ramen starts with great broth. Our tonkotsu broth simmers for 18 hours, extracting every bit of flavor from pork bones.</p>
    `,
    image: "/assets/sushi-10.png",
    category: "Food",
    author: "Chef Tanaka",
    date: "2026-01-05",
    readTime: "6 min read",
  },
  {
    id: "omotenashi-hospitality",
    title: "Omotenashi: The Japanese Spirit of Hospitality",
    slug: "omotenashi-hospitality",
    excerpt:
      "Learn about the Japanese philosophy of wholehearted hospitality and how it shapes every aspect of dining at Sushimoto.",
    content: `
      <p>Omotenashi is the Japanese approach to hospitality that goes beyond mere service. It's about anticipating needs and creating memorable experiences.</p>
    `,
    image: "/assets/about_bg1.png",
    category: "Culture",
    author: "Sushimoto Team",
    date: "2025-12-28",
    readTime: "4 min read",
    featured: true,
  },
  {
    id: "seasonal-ingredients",
    title: "Embracing Seasons: The Philosophy of Shun",
    slug: "seasonal-ingredients",
    excerpt:
      "Discover how we celebrate Japan's seasonal ingredients and why eating with the seasons creates the most memorable meals.",
    content: `
      <p>In Japanese cuisine, Shun refers to ingredients that are at the peak of their flavor. We build our menu around what's freshest.</p>
    `,
    image: "/assets/sushi-3.png",
    category: "Food",
    author: "Chef Tanaka",
    date: "2025-12-20",
    readTime: "5 min read",
  },
];
