import type { Edge, Node, XYPosition } from "@xyflow/react";
import { canNestOnDiagram } from "../helpers/diagram";
import { getNodeTypeForElement } from "../helpers/element";
import type {
  ElementNodeData,
  RelationshipEdgeData,
} from "../stores/arch-canvas";
import type { ElementLayout } from "../types/diagram";
import type { Element } from "../types/element";
import type { RelationshipTypeValue } from "../types/relationship";

export type ArchCanvasNode = Node<ElementNodeData>;

const DEFAULT_NODE_SIZE = { width: 160, height: 60 };

/**
 * Build React Flow nodes from architecture elements + layout data.
 */
export function buildArchNodes(
  elements: Element[],
  elementLayouts: ElementLayout[],
  modelId: string,
  diagramType?: string,
): ArchCanvasNode[] {
  const layoutMap = new Map(elementLayouts.map((l) => [l.elementId, l]));

  const nodes = elements
    .filter((el) => layoutMap.has(el.id))
    .map((el): ArchCanvasNode | null => {
      const layout = layoutMap.get(el.id);
      if (!layout) return null;

      const parentElement = el.parentId
        ? elements.find((p) => p.id === el.parentId)
        : undefined;
      const isParentActor = parentElement?.type?.endsWith("Actor");
      const isSelfActor = el.type?.endsWith("Actor");

      const canNest =
        diagramType && parentElement
          ? canNestOnDiagram(el.type, parentElement.type, diagramType)
          : true;

      const effectiveParentId =
        canNest &&
        !isParentActor &&
        !isSelfActor &&
        el.parentId &&
        layoutMap.has(el.parentId)
          ? el.parentId
          : undefined;

      return {
        id: el.id,
        width: layout.size.width,
        type: getNodeTypeForElement(el.type),
        position: effectiveParentId ? { x: 0, y: 0 } : layout.position,
        parentId: effectiveParentId,
        extent: effectiveParentId ? ("parent" as const) : undefined,
        height: layout.size.height,
        zIndex: effectiveParentId ? 1 : 0,
        data: {
          name: el.name,
          elementId: el.id,
          status: el.status,
          modelId,
          elementType: el.type,
          description: el.description,
          parentId: el.parentId,
        },
      };
    })
    .filter((n): n is ArchCanvasNode => n !== null);

  // Calculate relative positions for nested children
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  for (const node of nodes) {
    if (node.parentId) {
      const parent = nodesById.get(node.parentId);
      if (parent) {
        const parentAbs =
          layoutMap.get(parent.data.elementId)?.position ?? parent.position;
        const childAbs =
          layoutMap.get(node.data.elementId)?.position ?? node.position;
        node.position = {
          x: Math.max(0, childAbs.x - parentAbs.x),
          y: Math.max(0, childAbs.y - parentAbs.y),
        };
      }
    }
  }

  return nodes;
}

/**
 * Build React Flow edges from architecture relationships.
 * Only includes edges where both source and target exist on the canvas.
 */
export type ArchCanvasEdge = Edge<RelationshipEdgeData>;

export function buildArchEdges(
  relationships: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    sourceElementId: string;
    targetElementId: string;
  }>,
  nodeIds: Set<string>,
  modelId: string,
): ArchCanvasEdge[] {
  return relationships
    .filter(
      (rel) =>
        nodeIds.has(rel.sourceElementId) && nodeIds.has(rel.targetElementId),
    )
    .map((rel) => ({
      id: rel.id,
      type: "architecture-edge" as const,
      source: rel.sourceElementId,
      target: rel.targetElementId,
      data: {
        name: rel.name,
        modelId,
        relationshipId: rel.id,
        relationshipType: rel.type as RelationshipTypeValue,
        description: rel.description ?? "",
      },
    }));
}

/**
 * Convert React Flow nodes to absolute layout positions for persistence.
 */
export function nodesToArchLayouts(
  nodes: Array<{
    id?: string;
    position: XYPosition;
    data: { elementId: string; parentId?: string | null };
    parentId?: string;
    width?: number;
    height?: number;
  }>,
): ElementLayout[] {
  const nodesById = new Map(nodes.map((n) => [n.id ?? n.data.elementId, n]));

  return nodes.map((node) => {
    let absX = node.position.x;
    let absY = node.position.y;
    let current = node;
    const visited = new Set<string>();

    while (current.parentId && !visited.has(current.parentId)) {
      visited.add(current.parentId);
      const parent = nodesById.get(current.parentId);
      if (!parent) break;
      absX += parent.position.x;
      absY += parent.position.y;
      current = parent;
    }

    return {
      position: { x: absX, y: absY },
      elementId: node.data.elementId,
      size: {
        width: node.width ?? DEFAULT_NODE_SIZE.width,
        height: node.height ?? DEFAULT_NODE_SIZE.height,
      },
    };
  });
}

/**
 * Compute a cascade position for a new node based on existing node count.
 */
export function cascadePosition(nodeCount: number): XYPosition {
  return {
    x: 80 + (nodeCount % 6) * 40,
    y: 80 + (nodeCount % 6) * 40,
  };
}
