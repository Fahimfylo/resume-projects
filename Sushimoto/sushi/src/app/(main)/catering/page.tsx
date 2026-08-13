import { Users, Check, ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/layout/container";
import { cateringPackages } from "@/data/catering";
import { faqs } from "@/data/faqs";
import { restaurantInfo } from "@/data/restaurant";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Catering | Sushimoto",
};

const cateringFaqs = faqs.filter((f) => f.category === "catering");

export default function CateringPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-creamson py-16 md:py-24 lg:py-28">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary" />
        </div>
        <Container className="relative text-center">
          <p className="font-body text-sm font-medium uppercase tracking-widest text-primary">
            We Bring the Feast to You
          </p>
          <h1 className="mt-3 font-heading text-5xl font-bold text-secondary md:text-6xl lg:text-7xl">
            Catering Services
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-500">
            From intimate gatherings to grand celebrations, Sushimoto brings authentic Japanese
            flavors to your event. Let us create an unforgettable dining experience.
          </p>
        </Container>
      </section>

      <section className="py-16 md:py-24 lg:py-28">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="font-heading text-4xl font-semibold text-secondary md:text-5xl">
              Choose Your Package
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-body text-gray-500">
              Every package is customizable. Contact us to tailor the perfect menu for your event.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {cateringPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-2xl border-2 transition-shadow hover:shadow-lg",
                  pkg.popular ? "border-primary" : "border-transparent"
                )}
              >
                {pkg.popular && (
                  <Badge className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    Popular
                  </Badge>
                )}
                <CardHeader className={cn("pb-4", pkg.popular && "bg-primary/5")}>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-2xl font-semibold text-secondary">
                    {pkg.name}
                  </h3>
                  <p className="font-body text-sm text-gray-500">{pkg.description}</p>
                  <div className="mt-2">
                    <span className="font-heading text-4xl font-bold text-primary">
                      ${pkg.price}
                    </span>
                  </div>
                  <p className="font-body text-sm text-gray-400">Serves {pkg.serving}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-6 flex-1 space-y-3">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="font-body text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={cn(
                      "w-full rounded-full",
                      pkg.popular ? "bg-primary" : "bg-secondary"
                    )}
                  >
                    <a href="#contact-form">
                      Request Catering
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {cateringFaqs.length > 0 && (
        <section className="bg-white py-16 md:py-24 lg:py-28">
          <Container>
            <div className="mb-10 text-center">
              <h2 className="font-heading text-4xl font-semibold text-secondary md:text-5xl">
                Catering FAQ
              </h2>
              <p className="mx-auto mt-3 max-w-xl font-body text-gray-500">
                Common questions about our catering services.
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {cateringFaqs.map((faq, i) => (
                  <AccordionItem key={faq.id} value={`item-${i}`}>
                    <AccordionTrigger className="text-left font-heading text-base font-semibold text-secondary hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-body text-base leading-relaxed text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Container>
        </section>
      )}

      <section id="contact-form" className="py-16 md:py-24 lg:py-28">
        <Container>
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-4xl font-semibold text-secondary md:text-5xl">
                Request Catering
              </h2>
              <p className="mx-auto mt-3 max-w-xl font-body text-gray-500">
                Tell us about your event and we&apos;ll create a custom proposal.
              </p>
            </div>
            <form className="space-y-5 rounded-2xl bg-white p-8 shadow-sm md:p-10">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-body text-sm font-medium">Name</Label>
                  <Input id="name" placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body text-sm font-medium">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-body text-sm font-medium">Phone</Label>
                <Input id="phone" type="tel" placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="font-body text-sm font-medium">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your event — date, guest count, preferences..."
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full rounded-full py-6 font-body text-base font-semibold">
                Send Request
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
