"use client";

import { useState } from "react";
import {
  CalendarDays,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Container } from "@/components/layout/container";
import { restaurantInfo } from "@/data/restaurant";
import { cn } from "@/lib/utils";

const timeOptions: string[] = [];
for (let h = 11; h <= 21; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hour = h.toString().padStart(2, "0");
    const min = m.toString().padStart(2, "0");
    timeOptions.push(`${hour}:${min}`);
  }
}

const guestOptions = Array.from({ length: 10 }, (_, i) => i + 1);

const occasionOptions = [
  "None",
  "Birthday",
  "Anniversary",
  "Business",
  "Other",
];

export default function ReservationPage() {
  const [form, setForm] = useState({
    date: "",
    time: "",
    guests: "",
    name: "",
    email: "",
    phone: "",
    occasion: "None",
    specialRequest: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = "Please select a date";
    if (!form.time) errs.time = "Please select a time";
    if (!form.guests) errs.guests = "Please select number of guests";
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email address";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setState("loading");
    await new Promise((r) => setTimeout(r, 1500));
    setState("success");
  };

  return (
    <>
      <section className="relative overflow-hidden bg-creamson py-16 md:py-24 lg:py-28">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary" />
        </div>
        <Container className="relative text-center">
          <p className="font-body text-sm font-medium uppercase tracking-widest text-primary">
            Reserve Your Table
          </p>
          <h1 className="mt-3 font-heading text-5xl font-bold text-secondary md:text-6xl lg:text-7xl">
            Make a Reservation
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-500">
            Book your dining experience at Sushimoto. We look forward to serving
            you.
          </p>
        </Container>
      </section>

      <section className="py-16 md:py-24 lg:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2">
              {state === "success" ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="font-heading text-3xl font-semibold text-secondary">
                    Reservation Confirmed!
                  </h2>
                  <p className="mt-3 max-w-md font-body text-gray-500">
                    Thank you, {form.name}! We&apos;ve received your reservation
                    request for {form.guests} guest
                    {Number(form.guests) > 1 ? "s" : ""} on {form.date} at{" "}
                    {form.time}. We&apos;ll send a confirmation to {form.email}.
                  </p>
                  <Button
                    className="mt-6 rounded-full px-8"
                    onClick={() => {
                      setState("idle");
                      setForm({
                        date: "",
                        time: "",
                        guests: "",
                        name: "",
                        email: "",
                        phone: "",
                        occasion: "None",
                        specialRequest: "",
                      });
                    }}
                  >
                    Make Another Reservation
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 rounded-2xl bg-white p-8 shadow-sm md:p-10"
                >
                  {/* Grid layout optimized with explicit sizing bounds */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="date"
                        className="font-body text-sm font-medium"
                      >
                        Date <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                        className={cn(
                          errors.date && "border-primary",
                          "w-full",
                        )}
                      />
                      {errors.date && (
                        <p className="flex items-center gap-1 text-xs text-primary">
                          <AlertCircle className="h-3 w-3" />
                          {errors.date}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="time"
                        className="font-body text-sm font-medium"
                      >
                        Time <span className="text-primary">*</span>
                      </Label>
                      <Select
                        value={form.time}
                        onValueChange={(v) => handleChange("time", v)}
                      >
                        <SelectTrigger
                          id="time"
                          className={cn(
                            errors.time && "border-primary",
                            "w-full",
                          )}
                        >
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        {/* position="popper" prevents layout jump and uses absolute positioning instead of dynamic modal layout portal overlays */}
                        <SelectContent
                          position="popper"
                          className="max-h-[300px]"
                        >
                          {timeOptions.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.time && (
                        <p className="flex items-center gap-1 text-xs text-primary">
                          <AlertCircle className="h-3 w-3" />
                          {errors.time}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="guests"
                        className="font-body text-sm font-medium"
                      >
                        Guests <span className="text-primary">*</span>
                      </Label>
                      <Select
                        value={form.guests}
                        onValueChange={(v) => handleChange("guests", v)}
                      >
                        <SelectTrigger
                          id="guests"
                          className={cn(
                            errors.guests && "border-primary",
                            "w-full",
                          )}
                        >
                          <SelectValue placeholder="Number of guests" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          className="max-h-[300px]"
                        >
                          {guestOptions.map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n} {n === 1 ? "Guest" : "Guests"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.guests && (
                        <p className="flex items-center gap-1 text-xs text-primary">
                          <AlertCircle className="h-3 w-3" />
                          {errors.guests}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="font-body text-sm font-medium"
                      >
                        Name <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className={cn(
                          errors.name && "border-primary",
                          "w-full",
                        )}
                      />
                      {errors.name && (
                        <p className="flex items-center gap-1 text-xs text-primary">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="font-body text-sm font-medium"
                      >
                        Email <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={cn(
                          errors.email && "border-primary",
                          "w-full",
                        )}
                      />
                      {errors.email && (
                        <p className="flex items-center gap-1 text-xs text-primary">
                          <AlertCircle className="h-3 w-3" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="font-body text-sm font-medium"
                      >
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="occasion"
                        className="font-body text-sm font-medium"
                      >
                        Occasion
                      </Label>
                      <Select
                        value={form.occasion}
                        onValueChange={(v) => handleChange("occasion", v)}
                      >
                        <SelectTrigger id="occasion" className="w-full">
                          <SelectValue placeholder="Select occasion" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          className="max-h-[300px]"
                        >
                          {occasionOptions.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="specialRequest"
                      className="font-body text-sm font-medium"
                    >
                      Special Requests
                    </Label>
                    <Textarea
                      id="specialRequest"
                      placeholder="Dietary restrictions, allergies, seating preferences..."
                      value={form.specialRequest}
                      onChange={(e) =>
                        handleChange("specialRequest", e.target.value)
                      }
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={state === "loading"}
                    className="w-full rounded-full py-6 font-body text-base font-semibold"
                  >
                    {state === "loading" ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-5 w-5 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Confirm Reservation"
                    )}
                  </Button>
                </form>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-heading text-xl font-semibold text-secondary">
                  Restaurant Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-body text-sm font-semibold text-secondary">
                        Hours
                      </p>
                      {restaurantInfo.hours.map((h) => (
                        <p
                          key={h.day}
                          className="font-body text-sm text-gray-500"
                        >
                          {h.day}: {h.hours}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-body text-sm font-semibold text-secondary">
                        Phone
                      </p>
                      <p className="font-body text-sm text-gray-500">
                        {restaurantInfo.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-body text-sm font-semibold text-secondary">
                        Email
                      </p>
                      <p className="font-body text-sm text-gray-500">
                        {restaurantInfo.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-body text-sm font-semibold text-secondary">
                        Address
                      </p>
                      <p className="font-body text-sm text-gray-500">
                        {restaurantInfo.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-primary p-6 text-white">
                <h3 className="mb-2 font-heading text-xl font-semibold">
                  Need Help?
                </h3>
                <p className="mb-4 font-body text-sm text-white/80">
                  Call us directly for assistance with your reservation.
                </p>
                <a
                  href={`tel:${restaurantInfo.phone}`}
                  className="inline-flex items-center gap-2 font-body text-sm font-semibold underline underline-offset-4"
                >
                  <Phone className="h-4 w-4" />
                  {restaurantInfo.phone}
                </a>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
