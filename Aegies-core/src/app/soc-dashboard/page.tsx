"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/navigation/Navbar";
import {
  Activity, AlertTriangle, Shield, ShieldAlert, Clock,
  Bug, Network, Globe, FileWarning, Server, Users,
  ChevronDown, ChevronRight, ExternalLink, Filter,
  Loader2, RefreshCw, Search, CheckCircle2, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SocDashboardData, SocAlert, MitreAttackMapping, IncidentEvent } from "@/types/security/soc";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Safe: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-red-500/20 text-red-400',
  investigating: 'bg-yellow-500/20 text-yellow-400',
  resolved: 'bg-green-500/20 text-green-400',
  false_positive: 'bg-gray-500/20 text-gray-400',
};

const MITRE_TACTIC_COLORS: Record<string, string> = {
  'Initial Access': '#3B82F6',
  Execution: '#8B5CF6',
  Persistence: '#EC4899',
  'Privilege Escalation': '#F59E0B',
  'Defense Evasion': '#EF4444',
  'Credential Access': '#F97316',
  Discovery: '#14B8A6',
  'Lateral Movement': '#6366F1',
  Collection: '#84CC16',
  Exfiltration: '#DC2626',
  'Command and Control': '#A855F7',
};

const INCIDENT_SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export default function SocDashboard() {
  const [data, setData] = useState<SocDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/soc/dashboard');
      if (res.ok) setData(await res.json());
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredAlerts = data?.alertQueue.filter(a =>
    !severityFilter || a.riskLevel === severityFilter
  ) ?? [];

  const sortedIncidents = [...(data?.incidentTimeline ?? [])].sort(
    (a, b) => (INCIDENT_SEVERITY_ORDER[a.severity] ?? 99) - (INCIDENT_SEVERITY_ORDER[b.severity] ?? 99)
  );

  const heatmapData = data?.threatHeatmap.reduce<{ hour: string; avg: number }[]>((acc, p) => {
    const existing = acc.find(a => a.hour === `${p.hour}:00`);
    if (existing) existing.avg = (existing.avg + p.severity) / 2;
    else acc.push({ hour: `${p.hour}:00`, avg: p.severity });
    return acc;
  }, []) ?? [];

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Activity className="w-6 h-6 text-primary" />
              <h1 className="font-headline text-3xl font-bold">SOC Dashboard</h1>
              <Badge className="bg-primary/20 text-primary border-primary/30">Security Operations Center</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Real-time security monitoring & incident response platform
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRefreshing(true); fetchData(true); }}
              disabled={refreshing}
              className="border-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : data ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Card className="glass-dark border-white/5 col-span-1">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-headline text-red-400">{data.summary.criticalAlerts}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical</p>
                </CardContent>
              </Card>
              <Card className="glass-dark border-white/5 col-span-1">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-headline text-orange-400">{data.summary.highAlerts}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">High</p>
                </CardContent>
              </Card>
              <Card className="glass-dark border-white/5 col-span-1">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-headline text-yellow-400">{data.summary.mediumAlerts}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Medium</p>
                </CardContent>
              </Card>
              <Card className="glass-dark border-white/5 col-span-1">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-headline text-blue-400">{data.summary.lowAlerts}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Low</p>
                </CardContent>
              </Card>
              <Card className="glass-dark border-white/5 col-span-1">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-headline text-primary">{data.summary.activeIncidents}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
                </CardContent>
              </Card>
              <Card className="glass-dark border-white/5 col-span-1">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-headline text-green-400">{data.summary.resolvedToday}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resolved</p>
                </CardContent>
              </Card>
              <Card className="glass-dark border-white/5 col-span-1">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-headline text-accent">{data.summary.averageResponseTime}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Response</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* A. Alert Queue */}
              <Card className="lg:col-span-2 glass-dark border-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Alert Queue
                    </CardTitle>
                    <CardDescription>{filteredAlerts.length} alerts</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {[null, 'Critical', 'High', 'Medium', 'Low'].map(s => (
                      <button
                        key={s || 'all'}
                        onClick={() => setSeverityFilter(s)}
                        className={cn(
                          'px-2 py-1 text-[10px] rounded font-medium transition-colors',
                          severityFilter === s ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                        )}
                      >
                        {s || 'ALL'}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
                  {filteredAlerts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No alerts match filter</p>
                  ) : (
                    filteredAlerts.slice(0, 20).map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          alert.riskLevel === 'Critical' ? 'bg-red-500' : alert.riskLevel === 'High' ? 'bg-orange-500' : 'bg-yellow-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium truncate">{alert.description}</span>
                            <Badge className={cn('text-[10px] px-1.5 py-0 border', SEVERITY_COLORS[alert.riskLevel])}>
                              {alert.riskLevel}
                            </Badge>
                            <Badge className={cn('text-[10px] px-1.5 py-0', STATUS_COLORS[alert.status])}>
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {alert.target} · {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold font-mono">{alert.riskScore}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* B. MITRE ATT&CK Mapping */}
              <Card className="glass-dark border-white/5">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Bug className="w-5 h-5 text-accent" />
                    MITRE ATT&CK
                  </CardTitle>
                  <CardDescription>{data.summary.mitreTacticsCovered}/11 tactics mapped</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.mitreMapping.slice(0, 8).map(mapping => (
                    <div key={mapping.id} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: MITRE_TACTIC_COLORS[mapping.tactic] || '#666' }}
                          />
                          <span className="text-xs font-medium truncate">{mapping.techniqueId}</span>
                          <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">{mapping.techniqueName}</span>
                        </div>
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          mapping.severity === 'critical' ? 'text-red-400 bg-red-500/20' :
                          mapping.severity === 'high' ? 'text-orange-400 bg-orange-500/20' :
                          'text-yellow-400 bg-yellow-500/20'
                        )}>
                          {mapping.detectionCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{mapping.tactic}</span>
                        <span>{mapping.lastDetected ? new Date(mapping.lastDetected).toLocaleTimeString() : ''}</span>
                      </div>
                      <Progress
                        value={Math.min(mapping.detectionCount * 10, 100)}
                        className="h-1 bg-white/5"
                        indicatorClassName={cn(
                          mapping.severity === 'critical' ? 'bg-red-500' :
                          mapping.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                        )}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* C. Incident Timeline */}
              <Card className="glass-dark border-white/5">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Incident Timeline
                  </CardTitle>
                  <CardDescription>Chronological security events</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[420px] overflow-y-auto space-y-1">
                  {sortedIncidents.map(incident => (
                    <div key={incident.id}>
                      <button
                        onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                          incident.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          incident.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          incident.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        )}>
                          {incident.severity === 'critical' ? '!' : incident.severity === 'high' ? 'H' : 'M'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{incident.title}</span>
                            <Badge className={cn(
                              'text-[10px] px-1.5 py-0',
                              incident.status === 'detected' ? 'bg-red-500/20 text-red-400' :
                              incident.status === 'analyzing' ? 'bg-yellow-500/20 text-yellow-400' :
                              incident.status === 'contained' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'
                            )}>
                              {incident.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(incident.timestamp).toLocaleString()} · {incident.source}
                          </p>
                        </div>
                        {expandedIncident === incident.id ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </button>
                      {expandedIncident === incident.id && (
                        <div className="ml-11 mr-3 p-3 rounded-lg bg-white/5 border border-white/5 mb-2 space-y-2">
                          <p className="text-xs text-muted-foreground">{incident.description}</p>
                          {incident.affectedAssets.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {incident.affectedAssets.map(asset => (
                                <span key={asset} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-muted-foreground font-mono">
                                  {asset}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* D. Threat Heatmap */}
              <Card className="glass-dark border-white/5">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Server className="w-5 h-5 text-accent" />
                    Threat Activity Heatmap
                  </CardTitle>
                  <CardDescription>Attack frequency by time of day (7-day)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heatmapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis dataKey="hour" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} interval={3} />
                        <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0A0C16', borderColor: '#ffffff10', borderRadius: 8 }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                        <Bar dataKey="avg" radius={[2, 2, 0, 0]}>
                          {heatmapData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.avg > 70 ? '#EF4444' : entry.avg > 50 ? '#F97316' : entry.avg > 30 ? '#3B82F6' : '#22C55E'}
                              opacity={0.7 + (entry.avg / 100) * 0.3}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {[
                      { label: 'Low', color: 'bg-green-500' },
                      { label: 'Medium', color: 'bg-blue-500' },
                      { label: 'High', color: 'bg-orange-500' },
                      { label: 'Critical', color: 'bg-red-500' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded ${l.color}`} />
                        <span className="text-[10px] text-muted-foreground">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MITRE Techniques Full List */}
            <Card className="glass-dark border-white/5">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  MITRE ATT&CK Coverage — Techniques Detected
                </CardTitle>
                <CardDescription>All mapped techniques by tactic category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(
                    data.mitreMapping.reduce<Record<string, MitreAttackMapping[]>>((acc, m) => {
                      (acc[m.tactic] = acc[m.tactic] || []).push(m);
                      return acc;
                    }, {})
                  ).map(([tactic, techniques]) => (
                    <div key={tactic} className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: MITRE_TACTIC_COLORS[tactic] || '#666' }}
                        />
                        <span className="text-xs font-bold">{tactic}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{techniques.length}</span>
                      </div>
                      <div className="space-y-1">
                        {techniques.map(t => (
                          <div key={t.id} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">{t.techniqueId}: {t.techniqueName}</span>
                            <span className={cn(
                              'font-bold',
                              t.severity === 'critical' ? 'text-red-400' :
                              t.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'
                            )}>
                              {t.detectionCount}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            Failed to load SOC dashboard data
          </div>
        )}
      </main>
    </div>
  );
}
