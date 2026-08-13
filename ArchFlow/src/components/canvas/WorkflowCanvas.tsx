import React, { useCallback, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { EntityNode } from './nodes/EntityNode';
import { GroupNode } from './nodes/GroupNode';
import { GroupChildNode } from './nodes/GroupChildNode';
import { RelationshipEdge } from './edges/RelationshipEdge';
import { CanvasToolbar } from './CanvasToolbar';
import { InspectorPanel } from './InspectorPanel';
import { CanvasStatusBar } from './CanvasStatusBar';
import { AddNodeModal } from './AddNodeModal';
import { AnalysisOverlay } from './AnalysisOverlay';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AbstractionLevel } from '../../types';

const nodeTypes = {
  entityNode: EntityNode,
  groupNode: GroupNode,
  groupChildNode: GroupChildNode,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

const CanvasInner: React.FC = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fitView } = useReactFlow();
  const setUrlSink = useCanvasStore((s) => s.setUrlSink);
  const lastUrl = useRef<{ pid: string | null; query: string }>({ pid: null, query: '' });
  const nodes = useCanvasStore((s) => s.renderNodes);
  const edges = useCanvasStore((s) => s.renderEdges);
  const refreshKey = useCanvasStore((s) => s.refreshKey);
  const panToNodeId = useCanvasStore((s) => s.panToNodeId);
  const focusNodeId = useCanvasStore((s) => s.focusNodeId);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const selectEdge = useCanvasStore((s) => s.selectEdge);
  const closeInspector = useCanvasStore((s) => s.closeInspector);
  const drillInto = useCanvasStore((s) => s.drillInto);
  const loadError = useCanvasStore((s) => s.loadError);

  // Store -> URL: mirror each canvas navigation into the address bar so the
  // browser back/forward buttons step through scopes and focus mode.
  useEffect(() => {
    setUrlSink((snapshot, mode) => {
      const params = new URLSearchParams();
      params.set('v', snapshot.id);
      if (snapshot.scopeCrumbId) params.set('node', snapshot.scopeCrumbId);
      if (snapshot.focusNodeId) params.set('focus', snapshot.focusNodeId);
      if (snapshot.abstractionLevel !== 'full') params.set('level', snapshot.abstractionLevel);
      lastUrl.current = { pid: projectId, query: params.toString() };
      setSearchParams(params, { replace: mode === 'replace' });
    });
  }, [setUrlSink, setSearchParams, projectId]);

  // URL -> Store: handle browser back/forward and deep links without a reload.
  useEffect(() => {
    const query = searchParams.toString();
    if (!projectId) return;
    if (lastUrl.current.pid === projectId && lastUrl.current.query === query) return;
    lastUrl.current = { pid: projectId, query };
    const store = useCanvasStore.getState();
    const v = searchParams.get('v');
    if (v && store.restoreSnapshot(v)) return;
    const node = searchParams.get('node');
    const focus = searchParams.get('focus');
    const level = searchParams.get('level');
    if (node || focus || level) {
      store.restoreUrlView(projectId, { node, focus, level: (level || null) as AbstractionLevel | null });
    } else {
      store.setProjectContext(projectId);
    }
  }, [searchParams, projectId]);

  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
    return () => clearTimeout(timer);
  }, [refreshKey, fitView]);

  useEffect(() => {
    if (!panToNodeId) return;
    const timer = setTimeout(() => {
      fitView({ nodes: [{ id: panToNodeId }], padding: 0.35, duration: 500, maxZoom: 1.1 });
    }, 100);
    return () => clearTimeout(timer);
  }, [panToNodeId, fitView]);

  // When entering Connected Nodes mode, frame the focus set so the user
  // immediately sees the nodes at a readable zoom instead of a tiny scatter.
  const prevFocusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusNodeId) {
      prevFocusRef.current = null;
      return;
    }
    if (prevFocusRef.current === focusNodeId) return;
    prevFocusRef.current = focusNodeId;
    const ids = nodes.map((n) => ({ id: n.id }));
    if (!ids.length) return;
    const timer = setTimeout(() => {
      fitView({ nodes: ids, padding: 0.3, duration: 500, maxZoom: 1.1 });
    }, 120);
    return () => clearTimeout(timer);
  }, [focusNodeId, nodes, fitView]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as { childCount?: number } | undefined;
      if (data && data.childCount && data.childCount > 0) {
        drillInto(node.id);
      }
    },
    [drillInto]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      selectEdge(edge.id);
    },
    [selectEdge]
  );

  const handlePaneClick = useCallback(() => {
    closeInspector();
  }, [closeInspector]);

  const minimapColor = (node: any) => {
    switch (node.data?.category) {
      case 'page':
        return '#3b82f6';
      case 'component':
        return '#8b5cf6';
      case 'route':
        return '#10b981';
      case 'service':
        return '#f59e0b';
      case 'model':
        return '#06b6d4';
      case 'external-api':
        return '#f43f5e';
      case 'controller':
        return '#14b8a6';
      case 'db-table':
        return '#a855f7';
      case 'store':
        return '#6366f1';
      default:
        return '#6366f1';
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--bg-app)] overflow-hidden select-none">
      {/* Top Floating Canvas Toolbar */}
      <CanvasToolbar />

      {loadError && (
        <div className="absolute left-1/2 top-16 z-30 -translate-x-1/2 rounded-xl border border-rose-500/30 bg-[var(--bg-overlay)] px-4 py-2.5 text-xs text-rose-300 shadow-2xl">
          {loadError}
        </div>
      )}

      {/* Main React Flow Canvas */}
      <div className="relative flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2.5}
          defaultEdgeOptions={{ type: 'relationshipEdge' }}
          className="bg-[var(--bg-canvas)]"
        >
          {/* Signature n8n Dot Grid Background */}
          <Background
            variant={BackgroundVariant.Dots}
            color="var(--bg-hover-strong)"
            gap={20}
            size={1.5}
          />

          {/* Canvas Navigation Controls (Bottom-left) */}
          <Controls
            className="!bg-[var(--bg-overlay)]/90 !border-[var(--border-3)] !rounded-xl !p-1 shadow-2xl !text-[var(--text-2)] backdrop-blur-md"
            showInteractive={false}
          />

          {/* Minimap (Bottom-right) */}
          <MiniMap
            zoomable
            pannable
            nodeColor={minimapColor}
            maskColor="color-mix(in srgb, var(--bg-app) 75%, transparent)"
            className="!bg-[var(--bg-card)] !border-[var(--border-3)] !rounded-xl shadow-2xl overflow-hidden hidden md:block"
          />
        </ReactFlow>

        {/* Right Inspector Panel Drawer */}
        <InspectorPanel />

        {/* Analysis progress overlay while a job runs */}
        {projectId && <AnalysisOverlay projectId={projectId} />}
      </div>

      {/* Sticky Bottom Status Bar */}
      <CanvasStatusBar />

      {/* Add Node Modal */}
      <AddNodeModal />
    </div>
  );
};

export const WorkflowCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
};
