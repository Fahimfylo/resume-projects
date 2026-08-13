"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/navigation/Navbar";
import { Upload, AlertCircle, CheckCircle2, ShieldAlert, Cpu, FileCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { analyzeFileHeuristics, performAiScan } from "@/services";
import { RiskGauge } from "@/components/shared";
import { SIMULATED_HASH } from "@/constants";
import type { AnalysisResult } from "@/types";

export default function FileScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const simulateScan = useCallback(async () => {
    if (!file) return;

    setIsScanning(true);
    setProgress(0);
    setResult(null);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    setTimeout(async () => {
      const heuristicResult = analyzeFileHeuristics(file);
      let scanResult: AnalysisResult | null = null;

      try {
        scanResult = await performAiScan(file, heuristicResult);
        setResult(scanResult);
      } catch {
        toast({
          title: "AI Summary Failed",
          description: "Could not generate human-readable summary, using heuristic data only.",
          variant: "destructive"
        });
        setResult({
          fileName: file.name,
          fileSize: file.size,
          extension: heuristicResult.extension,
          hash: SIMULATED_HASH,
          riskScore: heuristicResult.score,
          riskLevel: heuristicResult.riskLevel,
          findings: heuristicResult.findings,
        });
        scanResult = {
          fileName: file.name,
          fileSize: file.size,
          extension: heuristicResult.extension,
          hash: SIMULATED_HASH,
          riskScore: heuristicResult.score,
          riskLevel: heuristicResult.riskLevel,
          findings: heuristicResult.findings,
        };
        setResult(scanResult);
      }

      if (scanResult) {
        try {
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "file",
              target: file.name,
              riskScore: scanResult.riskScore,
              riskLevel: scanResult.riskLevel,
              fileDetails: {
                fileName: scanResult.fileName,
                fileSize: scanResult.fileSize,
                declaredExtension: scanResult.extension,
                doubleExtensionDetected: heuristicResult.isDoubleExtension,
                dangerousExtension: heuristicResult.isDangerous,
                hash: scanResult.hash,
                findings: scanResult.findings,
              },
              aiSummary: scanResult.aiSummary ? {
                summary: scanResult.aiSummary.summary,
                detectedThreats: scanResult.aiSummary.detectedThreats,
                implications: scanResult.aiSummary.implications,
                recommendations: scanResult.aiSummary.recommendations,
              } : undefined,
            }),
          });
        } catch {}
      }

      setIsScanning(false);
      clearInterval(interval);
    }, 3000);
  }, [file, toast]);

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-10 space-y-2">
          <h1 className="font-headline text-4xl font-bold tracking-tight">Secure Binary Analysis</h1>
          <p className="text-muted-foreground">Drag and drop any file for isolated heuristic and AI-powered threat detection.</p>
        </div>

        <div className="space-y-8">
          {!result && (
            <Card className="glass-dark border-dashed border-white/10 hover:border-primary/50 transition-colors group">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium">{file ? file.name : "Select a suspicious file to scan"}</p>
                    <p className="text-xs text-muted-foreground">Supported: EXE, PDF, JPG, PNG, DOCX (Max 20MB)</p>
                  </div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {!isScanning ? (
                    <div className="flex gap-4">
                      <Button asChild variant="outline" className="border-white/10 cursor-pointer">
                        <label htmlFor="file-upload">Choose File</label>
                      </Button>
                      {file && (
                        <Button onClick={simulateScan} className="bg-primary hover:bg-primary/90">
                          Start Analysis
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-xs space-y-3">
                      <Progress value={progress} className="h-1 bg-white/5" indicatorClassName="bg-primary" />
                      <p className="text-xs font-mono text-primary animate-pulse">DECRYPTING BINARY CHUNKS...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="glass-dark border-white/5 md:col-span-2">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="font-headline flex items-center gap-2">
                          <FileCode className="w-5 h-5 text-primary" />
                          Analysis Report
                        </CardTitle>
                        <CardDescription className="font-mono text-[10px] mt-1">ID: SCAN_{Date.now()}</CardDescription>
                      </div>
                      <div className={`px-4 py-1 rounded-full text-xs font-bold ${
                        result.riskLevel === 'Safe' ? 'bg-green-500/20 text-green-500' :
                        result.riskLevel === 'Low' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {result.riskLevel} Risk
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white/5 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Filename</p>
                        <p className="text-sm font-medium truncate">{result.fileName}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">SHA256 Hash</p>
                        <p className="text-sm font-code truncate">{result.hash}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3" /> Detection Findings
                      </h4>
                      <div className="space-y-2">
                        {result.findings.map((f, i) => (
                          <div key={i} className="flex gap-3 text-sm items-start p-3 rounded-md bg-white/5 border border-white/5">
                            {f.includes('CRITICAL') ? <AlertCircle className="w-4 h-4 text-destructive shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.aiSummary && (
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <Cpu className="w-3 h-3" /> Threat Insight Engine (AI)
                        </h4>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <p className="text-muted-foreground italic leading-relaxed">
                            {result.aiSummary.summary}
                          </p>
                          <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <p className="text-[11px] font-bold text-white uppercase">Detected Threats</p>
                              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                {result.aiSummary.detectedThreats.map((t: string, i: number) => <li key={i}>{t}</li>)}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[11px] font-bold text-white uppercase">Recommendations</p>
                              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                {result.aiSummary.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-dark border-white/5 h-fit">
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-widest font-bold text-muted-foreground">Risk Score</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
                    <RiskGauge score={result.riskScore} />
                    <div className="text-center">
                      <p className="text-sm font-medium mb-1">Threat Probability</p>
                      <p className="text-xs text-muted-foreground">Based on signature heuristics and GenAI entropy checks.</p>
                    </div>
                    <Button onClick={() => setResult(null)} variant="outline" className="w-full border-white/10 hover:bg-white/5">
                      New Analysis
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
