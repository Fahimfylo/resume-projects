import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { EntityNodeData } from '../types';

export interface GraphNode {
  id: string;
  parentNodeId?: string | null;
  type?: string;
  isManual?: boolean;
  data: EntityNodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: { relationshipType?: string; evidence?: unknown };
  isManual?: boolean;
}

interface FullGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ModuleSummary {
  node: GraphNode;
  bucketId: string | null;
  files: GraphNode[];
  totalLines: number;
  dominantCategory: string;
}

const depthOf = (node: GraphNode, byId: Map<string, GraphNode>): number => {
  if (typeof node.data.depth === 'number') return node.data.depth;
  let depth = 0;
  let cur: GraphNode | undefined = node;
  const seen = new Set<string>();
  while (cur?.parentNodeId && byId.has(cur.parentNodeId) && !seen.has(cur.parentNodeId)) {
    seen.add(cur.parentNodeId);
    depth += 1;
    cur = byId.get(cur.parentNodeId);
  }
  return depth;
};

export function useProjectGraph() {
  const { projectId } = useParams<{ projectId: string }>();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<FullGraphResponse>(`/projects/${projectId}/graph/all`);
      setNodes(res.nodes || []);
      setEdges(res.edges || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project graph');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const data = useMemo(() => {
    const byId = new Map<string, GraphNode>();
    for (const n of nodes) byId.set(n.id, n);

    const byDepth = new Map<number, GraphNode[]>();
    for (const n of nodes) {
      const d = depthOf(n, byId);
      if (typeof n.data.depth !== 'number') n.data.depth = d;
      const arr = byDepth.get(d) || [];
      arr.push(n);
      byDepth.set(d, arr);
    }

    const buckets = byDepth.get(0) || [];
    const modules = byDepth.get(1) || [];
    const files = byDepth.get(2) || [];

    const moduleById = new Map(modules.map((m) => [m.id, m]));
    const moduleLabelOf = (nodeId: string): string | null => {
      const seen = new Set<string>();
      let cur: GraphNode | undefined = byId.get(nodeId);
      while (cur) {
        const mod = moduleById.get(cur.id);
        if (mod) return mod.data.label;
        if (!cur.parentNodeId || seen.has(cur.parentNodeId)) return null;
        seen.add(cur.parentNodeId);
        cur = byId.get(cur.parentNodeId);
      }
      return null;
    };

    const modulesByBucket = new Map<string | null, GraphNode[]>();
    for (const m of modules) {
      const key = m.parentNodeId || null;
      const arr = modulesByBucket.get(key) || [];
      arr.push(m);
      modulesByBucket.set(key, arr);
    }

    const filesByModule = new Map<string, GraphNode[]>();
    for (const f of files) {
      if (!f.parentNodeId) continue;
      const arr = filesByModule.get(f.parentNodeId) || [];
      arr.push(f);
      filesByModule.set(f.parentNodeId, arr);
    }

    const moduleSummaries: ModuleSummary[] = modules.map((m) => {
      const moduleFiles = filesByModule.get(m.id) || [];
      const counts = new Map<string, number>();
      let totalLines = 0;
      for (const f of moduleFiles) {
        const cat = f.data.category || 'component';
        counts.set(cat, (counts.get(cat) || 0) + 1);
        totalLines += f.data.stats?.lines || 0;
      }
      let dominantCategory: string = moduleFiles[0]?.data.category || 'component';
      let dominantCount = -1;
      for (const [cat, count] of counts) {
        if (count > dominantCount) {
          dominantCount = count;
          dominantCategory = cat;
        }
      }
      return {
        node: m,
        bucketId: m.parentNodeId || null,
        files: moduleFiles,
        totalLines,
        dominantCategory,
      };
    });

    const filesByModuleId = (moduleId: string) => filesByModule.get(moduleId) || [];
    const moduleOfFile = (fileId: string) =>
      nodes.find((n) => n.id === fileId)?.parentNodeId || null;

    return {
      byId,
      byDepth,
      buckets,
      modules,
      files,
      moduleSummaries,
      modulesByBucket,
      filesByModuleId,
      moduleOfFile,
      moduleLabelOf,
    };
  }, [nodes]);

  return { nodes, edges, loading, error, refresh, ...data };
}
