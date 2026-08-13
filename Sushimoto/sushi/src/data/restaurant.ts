import type { RestaurantInfo } from "@/types";

export const restaurantInfo: RestaurantInfo = {
  name: "Sushimoto",
  tagline: "Feel the taste of Japanese food",
  description:
    "We will continue to provide the experience of Omotenashi, the Japanese mindset of hospitality, with our shopping and dining for our customers.",
  phone: "+1 (555) 123-4567",
  email: "hello@sushimoto.com",
  address: "123 Sakura Street, Tokyo District, New York, NY 10001",
  mapUrl: "https://maps.google.com/?q=123+Sakura+Street+New+York",
  hours: [
    { day: "Monday - Friday", hours: "11:00 AM - 10:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 11:00 PM" },
    { day: "Sunday", hours: "10:00 AM - 9:00 PM" },
  ],
  social: {
    facebook: "#",
    instagram: "#",
    twitter: "#",
  },
};
