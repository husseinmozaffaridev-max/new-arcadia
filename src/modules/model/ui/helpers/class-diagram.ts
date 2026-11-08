import type { Node } from "@xyflow/react";
import {
  CLASS_ELEMENT_TYPES,
  CLASS_RELATIONSHIP_TYPES,
  getClassElementTypeInfo,
  getClassRelationshipTypeInfo,
} from "../constants/class-diagram";
import type { ClassNodeData } from "../stores/class-canvas";
import type {
  ClassElementTypeValue,
  ClassRelationshipTypeValue,
} from "../types/class-diagram";
import type { RelationshipTypeValue } from "../types/relationship";

/** Container element types that render as UML folder-tab nodes. */
export function isContainerType(type: ClassElementTypeValue): boolean {
  return type === "PACKAGE";
}

/** Per UML/ARCADIA: which types can own attributes (properties). */
export function canHaveAttributes(type: ClassElementTypeValue): boolean {
  return (
    type === "CLASS" ||
    type === "INTERFACE" ||
    type === "DATA_TYPE" ||
    type === "UNION"
  );
}

/** Per UML/ARCADIA: which types can own operations. */
export function canHaveOperations(type: ClassElementTypeValue): boolean {
  return type === "CLASS" || type === "INTERFACE";
}

/**
 * Sum positions up the parentId chain to get absolute coordinates.
 * Uses a visited-set guard against cycles and a depth cap.
 */
export function getAbsolutePosition(
  node: Node<ClassNodeData>,
  nodesById: Map<string, Node<ClassNodeData>>,
): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  const visited = new Set<string>([node.id]);
  let depth = 0;
  const MAX_DEPTH = 20;

  let current = node;
  while (current.parentId && depth < MAX_DEPTH) {
    if (visited.has(current.parentId)) break;
    visited.add(current.parentId);

    const parent = nodesById.get(current.parentId);
    if (!parent) break;

    x += parent.position.x;
    y += parent.position.y;
    current = parent;
    depth++;
  }

  return { x, y };
}

/**
 * Convert React Flow nodes (relative positions) to absolute layout positions.
 * Returns ElementLayout[] suitable for persisting.
 */
export function nodesToAbsoluteLayouts(nodes: Node[]): Array<{
  position: { x: number; y: number };
  elementId: string;
  size: { width: number; height: number };
}> {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));

  return nodes
    .filter((n): n is Node<ClassNodeData> => {
      const data = n.data as ClassNodeData;
      return "elementType" in data && "elementId" in data;
    })
    .map((n) => {
      const abs = getAbsolutePosition(
        n,
        nodesById as Map<string, Node<ClassNodeData>>,
      );
      const parseDim = (val: unknown): number | undefined => {
        if (typeof val === "number" && !Number.isNaN(val)) return val;
        if (typeof val === "string") {
          const parsed = parseInt(val, 10);
          if (!Number.isNaN(parsed)) return parsed;
        }
        return undefined;
      };

      return {
        position: abs,
        elementId: n.data.elementId,
        size: {
          width:
            parseDim(n.style?.width) ??
            n.width ??
            n.measured?.width ??
            (isContainerType(n.data.elementType) ? 320 : 160),
          height:
            parseDim(n.style?.height) ??
            n.height ??
            n.measured?.height ??
            (isContainerType(n.data.elementType) ? 240 : 60),
        },
      };
    });
}

/** Default sizes for container vs leaf nodes. */
export function getDefaultSize(elementType: ClassElementTypeValue): {
  width: number;
  height: number;
} {
  return isContainerType(elementType)
    ? { width: 320, height: 240 }
    : { width: 160, height: 60 };
}

export function getNodeTypeForClassElement(
  type: ClassElementTypeValue,
): "class-node" | "package-node" {
  return isContainerType(type) ? "package-node" : "class-node";
}

export function getClassEdgeTypeForRelationship(
  type: ClassRelationshipTypeValue,
): "class-edge" {
  return "class-edge";
}

export function isClassDiagramElement(type: string): boolean {
  return CLASS_ELEMENT_TYPES.some((t) => t.value === type);
}

export function isClassDiagramRelationship(type: string): boolean {
  return CLASS_RELATIONSHIP_TYPES.some((t) => t.value === type);
}

export function getElementVisualForClass(type: ClassElementTypeValue) {
  const info = getClassElementTypeInfo(type);
  return {
    shape: info.shape,
    fillColor: info.color + "20",
    fillColorDark: info.color + "40",
    strokeColor: info.color,
  };
}

export function getRelationshipVisualForClass(
  type: ClassRelationshipTypeValue,
) {
  const info = getClassRelationshipTypeInfo(type);
  return {
    strokeColor: info.strokeColor,
    strokeWidth: info.strokeWidth,
    strokeDash: info.strokeDash,
    markerEnd: info.markerEnd,
  };
}

/**
 * Maps architecture RelationshipTypeValue to ClassRelationshipTypeValue.
 * Used when building edges for CDB diagrams from architecture relationship data.
 */
const ARCH_TO_CLASS_RELATIONSHIP: Record<string, ClassRelationshipTypeValue> = {
  Generalization: "GENERALIZATION",
  Composition: "ASSOCIATION",
  ProvidedInterface: "DEPENDENCY",
  RequiredInterface: "DEPENDENCY",
  FunctionalExchange: "DEPENDENCY",
  SystemExchange: "ASSOCIATION",
  LogicalExchange: "ASSOCIATION",
  ComponentExchange: "ASSOCIATION",
  PhysicalExchange: "ASSOCIATION",
  OperationalExchange: "ASSOCIATION",
  InvolvementLink: "DEPENDENCY",
  PhysicalLink: "ASSOCIATION",
  DeploymentLink: "ASSOCIATION",
};

export function mapToClassRelationshipType(
  type: RelationshipTypeValue,
): ClassRelationshipTypeValue {
  return ARCH_TO_CLASS_RELATIONSHIP[type] ?? "ASSOCIATION";
}
