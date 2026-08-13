"use client";

import Link from "next/link";
import { Shield, ShieldCheck, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { FEATURES, NAV_LINKS } from "@/constants";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-shield');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-dark border-b border-white/5 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-headline font-bold text-2xl tracking-tighter text-glow">
              AEGIS<span className="text-primary">CORE</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-6 text-sm font-medium text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
              ))}
            </nav>
                {user ? (
                  <Button asChild size="lg" className="h-14 px-10 bg-primary hover:bg-primary/90">
                    <Link href="/dashboard"><LayoutDashboard className="w-5 h-5 mr-2" /> Dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="h-14 px-10 bg-primary hover:bg-primary/90">
                    <Link href="/sign-up">Get Started for Free</Link>
                  </Button>
                )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-30" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 blur-[120px] rounded-full opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Now Empowered with GenAI Analysis</span>
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-bold leading-tight">
              Enterprise <span className="text-primary">Defensive</span> <br /> 
              Telemetry System
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Detect Trojans, evaluate suspicious binaries, and analyze phishing vectors with our military-grade defensive architecture.
            </p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Button asChild size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    Go to Dashboard <LayoutDashboard className="w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90">
                  <Link href="/sign-up" className="flex items-center gap-2">
                    Launch Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5">
                View Documentation
              </Button>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative glass rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src={heroImg?.imageUrl || ""} 
                alt="Cyber Defense Visualization" 
                width={1200} 
                height={800} 
                className="w-full h-auto object-cover opacity-80"
                data-ai-hint="cybersecurity shield"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background to-transparent">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-primary font-bold">Live Network Pulse</p>
                    <p className="text-lg font-headline font-bold">Threat Neutralization: 99.9%</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-6 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-10 bg-primary/60 rounded-full animate-pulse [animation-delay:200ms]" />
                    <div className="w-2 h-8 bg-primary/40 rounded-full animate-pulse [animation-delay:400ms]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="font-headline text-4xl font-bold">Shielding Your Perimeter</h2>
            <p className="text-muted-foreground">Comprehensive toolsets designed to detect cloaked malware and malicious link distributions.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <Card key={i} className="glass-dark border-white/5 hover:border-primary/50 transition-all duration-300">
                <CardContent className="pt-10 pb-8 px-8 space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="glass p-16 rounded-[2rem] border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-64 h-64 -rotate-12" />
            </div>
            <div className="relative z-10 space-y-8">
              <h2 className="font-headline text-4xl md:text-5xl font-bold">Ready to secure your uploads?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of security professionals using AegisCore to analyze potential threats in isolated environments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button asChild size="lg" className="h-14 px-10 bg-primary hover:bg-primary/90">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      Go to Dashboard <LayoutDashboard className="w-4 h-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="h-14 px-10 bg-primary hover:bg-primary/90">
                    <Link href="/sign-up" className="flex items-center gap-2">
                      Launch Dashboard <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" className="h-14 px-10 border-white/10 hover:bg-white/5">Schedule Demo</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-headline font-bold text-lg tracking-tight">AEGISCORE</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 AegisCore Defensive. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
            <Link href="#" className="hover:text-primary">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
