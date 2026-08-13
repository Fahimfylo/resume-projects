import { Zap, Globe, Lock } from "lucide-react";
import type { FeatureItem } from "@/types";

export const FEATURES: FeatureItem[] = [
  {
    title: "Secure Binary Sentry",
    desc: "Validates MIME signatures against file extensions to detect 'photo.jpg.exe' style trojans.",
    icon: Zap,
    color: "text-primary"
  },
  {
    title: "AI Risk Assessment",
    desc: "Uses advanced generative models to interpret suspicious URLs and domain history.",
    icon: Globe,
    color: "text-accent"
  },
  {
    title: "Heuristic Radar",
    desc: "Generates deep-level risk scores (0-100) based on multiple defensive detection vectors.",
    icon: Lock,
    color: "text-green-500"
  },
];

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "About", href: "#about" },
];
