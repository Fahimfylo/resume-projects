import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Heart, Star, UtensilsCrossed, Clock, MapPin } from "lucide-react";
import { restaurantInfo } from "@/data/restaurant";

export const metadata: Metadata = {
  title: "About Us",
};

const milestones = [
  { year: "2015", title: "Founded", description: "Sushimoto was born from a passion for authentic Japanese cuisine." },
  { year: "2016", title: "First Location", description: "Opened our first restaurant in the heart of the city." },
  { year: "2018", title: "Michelin Recognition", description: "Awarded our first Michelin star for culinary excellence." },
  { year: "2020", title: "Expanded Menu", description: "Introduced new signature dishes and seasonal offerings." },
  { year: "2023", title: "New Locations", description: "Expanded to multiple locations across the country." },
  { year: "2025", title: "Online Ordering", description: "Launched a seamless online ordering experience." },
];

const awards = [
  { icon: Star, title: "Michelin Star", description: "Awarded for exceptional culinary quality and consistency." },
  { icon: Award, title: "Best Japanese Restaurant", description: "Recognized by the National Restaurant Association." },
  { icon: Heart, title: "People's Choice Award", description: "Voted favorite dining destination by our guests." },
  { icon: UtensilsCrossed, title: "Excellence in Cuisine", description: "Honored for innovation in traditional Japanese dishes." },
];

