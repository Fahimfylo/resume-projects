"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogOverlay, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";

export default function AuthModal() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await register(name, email, password);
    if (!result.ok) {
      setError(result.error || "Registration failed");
      setLoading(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90">
          Access Platform <ArrowRight className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogOverlay className="bg-black/60" />
      <DialogContent className="bg-transparent border-0 shadow-none p-0 gap-0 max-w-md w-fit [&>button]:hidden">
        <div className="rounded-xl border border-white/10 bg-[#0A0C16] p-6">
          <h2 className="text-xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Register to access the AegisCore platform
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-white">Full Name</Label>
              <Input
                id="modal-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-white">Email</Label>
              <Input
                id="modal-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-password" className="text-white">Password</Label>
              <Input
                id="modal-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
