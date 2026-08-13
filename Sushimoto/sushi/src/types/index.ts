export interface Food {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  isChefRecommendation?: boolean;
  isTodaySpecial?: boolean;
  isAvailable?: boolean;
  cookingTime?: string;
  spiceLevel?: 1 | 2 | 3;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  ingredients?: string[];
  preparationNotes?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  itemCount: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  featured?: boolean;
}

export interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  role: string;
  text: string;
  rating: number;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  category: "food" | "restaurant" | "kitchen" | "events";
  width: number;
  height: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ReservationFormData {
  date: string;
  time: string;
  guests: number;
  branch: string;
  occasion: string;
  specialRequest: string;
  name: string;
  email: string;
  phone: string;
}

export interface CateringPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  serving: string;
  features: string[];
  popular?: boolean;
}

export interface NavigationLink {
  href: string;
  label: string;
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  mapUrl: string;
  hours: {
    day: string;
    hours: string;
  }[];
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
}