export default function AboutPage() {
  const { name, tagline, description } = restaurantInfo;

  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-secondary px-4">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url('/assets/about_bg1.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />
        <div className="relative z-10 text-center" data-aos="fade-up">
          <p className="font-heading text-lg font-medium tracking-[0.2em] text-primary/80">
            Our Story / 私たちの物語
          </p>
          <h1 className="font-heading text-6xl font-bold text-white md:text-8xl">
            {name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-white/60">
            {tagline}
          </p>
        </div>
      </section>

      <section className="bg-creamson py-16 md:py-24 lg:py-28" data-aos="fade-up">
        <Container>
          <div className="grid items-center gap-12 lg:gap-20 md:grid-cols-2">
            <div>
              <p className="font-heading text-lg font-medium tracking-wider text-primary">
                Our Story / 私たちの物語
              </p>
              <h2 className="font-heading mt-2 text-4xl font-semibold text-secondary md:text-5xl">
                A Journey of Passion & Flavor
              </h2>
              <div className="mt-6 space-y-4 font-body text-base leading-relaxed text-black-500">
                <p>
                  Founded in 2015, Sushimoto began as a dream shared by two childhood friends
                  with a profound love for Japanese culinary traditions. What started as a small
                  intimate sushi bar has blossomed into a celebrated dining destination.
                </p>
                <p>
                  Every dish tells a story — one of precision, respect for ingredients, and the
                  relentless pursuit of perfection. We source the finest seasonal fish, grow
                  our own microgreens, and craft our soy sauce using a century-old family recipe.
                </p>
                <p>
                  Our chefs train for years to master the art of sushi, learning not just the
                  technique but the philosophy behind each cut, each gesture, each plate.
                </p>
              </div>
            </div>
            <div className="relative overflow-visible">
              <img
                src="/assets/sushi-12.png"
                alt="Sushimoto chef preparing sushi"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-primary p-6 shadow-lg md:block">
                <p className="font-heading text-4xl font-bold text-white">10+</p>
                <p className="font-body text-sm text-white/80">Years of Excellence</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 md:py-24 lg:py-28" data-aos="fade-up">
        <Container>
          <div className="text-center" data-aos="fade-up">
            <p className="font-heading text-lg font-medium tracking-wider text-primary">
              Mission & Vision / 使命と展望
            </p>
            <h2 className="font-heading mt-2 text-4xl font-semibold text-secondary md:text-5xl">
              What Drives Us
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <Card className="border-none bg-creamson shadow-md">
              <CardContent className="p-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                  <Star className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-secondary">Our Mission</h3>
                <p className="mt-3 font-body leading-relaxed text-black-500">
                  To share the authentic taste of Japan through meticulously crafted dishes that honor
                  tradition while embracing innovation. We are committed to providing an unforgettable
                  dining experience rooted in the highest quality ingredients and genuine hospitality.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none bg-creamson shadow-md">
              <CardContent className="p-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-secondary">Our Vision</h3>
                <p className="mt-3 font-body leading-relaxed text-black-500">
                  To become a global ambassador of Japanese cuisine, inspiring people around the world
                  to discover the beauty of omotenashi. We envision a world where every meal is a
                  celebration of culture, community, and culinary artistry.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section className="relative bg-secondary py-16 md:py-24 lg:py-28" data-aos="fade-up">
        <Container>
          <div className="grid items-center gap-12 lg:gap-20 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-black-300">
                <img
                  src="/assets/about_bg1.png"
                  alt="Chef Takeda"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="font-heading text-lg font-medium tracking-wider text-primary">
                Meet the Chef / シェフ紹介
              </p>
              <h2 className="font-heading mt-2 text-4xl font-semibold text-white md:text-5xl">
                Chef Hiroshi Takeda
              </h2>
              <p className="mt-2 font-heading text-xl italic text-primary">Master of Japanese Cuisine</p>
              <div className="mt-6 space-y-4 font-body leading-relaxed text-white/70">
                <p>
                  With over 25 years of experience, Chef Hiroshi Takeda brings the soul of
                  Tokyo's finest sushi bars to every plate. Born in Osaka and trained in
                  Ginza, he has dedicated his life to the art of Edomae-style sushi.
                </p>
                <p>
                  His philosophy is simple: respect the ingredient. Chef Takeda personally
                  selects each fish at dawn markets and oversees every step of the preparation,
                  ensuring that each piece of sushi is a masterpiece of flavor and texture.
                </p>
                <p>
                  Under his leadership, Sushimoto has earned widespread acclaim, including a
                  coveted Michelin star and a reputation as one of the finest Japanese
                  restaurants in the country.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-creamson py-16 md:py-24 lg:py-28" data-aos="fade-up">
        <Container>
          <div className="text-center" data-aos="fade-up">
            <p className="font-heading text-lg font-medium tracking-wider text-primary">
              Our Journey / 私たちの歩み
            </p>
            <h2 className="font-heading mt-2 text-4xl font-semibold text-secondary md:text-5xl">
              Milestones
            </h2>
          </div>
          <div className="relative mt-16">
            <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-primary/20 md:block" />
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative flex flex-col items-center md:flex-row ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                  data-aos="fade-up"
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right md:pr-12" : "md:text-left md:pl-12"}`}>
                    <h3 className="font-heading text-3xl font-bold text-primary">{milestone.year}</h3>
                    <h4 className="font-heading mt-1 text-xl font-semibold text-secondary">{milestone.title}</h4>
                    <p className="mt-2 font-body text-black-500">{milestone.description}</p>
                  </div>
                  <div className="z-10 mx-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md md:mx-0">
                    <div className="h-3 w-3 rounded-full bg-white" />
                  </div>
                  <div className="flex-1 md:hidden" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 md:py-24 lg:py-28" data-aos="fade-up">
        <Container>
          <div className="text-center" data-aos="fade-up">
            <p className="font-heading text-lg font-medium tracking-wider text-primary">
              Awards & Recognition / 受賞歴
            </p>
            <h2 className="font-heading mt-2 text-4xl font-semibold text-secondary md:text-5xl">
              Our Accolades
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {awards.map((award) => (
              <Card key={award.title} className="border-none bg-creamson text-center shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="flex flex-col items-center p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                    <award.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-heading mt-4 text-xl font-semibold text-secondary">{award.title}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-black-500">{award.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative bg-secondary py-16 md:py-24 lg:py-28" data-aos="fade-up">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-heading text-lg font-medium tracking-wider text-primary">
              Our Philosophy / 私たちの哲学
            </p>
            <h2 className="font-heading mt-2 text-4xl font-semibold text-white md:text-5xl">
              The Spirit of Omotenashi
            </h2>
            <div className="mt-8 space-y-6 font-body leading-relaxed text-white/70">
              <p>
                Omotenashi is the Japanese art of wholehearted hospitality — anticipating
                needs before they are spoken and creating moments of genuine warmth. At Sushimoto,
                this philosophy guides everything we do, from the way we greet our guests to the
                precision of every garnish.
              </p>
              <p>
                We believe that dining is not merely eating; it is an experience that engages
                all the senses. The gentle sound of a knife slicing through pristine fish, the
                subtle aroma of seasoned rice, the visual harmony of a carefully composed plate,
                and the feeling of being truly welcomed — this is the essence of Omotenashi.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-body text-white/80">{restaurantInfo.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-body text-white/80">{restaurantInfo.hours[0].day} {restaurantInfo.hours[0].hours}</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
