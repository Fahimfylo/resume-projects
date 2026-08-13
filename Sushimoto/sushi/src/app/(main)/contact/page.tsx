import { Phone, Mail, MapPin, Clock } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
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
import { restaurantInfo } from "@/data/restaurant";
import { faqs } from "@/data/faqs";

export const metadata: Metadata = {
  title: "Contact | Sushimoto",
};

const contactFaqs = faqs.filter(
  (f) => f.category === "general" || f.category === "reservations",
);

export default function ContactPage() {
  return (
    <>
      {/* Header Section */}
      <section className="relative overflow-hidden bg-creamson py-16 md:py-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary" />
        </div>
        <Container className="relative text-center">
          <p className="font-body text-sm font-semibold uppercase tracking-widest text-primary">
            We&apos;d Love to Hear From You
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-secondary md:text-5xl lg:text-6xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base text-gray-500">
            Whether you have a question about our menu, want to plan an event,
            or just want to say hello — we&apos;re here for you.
          </p>
        </Container>
      </section>

      {/* Info Cards Grid Section */}
      <section className="py-12 md:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Phone */}
            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-semibold text-secondary">
                Phone
              </h3>
              <a
                href={`tel:${restaurantInfo.phone}`}
                className="font-body text-sm text-gray-500 transition-colors hover:text-primary"
              >
                {restaurantInfo.phone}
              </a>
            </div>

            {/* Email */}
            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-semibold text-secondary">
                Email
              </h3>
              <a
                href={`mailto:${restaurantInfo.email}`}
                className="font-body text-sm text-gray-500 transition-colors hover:text-primary"
              >
                {restaurantInfo.email}
              </a>
            </div>

            {/* Address */}
            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-semibold text-secondary">
                Address
              </h3>
              <p className="font-body text-sm leading-snug text-gray-500">
                {restaurantInfo.address}
              </p>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-semibold text-secondary">
                Hours
              </h3>
              <div className="space-y-1">
                {restaurantInfo.hours.map((h) => (
                  <p
                    key={h.day}
                    className="font-body text-[13px] leading-snug text-gray-500"
                  >
                    <span className="font-semibold">{h.day}:</span> {h.hours}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Form and Map Section */}
      <section className="py-12 md:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 items-stretch">
            {/* Contact Form Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 md:p-10">
              <div>
                <h2 className="font-heading text-2xl font-bold text-secondary md:text-3xl">
                  Send Us a Message
                </h2>
                <p className="mt-2 font-body text-sm text-gray-400">
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
              <form className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="font-body text-sm font-medium text-gray-600"
                    >
                      Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      className="rounded-lg border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="font-body text-sm font-medium text-gray-600"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="rounded-lg border-gray-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="font-body text-sm font-medium text-gray-600"
                  >
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    placeholder="What's this about?"
                    className="rounded-lg border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="message"
                    className="font-body text-sm font-medium text-gray-600"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="rounded-lg border-gray-200 resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-full px-8 py-5 font-body text-sm font-semibold transition-all hover:bg-primary-dark sm:w-auto"
                >
                  Send Message
                </Button>
              </form>
            </div>

            {/* Map Placeholder Card */}
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-zinc-100 p-6 text-center shadow-sm sm:p-8 md:p-10 lg:min-h-full">
              <div className="max-w-sm px-4">
                <MapPin className="mx-auto mb-4 h-10 w-10 text-gray-400" />
                <h3 className="font-heading text-xl font-bold text-gray-700">
                  Find Us
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-gray-400">
                  {restaurantInfo.address}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-6 rounded-full border-gray-300 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
                >
                  <a
                    href={restaurantInfo.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Frequently Asked Questions Section */}
      {contactFaqs.length > 0 && (
        <section className="bg-white border-t border-gray-100 py-16 md:py-24">
          <Container>
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-secondary md:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto mt-3 max-w-xl font-body text-sm text-gray-400">
                Quick answers to common questions.
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {contactFaqs.map((faq, i) => (
                  <AccordionItem
                    key={faq.id}
                    value={`item-${i}`}
                    className="border-b border-gray-100"
                  >
                    <AccordionTrigger className="text-left font-heading text-base font-semibold text-secondary hover:text-primary hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-body text-sm leading-relaxed text-gray-500 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
