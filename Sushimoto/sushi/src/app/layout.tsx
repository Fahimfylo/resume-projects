import type { Metadata } from "next";
import { AosInitializer } from "@/providers/aos-initializer";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";
import "../styles/sections/header.css";
import "../styles/sections/hero.css";
import "../styles/sections/about.css";
import "../styles/sections/popular.css";
import "../styles/sections/trending.css";
import "../styles/sections/subscribe.css";
import "../styles/sections/footer.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sushimoto.com"),
  title: {
    default: "Sushimoto — Authentic Japanese Restaurant",
    template: "%s | Sushimoto",
  },
  description:
    "Experience the taste of authentic Japanese cuisine at Sushimoto. Fresh sushi, sashimi, ramen, and more delivered to your door.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Sushimoto",
    title: "Sushimoto — Authentic Japanese Restaurant",
    description:
      "Experience the taste of authentic Japanese cuisine at Sushimoto. Fresh sushi, sashimi, ramen, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sushimoto — Authentic Japanese Restaurant",
    description:
      "Experience the taste of authentic Japanese cuisine at Sushimoto.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/assets/sushi.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: "Sushimoto",
            image: "/assets/sushi-1.png",
            url: "https://sushimoto.com",
            telephone: "+1 (555) 123-4567",
            servesCuisine: "Japanese",
            priceRange: "$$",
            address: {
              "@type": "PostalAddress",
              streetAddress: "123 Sakura Street",
              addressLocality: "New York",
              addressRegion: "NY",
              postalCode: "10001",
              addressCountry: "US",
            },
            openingHoursSpecification: [
              { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "11:00", closes: "22:00" },
              { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "23:00" },
              { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "10:00", closes: "21:00" },
            ],
            menu: "https://sushimoto.com/menu",
            acceptsReservations: "https://sushimoto.com/reservation",
          }),
        }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <AosInitializer />
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
