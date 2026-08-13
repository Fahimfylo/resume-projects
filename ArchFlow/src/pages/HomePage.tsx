import React, { useEffect } from 'react';
import { HomeNav } from '../components/home/HomeNav';
import { HomeHero } from '../components/home/HomeHero';
import { HowItWorks } from '../components/home/HowItWorks';
import { StatsBand } from '../components/home/StatsBand';
import { FeatureGrid } from '../components/home/FeatureGrid';
import { RadialDiagram } from '../components/home/RadialDiagram';
import { ProblemSolution } from '../components/home/ProblemSolution';
import { FaqAccordion } from '../components/home/FaqAccordion';
import { FinalCta } from '../components/home/FinalCta';
import { HomeFooter } from '../components/home/HomeFooter';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export const HomePage: React.FC = () => {
  useThemeStore((s) => s.theme);

  useEffect(() => {
    const { status, init } = useAuthStore.getState();
    if (status === 'idle') init();
  }, []);

  useEffect(() => {
    document.title = 'ArchFlow — Visual architecture maps for real codebases';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'ArchFlow turns codebases into interactive architecture maps — every connection explained by evidence.');
  }, []);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-1)] select-none">
      <HomeNav />
      <main className="overflow-hidden">
        <HomeHero />
        <HowItWorks />
        <StatsBand />
        <FeatureGrid />
        <RadialDiagram />
        <ProblemSolution />
        <FaqAccordion />
        <FinalCta />
      </main>
      <HomeFooter />
    </div>
  );
};
