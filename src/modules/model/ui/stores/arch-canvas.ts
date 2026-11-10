import type { Node } from "@xyflow/react";
import type { ElementTypeValue } from "../types/element";
import type { RelationshipTypeValue } from "../types/relationship";

export type ElementNodeData = {
  name: string;
  modelId: string;
  elementId: string;
  description?: string;
  elementType: ElementTypeValue;
  status: "DRAFT" | "VALIDATED" | "DEPRECATED";
  parentId?: string | null;
};

export type RelationshipEdgeData = {
  hierarchy?: boolean;
  hierarchyArrow?: boolean;
  name: string;
  modelId: string;
  relationshipId: string;
  description: string;
  relationshipType: RelationshipTypeValue;
};

export type ArchCanvasNode = Node<ElementNodeData>;
