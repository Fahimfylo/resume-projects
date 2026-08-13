
"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import { User, Shield, Lock, Database, Save, RefreshCcw, Download, Terminal, Camera, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "from-primary to-accent",
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500",
];

function getAvatarColor(id: string) {
  const index = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColors[index % avatarColors.length];
}

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProfile({ name, image });
    if (result.ok) {
      toast({
        title: "Configuration Updated",
        description: "Your security preferences have been synchronized with the AegisCore cloud.",
      });
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Something went wrong.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const handleExport = () => {
    toast({
      title: "Export Initiated",
      description: "Preparing your tactical configuration and logs for download...",
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Manage your agent profile and defensive telemetry configurations.</p>
        </div>

        <div className="grid gap-8">
          {/* Profile Section */}
          <Card className="glass-dark border-white/5">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="relative group">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getAvatarColor(user?.id || "")} flex items-center justify-center text-white font-bold text-lg overflow-hidden`}>
                  {user?.image || image ? (
                    <img src={image || user?.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user?.name || "U")
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div>
                <CardTitle className="text-xl">Agent Profile</CardTitle>
                <CardDescription>Update your tactical information and identifiers.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Display Name</Label>
                  <Input
                    id="agent-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-id">Tactical ID</Label>
                  <Input id="agent-id" value={user?.id || ""} readOnly className="bg-white/5 border-white/10 text-muted-foreground font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Encrypted Communication Email</Label>
                <Input id="email" type="email" value={user?.email || ""} readOnly className="bg-white/5 border-white/10" />
              </div>
            </CardContent>
          </Card>

          {/* Defense Configuration */}
          <Card className="glass-dark border-white/5">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl">Defense Engine</CardTitle>
                <CardDescription>Configure AI sensitivity and heuristic thresholds.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aggressive Heuristics</Label>
                  <p className="text-xs text-muted-foreground">Enable deep binary analysis for non-standard MIME types.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>GenAI Threat Labeling</Label>
                  <p className="text-xs text-muted-foreground">Automatically categorize detected threats using LLM insights.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Scanning Depth</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light (Fast)</SelectItem>
                    <SelectItem value="medium">Standard (Recommended)</SelectItem>
                    <SelectItem value="deep">Deep (Hardware Intensive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Export & Backup */}
          <Card className="glass-dark border-white/5">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Database className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Data & Export</CardTitle>
                <CardDescription>Download your scan history and environment configs.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Export Platform State</p>
                  <p className="text-xs text-muted-foreground">Generate a portable package of your current code and assets.</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="border-white/10 hover:bg-white/5 gap-2">
                  <Download className="w-4 h-4" /> Export Project
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="space-y-1">
                  <p className="text-sm font-medium">CLI Integration</p>
                  <p className="text-xs text-muted-foreground">Get a token to connect your local terminal via Aegis-CLI.</p>
                </div>
                <Button variant="ghost" className="text-xs font-mono text-muted-foreground">
                  <Terminal className="w-4 h-4 mr-2" /> Generate Token
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dangerous Zone */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Lock className="w-5 h-5" /> Critical Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Purge Local Scan Cache</p>
                  <p className="text-xs text-muted-foreground">Permanently delete all temporary local scan artifacts.</p>
                </div>
                <Button variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10">Purge Data</Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">End Session</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account and return to the landing page.</p>
                </div>
                <Button onClick={logout} variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10 gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-12">
            <Button variant="ghost" className="text-muted-foreground">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 min-w-[120px]">
              {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
