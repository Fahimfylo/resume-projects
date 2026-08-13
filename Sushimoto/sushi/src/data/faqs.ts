import type { FAQ } from "@/types";

export const faqs: FAQ[] = [
  {
    id: "faq-1",
    question: "What are your operating hours?",
    answer:
      "We are open Monday to Friday from 11:00 AM to 10:00 PM, Saturday from 10:00 AM to 11:00 PM, and Sunday from 10:00 AM to 9:00 PM.",
    category: "general",
  },
  {
    id: "faq-2",
    question: "Do you offer delivery?",
    answer:
      "Yes! We offer delivery within a 5-mile radius. Delivery typically takes 30-45 minutes. You can order directly through our website or by phone.",
    category: "general",
  },
  {
    id: "faq-3",
    question: "Do you accommodate dietary restrictions?",
    answer:
      "Absolutely. We offer gluten-free soy sauce, vegetarian options, and can modify most dishes to accommodate dietary needs. Please inform your server when ordering.",
    category: "food",
  },
  {
    id: "faq-4",
    question: "Can I make a reservation?",
    answer:
      "Yes, you can make reservations through our website reservation page or by calling us directly. We recommend reserving at least 24 hours in advance for weekend seating.",
    category: "reservations",
  },
  {
    id: "faq-5",
    question: "Do you have private dining options?",
    answer:
      "Yes, we offer private dining for parties of 8-20 people. Please contact us for more details and availability. We also offer catering for larger events.",
    category: "catering",
  },
  {
    id: "faq-6",
    question: "Is your seafood sustainably sourced?",
    answer:
      "Yes, sustainability is important to us. We source our seafood from certified sustainable fisheries and work closely with suppliers who practice responsible fishing methods.",
    category: "food",
  },
  {
    id: "faq-7",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express, Discover), cash, and contactless payments including Apple Pay and Google Pay.",
    category: "general",
  },
  {
    id: "faq-8",
    question: "Do you offer takeout?",
    answer:
      "Yes, takeout is available during all operating hours. You can place your order online or by phone, and we'll have it ready for pickup.",
    category: "general",
  },
];
