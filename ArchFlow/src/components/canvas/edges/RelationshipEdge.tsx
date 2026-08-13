import React, { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import { Scissors } from 'lucide-react';
import { RelationshipEdgeData } from '../../../types';
import { useCanvasStore } from '../../../store/useCanvasStore';

// Distinct colour per relationship type so different connection kinds are
// instantly distinguishable. `stroke` is the resting line colour, `selected`
// the brighter hover/selection variant, and `label` tints the on-edge badge.
const REL_STYLES: Record<
  string,
  { stroke: string; selected: string; label: { border: string; bg: string; text: string } }
> = {
  IMPORTS: { stroke: '#60a5fa', selected: '#93c5fd', label: { border: 'rgba(96,165,250,0.45)', bg: 'rgba(96,165,250,0.12)', text: '#93c5fd' } },
  CALLS: { stroke: '#34d399', selected: '#6ee7b7', label: { border: 'rgba(52,211,153,0.45)', bg: 'rgba(52,211,153,0.12)', text: '#6ee7b7' } },
  ROUTES_TO: { stroke: '#2dd4bf', selected: '#5eead4', label: { border: 'rgba(45,212,191,0.45)', bg: 'rgba(45,212,191,0.12)', text: '#5eead4' } },
  USES: { stroke: '#a78bfa', selected: '#c4b5fd', label: { border: 'rgba(167,139,250,0.45)', bg: 'rgba(167,139,250,0.12)', text: '#c4b5fd' } },
  DEPENDS_ON: { stroke: '#fb7185', selected: '#fda4af', label: { border: 'rgba(251,113,133,0.45)', bg: 'rgba(251,113,133,0.12)', text: '#fda4af' } },
  READS_FROM: { stroke: '#22d3ee', selected: '#67e8f9', label: { border: 'rgba(34,211,238,0.45)', bg: 'rgba(34,211,238,0.12)', text: '#67e8f9' } },
  WRITES_TO: { stroke: '#fbbf24', selected: '#fcd34d', label: { border: 'rgba(251,191,36,0.45)', bg: 'rgba(251,191,36,0.12)', text: '#fcd34d' } },
};

export const RelationshipEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: EdgeProps<any>) => {
    const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
    const selectEdge = useCanvasStore((s) => s.selectEdge);
    const cutEdge = useCanvasStore((s) => s.cutEdge);
    const [hovered, setHovered] = useState(false);

    const isSelected = selected || selectedEdgeId === id;
    const showCut = isSelected || hovered;

    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const relType = data?.relationshipType || 'DEPENDS_ON';
    const isScopeEdge = data?.scopeEdge === true;
    const style = REL_STYLES[relType] || REL_STYLES.DEPENDS_ON;

    if (isScopeEdge) {
      return (
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: 'var(--border-strong)',
            strokeWidth: 1.5,
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
      );
    }

    return (
      <>
        {/* Invisible thick path for easier clicking */}
        <path
          d={edgePath}
          fill="none"
          strokeWidth={20}
          stroke="transparent"
          className="cursor-pointer"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            selectEdge(id);
          }}
        />

        {/* Visible Edge Line */}
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: isSelected ? style.selected : style.stroke,
            strokeWidth: isSelected ? 2.5 : 1.5,
            filter: isSelected ? `drop-shadow(0 0 3px ${style.stroke})` : undefined,
            transition: 'stroke 0.2s, stroke-width 0.2s, filter 0.2s',
          }}
        />

        {/* Relationship Label Badge + Cut Action on Edge Center */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan flex items-center gap-1"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div
              className={`cursor-pointer rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider transition-all shadow-sm ${
                isSelected ? 'ring-2' : 'hover:brightness-125'
              }`}
              style={{
                borderColor: isSelected ? style.selected : style.label.border,
                background: isSelected ? style.label.bg : style.label.bg,
                color: style.label.text,
                boxShadow: isSelected ? `0 0 0 2px ${style.stroke}55` : undefined,
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectEdge(id);
              }}
            >
              {relType}
            </div>
            {showCut && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cutEdge(id);
                }}
                title="Cut connection"
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-rose-500/50 bg-[var(--bg-overlay)] text-rose-400 shadow-lg backdrop-blur transition-all hover:scale-110 hover:border-rose-400 hover:bg-rose-500 hover:text-white"
              >
                <Scissors className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

RelationshipEdge.displayName = 'RelationshipEdge';
