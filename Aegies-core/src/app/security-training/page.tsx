"use client";

import { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import {
  Shield, BookOpen, AlertTriangle, CheckCircle2, XCircle,
  Brain, ArrowRight, RefreshCw, GraduationCap, Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PHISHING_SIMULATIONS, QUIZ_QUESTIONS,
  getRandomSimulations, getRandomQuestions, calculateTrainingScore,
} from "@/services/security/training/simulations";
import type { PhishingSimulation, QuizQuestion } from "@/types/security/training";

type Phase = 'menu' | 'phishing-test' | 'quiz' | 'results';

export default function SecurityTraining() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [simulations, setSimulations] = useState<PhishingSimulation[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentSimIndex, setCurrentSimIndex] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [simResults, setSimResults] = useState<{ id: string; isPhishing: boolean; userAnswer: boolean }[]>([]);
  const [quizResults, setQuizResults] = useState<{ id: string; selectedAnswer: number }[]>([]);
  const [finalScore, setFinalScore] = useState<ReturnType<typeof calculateTrainingScore> | null>(null);
  const [revealSim, setRevealSim] = useState(false);

  const startTraining = () => {
    const sims = getRandomSimulations(3);
    const qs = getRandomQuestions(5);
    setSimulations(sims);
    setQuestions(qs);
    setSimResults([]);
    setQuizResults([]);
    setCurrentSimIndex(0);
    setCurrentQIndex(0);
    setFinalScore(null);
    setRevealSim(false);
    setPhase('phishing-test');
  };

  const answerSim = (userAnswer: boolean) => {
    setSimResults(prev => [
      ...prev,
      { id: simulations[currentSimIndex].id, isPhishing: simulations[currentSimIndex].isPhishing, userAnswer },
    ]);
    setRevealSim(true);
  };

  const nextSim = () => {
    setRevealSim(false);
    if (currentSimIndex + 1 < simulations.length) {
      setCurrentSimIndex(prev => prev + 1);
    } else {
      setPhase('quiz');
    }
  };

  const answerQuiz = (selectedAnswer: number) => {
    setQuizResults(prev => [...prev, { id: questions[currentQIndex].id, selectedAnswer }]);
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      finishTraining();
    }
  };

  const finishTraining = () => {
    const score = calculateTrainingScore(simResults, quizResults);
    setFinalScore(score);
    setPhase('results');
  };

  const currentSim = simulations[currentSimIndex];
  const currentQuestion = questions[currentQIndex];
  const simProgress = ((currentSimIndex + 1) / simulations.length) * 50;
  const quizProgress = ((currentQIndex) / questions.length) * 50;

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-10 space-y-2">
          <h1 className="font-headline text-3xl font-bold">Security Awareness Training</h1>
          <p className="text-muted-foreground">Learn to identify phishing, social engineering, and security threats</p>
        </div>

        {phase === 'menu' && (
          <div className="space-y-6">
            <Card className="glass-dark border-white/5">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-headline font-bold">Interactive Security Training</h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    Test your ability to identify phishing emails and answer security questions.
                    Each session includes 3 phishing simulations and 5 quiz questions.
                  </p>
                </div>
                <Button onClick={startTraining} className="bg-primary hover:bg-primary/90">
                  Start Training Session <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="glass-dark border-white/5">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
                  <h3 className="font-bold text-sm">Phishing Detection</h3>
                  <p className="text-xs text-muted-foreground mt-1">Identify real vs phishing emails</p>
                </CardContent>
              </Card>
              <Card className="glass-dark border-white/5">
                <CardContent className="p-6 text-center">
                  <Brain className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-bold text-sm">Security Knowledge</h3>
                  <p className="text-xs text-muted-foreground mt-1">Test your cybersecurity IQ</p>
                </CardContent>
              </Card>
              <Card className="glass-dark border-white/5">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-sm">Learn by Doing</h3>
                  <p className="text-xs text-muted-foreground mt-1">AI explains each answer</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {phase === 'phishing-test' && currentSim && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Progress value={simProgress} className="h-1.5 flex-1 bg-white/5" indicatorClassName="bg-primary" />
              <span className="text-xs text-muted-foreground shrink-0">
                Email {currentSimIndex + 1} of {simulations.length}
              </span>
            </div>

            <Card className="glass-dark border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle className="font-headline text-lg">Is this a phishing email?</CardTitle>
                  <Badge className={cn(
                    'ml-auto',
                    currentSim.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    currentSim.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    {currentSim.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">From: <span className="text-white">{currentSim.emailSender}</span></span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Subject: <span className="text-white font-medium">{currentSim.emailSubject}</span>
                  </div>
                  <div className="border-t border-white/5 pt-3 mt-3">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {currentSim.emailBody}
                    </p>
                  </div>
                </div>

                {!revealSim ? (
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => answerSim(true)}
                      variant="outline"
                      className="border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Phishing
                    </Button>
                    <Button
                      onClick={() => answerSim(false)}
                      variant="outline"
                      className="border-green-500/30 hover:bg-green-500/10 hover:text-green-400"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Legitimate
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={cn(
                      'p-4 rounded-lg border',
                      currentSim.isPhishing ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        {currentSim.isPhishing ? (
                          <><AlertTriangle className="w-5 h-5 text-red-400" /><span className="font-bold text-red-400">This is a PHISHING email</span></>
                        ) : (
                          <><CheckCircle2 className="w-5 h-5 text-green-400" /><span className="font-bold text-green-400">This is a LEGITIMATE email</span></>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{currentSim.explanation}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Key Indicators:</p>
                      <ul className="space-y-1">
                        {currentSim.indicators.map((ind, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button onClick={nextSim} className="w-full bg-primary hover:bg-primary/90">
                      {currentSimIndex + 1 < simulations.length ? 'Next Email' : 'Start Quiz'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {phase === 'quiz' && currentQuestion && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Progress value={50 + quizProgress} className="h-1.5 flex-1 bg-white/5" indicatorClassName="bg-accent" />
              <span className="text-xs text-muted-foreground shrink-0">
                Question {currentQIndex + 1} of {questions.length}
              </span>
            </div>

            <Card className="glass-dark border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-accent" />
                  <CardTitle className="font-headline text-lg">Security Knowledge Quiz</CardTitle>
                  <Badge className="ml-auto bg-white/5 text-muted-foreground">{currentQuestion.category.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-medium">{currentQuestion.question}</p>
                <div className="space-y-2">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => answerQuiz(i)}
                      className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all text-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(phase === 'results' && finalScore) && (
          <div className="space-y-6">
            <Card className="glass-dark border-white/5">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4
                  ${finalScore.score >= 80 ? 'bg-green-500/20' : finalScore.score >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'}
                ">
                  <Trophy className={cn(
                    'w-10 h-10',
                    finalScore.score >= 80 ? 'text-green-400' : finalScore.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                  )} />
                </div>
                <h2 className="text-2xl font-headline font-bold">Training Complete</h2>
                <div className="flex items-baseline justify-center gap-1 mt-4">
                  <span className="text-5xl font-headline font-bold">{finalScore.score}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {finalScore.correctAnswers} of {finalScore.totalQuestions} correct
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="glass-dark border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-headline">Phishing Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{finalScore.simulationsCorrect}/{finalScore.simulationsAnswered}</span>
                    <span className="text-xs text-muted-foreground">emails identified correctly</span>
                  </div>
                  <Progress
                    value={finalScore.simulationsAnswered > 0
                      ? (finalScore.simulationsCorrect / finalScore.simulationsAnswered) * 100
                      : 0
                    }
                    className="h-1.5 mt-2 bg-white/5"
                    indicatorClassName="bg-primary"
                  />
                </CardContent>
              </Card>

              <Card className="glass-dark border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-headline">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(finalScore.categories).map(([cat, data]) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{cat.replace('_', ' ')}</span>
                      <span className="font-medium">{(data as { correct: number; total: number }).correct}/{(data as { correct: number; total: number }).total}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Button onClick={startTraining} className="w-full bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 mr-2" /> Take New Session
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
