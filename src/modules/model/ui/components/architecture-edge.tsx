import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { memo } from "react";
import {
  getEdgeVisual,
  getRelationshipTypeInfo,
} from "../helpers/relationship";
import type { RelationshipEdgeData } from "../stores/canvas";

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="10"
      refY="5"
      markerWidth="8"
      markerHeight="8"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  );
}

function OpenArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="10"
      refY="5"
      markerWidth="8"
      markerHeight="8"
      orient="auto-start-reverse"
    >
      <path
        d="M 0 0 L 10 5 L 0 10"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </marker>
  );
}

function DiamondMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 12 12"
      refX="12"
      refY="6"
      markerWidth="10"
      markerHeight="10"
      orient="auto-start-reverse"
    >
      <path d="M 0 6 L 6 0 L 12 6 L 6 12 z" fill={color} />
    </marker>
  );
}

function getMarkerId(type: string, edgeId: string, position: "end" | "start") {
  return `${edgeId}-${type}-${position}`;
}

function ArchitectureEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<Edge<RelationshipEdgeData>>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const spec =
    data?.relationshipType && !data.hierarchy
      ? getEdgeVisual(data.relationshipType)
      : null;

  const edgeLabel = data?.hierarchy
    ? ""
    : data?.name?.trim() ||
      (data?.relationshipType
        ? getRelationshipTypeInfo(data.relationshipType).label
        : "");

  const strokeColor = spec?.strokeColor ?? "#94a3b8";
  const strokeWidth = selected
    ? (spec?.strokeWidth ?? 1.5) + 1
    : (spec?.strokeWidth ?? 1.5);
  const strokeDash = spec?.strokeDash ?? "0";
  const arrowEnd = data?.hierarchyArrow
    ? "open-arrow"
    : (spec?.arrowEnd ?? "none");

  const endMarkerId =
    arrowEnd !== "none" ? getMarkerId(arrowEnd, id, "end") : undefined;

  return (
    <>
      <svg
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          {arrowEnd === "arrow" && endMarkerId && (
            <ArrowMarker id={endMarkerId} color={strokeColor} />
          )}
          {arrowEnd === "open-arrow" && endMarkerId && (
            <OpenArrowMarker id={endMarkerId} color={strokeColor} />
          )}
          {arrowEnd === "diamond" && endMarkerId && (
            <DiamondMarker id={endMarkerId} color={strokeColor} />
          )}
        </defs>
      </svg>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: strokeDash === "none" ? undefined : strokeDash,
        }}
        markerEnd={endMarkerId ? `url(#${endMarkerId})` : undefined}
      />

      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="absolute pointer-events-none nodrag nopan"
          >
            <span
              className="rounded px-1 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "hsl(var(--background))",
                color: strokeColor,
                border: `1px solid ${strokeColor}`,
              }}
            >
              {edgeLabel}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const ArchitectureEdge = memo(ArchitectureEdgeComponent);
