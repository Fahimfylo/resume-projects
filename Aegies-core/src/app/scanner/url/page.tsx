"use client";

import { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import { Search, Globe, ShieldCheck, ShieldAlert, ExternalLink, RefreshCw, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiUrlRiskAssessment, AiUrlRiskAssessmentOutput } from "@/ai/flows/ai-url-risk-assessment";
import { useToast } from "@/hooks/use-toast";
import { RiskGauge } from "@/components/shared";

export default function UrlScanner() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AiUrlRiskAssessmentOutput | null>(null);
  const { toast } = useToast();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsScanning(true);
    setResult(null);

    try {
      const scanResult = await aiUrlRiskAssessment({ url });
      setResult(scanResult);

      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "url",
            target: url,
            riskScore: scanResult.riskScore.score,
            riskLevel: scanResult.riskScore.level,
            urlDetails: {
              overallAssessment: scanResult.overallAssessment,
              phishingThreats: scanResult.phishingThreats,
              domainReputation: scanResult.domainReputation,
              defensiveActions: scanResult.defensiveActions,
            },
          }),
        });
      } catch {}
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "There was an error analyzing the URL. Please ensure it is a valid format.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-10 space-y-2">
          <h1 className="font-headline text-4xl font-bold tracking-tight">IntelliLink Scan Tool</h1>
          <p className="text-muted-foreground">AI-powered reputation analysis and phishing detection for suspicious web destinations.</p>
        </div>

        <Card className="glass-dark border-white/5 mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://suspicious-link.com/secure-login"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary transition-all"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isScanning || !url} 
                className="h-12 px-8 bg-primary hover:bg-primary/90 min-w-[140px]"
              >
                {isScanning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>Scan URL <Search className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 glass-dark border-white/5">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline text-xl">Assessment Report</CardTitle>
                    <CardDescription className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-md">
                      Target: <span className="text-primary truncate">{url}</span>
                    </CardDescription>
                  </div>
                  <div className={`px-4 py-1 rounded-full text-xs font-bold ${
                    result.riskScore.level === 'Safe' ? 'bg-green-500/20 text-green-500' :
                    result.riskScore.level === 'Low' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {result.riskScore.level}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
                    <Cpu className="w-3 h-3" /> GenAI Summary
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    {result.overallAssessment}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ShieldAlert className="w-3 h-3 text-destructive" /> Phishing Threats
                    </h4>
                    {result.phishingThreats.length > 0 ? (
                      <ul className="space-y-2">
                        {result.phishingThreats.map((threat, i) => (
                          <li key={i} className="text-xs flex gap-2 items-start text-muted-foreground">
                            <span className="w-1 h-1 rounded-full bg-destructive mt-1.5 shrink-0" />
                            {threat}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-green-500 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" /> No immediate phishing patterns detected.
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3 text-primary" /> Domain Reputation
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.domainReputation}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Recommended Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.defensiveActions.map((action, i) => (
                      <div key={i} className="px-3 py-1.5 rounded bg-white/5 text-[11px] border border-white/5 text-muted-foreground">
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-white/5 h-fit">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Threat Radar</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center p-6 space-y-6">
                <RiskGauge score={result.riskScore.score} />
                
                <div className="w-full space-y-4">
                   <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-xs font-medium">Risk Level</span>
                    <span className={`text-xs font-bold ${result.riskScore.score > 50 ? 'text-destructive' : 'text-primary'}`}>{result.riskScore.level}</span>
                  </div>
                  <Button asChild variant="outline" className="w-full border-white/10 hover:bg-white/5 text-xs h-10">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      Visit Site (Risk Warning) <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
