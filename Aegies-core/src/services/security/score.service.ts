'use server';

import type { SecurityScoreReport, ScoreCategory, ScoreHistoryPoint } from '@/types/security/score';
import { connectDB } from '@/lib/db';
import { ScanRecord } from '@/lib/models/ScanRecord';

export async function calculateSecurityScore(userId: string): Promise<SecurityScoreReport> {
  await connectDB();
  const records = await ScanRecord.find({ userId }).sort({ createdAt: -1 }).lean();

  const totalScans = records.length;
  if (totalScans === 0) {
    return {
      overallScore: 0,
      overallGrade: 'F',
      categories: getDefaultCategories(),
      history: generateDefaultHistory(),
      recommendations: ['Run your first security scan to generate a score.'],
      lastUpdated: new Date().toISOString(),
    };
  }

  const highRiskScans = records.filter(r => ['High', 'Critical'].includes(r.riskLevel)).length;
  const mediumRiskScans = records.filter(r => r.riskLevel === 'Medium').length;
  const lowRiskScans = records.filter(r => ['Safe', 'Low'].includes(r.riskLevel)).length;

  const fileScans = records.filter(r => r.type === 'file');
  const urlScans = records.filter(r => r.type === 'url');

  // Browsing Safety (based on URL scans)
  const urlRiskSum = urlScans.reduce((s, r) => s + r.riskScore, 0);
  const avgUrlRisk = urlScans.length > 0 ? urlRiskSum / urlScans.length : 0;
  const browsingSafety = Math.round(Math.max(0, 100 - avgUrlRisk));

  // File Safety
  const fileRiskSum = fileScans.reduce((s, r) => s + r.riskScore, 0);
  const avgFileRisk = fileScans.length > 0 ? fileRiskSum / fileScans.length : 0;
  const fileSafety = Math.round(Math.max(0, 100 - avgFileRisk));

  // Exposure Level
  const exposureRatio = totalScans > 0 ? highRiskScans / totalScans : 0;
  const exposureLevel = Math.round(Math.max(0, 100 - (exposureRatio * 100)));

  // Threat Response (how many threats were detected and handled)
  const threatResponse = Math.round(
    totalScans > 0
      ? (lowRiskScans / totalScans) * 100
      : 0
  );

  // Hygiene (overall scan frequency and consistency)
  const hygiene = Math.min(100, Math.round(totalScans * 5));

  const categories: ScoreCategory[] = [
    {
      name: 'Browsing Safety',
      score: browsingSafety,
      weight: 30,
      icon: 'globe',
      details: `Based on ${urlScans.length} URL scan(s). Average risk score: ${avgUrlRisk.toFixed(1)}/100`,
    },
    {
      name: 'File Safety',
      score: fileSafety,
      weight: 30,
      icon: 'file',
      details: `Based on ${fileScans.length} file scan(s). Average risk score: ${avgFileRisk.toFixed(1)}/100`,
    },
    {
      name: 'Exposure Level',
      score: exposureLevel,
      weight: 20,
      icon: 'shield',
      details: `${highRiskScans} high/critical threats found out of ${totalScans} total scans`,
    },
    {
      name: 'Threat Response',
      score: threatResponse,
      weight: 10,
      icon: 'activity',
      details: `${lowRiskScans} safe/low items out of ${totalScans} scans (${threatResponse}%)`,
    },
    {
      name: 'Security Hygiene',
      score: hygiene,
      weight: 10,
      icon: 'check',
      details: `Based on scan frequency — ${totalScans} total scans performed`,
    },
  ];

  const overallScore = Math.round(
    categories.reduce((s, c) => s + (c.score * c.weight / 100), 0)
  );

  const overallGrade = overallScore >= 90 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 55 ? 'C' : overallScore >= 35 ? 'D' : 'F';

  const history = generateHistoryFromRecords(records);

  const recommendations: string[] = [];
  if (browsingSafety < 70) recommendations.push('Increase URL scanning to improve browsing safety');
  if (fileSafety < 70) recommendations.push('Scan more files to identify potential malware threats');
  if (exposureLevel < 50) recommendations.push('Investigate and remediate high-severity threats immediately');
  if (totalScans < 10) recommendations.push('Perform more scans to build a comprehensive security profile');
  if (recommendations.length === 0) recommendations.push('Excellent security posture — continue regular monitoring');

  return {
    overallScore,
    overallGrade,
    categories,
    history,
    recommendations,
    lastUpdated: new Date().toISOString(),
  };
}

function getDefaultCategories(): ScoreCategory[] {
  return [
    { name: 'Browsing Safety', score: 0, weight: 30, icon: 'globe', details: 'No URL scans performed yet' },
    { name: 'File Safety', score: 0, weight: 30, icon: 'file', details: 'No file scans performed yet' },
    { name: 'Exposure Level', score: 100, weight: 20, icon: 'shield', details: 'No exposure data available' },
    { name: 'Threat Response', score: 0, weight: 10, icon: 'activity', details: 'No scan data available' },
    { name: 'Security Hygiene', score: 0, weight: 10, icon: 'check', details: 'Start scanning to build your score' },
  ];
}

function generateDefaultHistory(): ScoreHistoryPoint[] {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
    score: 0,
  }));
}

function generateHistoryFromRecords(records: any[]): ScoreHistoryPoint[] {
  const now = new Date();
  const days: ScoreHistoryPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const dayRecords = records.filter(r => {
      const d = new Date(r.createdAt);
      return d >= dayStart && d < dayEnd;
    });

    const avgRisk = dayRecords.length > 0
      ? dayRecords.reduce((s: number, r: any) => s + r.riskScore, 0) / dayRecords.length
      : 0;
    const score = Math.round(Math.max(0, 100 - avgRisk));

    days.push({ date: dayStr, score });
  }

  return days;
}
