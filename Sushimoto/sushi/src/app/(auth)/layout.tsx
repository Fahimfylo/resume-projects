import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-creamson relative">
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center hover:bg-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-secondary" />
      </Link>
      {children}
    </div>
  );
}
