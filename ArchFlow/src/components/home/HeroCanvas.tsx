import React, { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { EntityNode } from '../canvas/nodes/EntityNode';
import { RelationshipEdge } from '../canvas/edges/RelationshipEdge';
import { NEXUS_GRAPH_NODES, NEXUS_GRAPH_EDGES } from '../../data/homepageGraph';

const nodeTypes = { entityNode: EntityNode };
const edgeTypes = { relationshipEdge: RelationshipEdge };

const HeroCanvasInner: React.FC = () => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.25, duration: 700 }), 80);
    return () => clearTimeout(timer);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={NEXUS_GRAPH_NODES}
      edges={NEXUS_GRAPH_EDGES}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{ type: 'relationshipEdge' }}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={1.6}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      proOptions={{ hideAttribution: false }}
      className="homepage-hero-canvas h-full w-full bg-[var(--bg-canvas)]"
    >
      <Background
        variant={BackgroundVariant.Dots}
        color="var(--bg-hover-strong)"
        gap={20}
        size={1.5}
      />
      <Controls
        className="!bg-[var(--bg-overlay)]/90 !border-[var(--border-3)] !rounded-xl !p-1 shadow-2xl !text-[var(--text-2)] backdrop-blur-md"
        showInteractive={false}
      />
    </ReactFlow>
  );
};

export const HeroCanvas: React.FC = () => (
  <ReactFlowProvider>
    <HeroCanvasInner />
  </ReactFlowProvider>
);
