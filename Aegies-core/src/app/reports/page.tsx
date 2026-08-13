"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/navigation/Navbar";
import { Search, Download, Trash2, FileText, Globe, Trash, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface HistoryRecord {
  _id: string;
  type: "file" | "url";
  target: string;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

export default function Reports() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchHistory = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?limit=${PAGE_SIZE}&skip=${pageNum * PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        setTotal(data.total);
        setPage(pageNum);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load scan history.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHistory(0);
  }, [fetchHistory]);

  const toggleAll = () => {
    if (selected.size === records.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.map((r) => r._id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        toast({ title: "Deleted", description: `${selected.size} record(s) removed.` });
        setSelected(new Set());
        fetchHistory(page);
      } else {
        toast({ title: "Error", description: "Failed to delete records.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete records.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const deleteOne = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Record removed." });
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
        fetchHistory(page);
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline text-3xl font-bold">Encrypted Scan Archive</h1>
            <p className="text-muted-foreground">
              Historical analysis reports and telemetry data. {total > 0 && `(${total} total)`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <Button
                onClick={deleteSelected}
                disabled={deleting}
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Trash className="w-4 h-4 mr-1" />
                )}
                Delete {selected.size}
              </Button>
            )}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search target..." className="pl-10 bg-white/5 border-white/10" />
            </div>
          </div>
        </div>

        {loading && records.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-3xl leading-relaxed max-w-4xl mx-auto px-4">
            No scan records yet. Run a file or URL scan to populate your history.
          </div>
        ) : (
          <Card className="glass-dark border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === records.length}
                      onCheckedChange={toggleAll}
                      className="border-white/30"
                    />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date Analyzed</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((item) => (
                  <TableRow key={item._id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <Checkbox
                        checked={selected.has(item._id)}
                        onCheckedChange={() => toggleOne(item._id)}
                        className="border-white/30"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.type === "file" ? (
                          <FileText className="w-3 h-3 text-primary" />
                        ) : (
                          <Globe className="w-3 h-3 text-accent" />
                        )}
                        <span className="capitalize text-xs">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs">{item.target}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.riskLevel === "Safe"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : item.riskLevel === "Low"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : item.riskLevel === "Medium"
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            : item.riskLevel === "High"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }
                      >
                        {item.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-xs">{item.riskScore}/100</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 rounded-md hover:bg-white/10 transition-colors">
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteOne(item._id)}
                          className="p-2 rounded-md hover:bg-destructive/10 transition-colors group"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground">
                  Showing {(page * PAGE_SIZE) + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchHistory(page - 1)}
                    disabled={page === 0}
                    className="p-2 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => fetchHistory(i)}
                      className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                        i === page
                          ? "bg-primary text-white"
                          : "text-muted-foreground hover:bg-white/10"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchHistory(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
