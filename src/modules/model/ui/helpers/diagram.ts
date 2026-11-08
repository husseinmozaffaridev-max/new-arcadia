import { getTransitionedDiagramType } from "../../domain/diagram-transition";
import { DIAGRAM_TYPES, DIAGRAMS_BY_LAYER } from "../constants/diagram";
import type { DiagramTypeInfo, DiagramTypeValue } from "../types/diagram";
import type { ElementTypeValue } from "../types/element";
import type { LayerValue } from "../types/layer";
import type { RelationshipTypeValue } from "../types/relationship";
import { getElementTypesForLayer } from "./element";

export function getDiagramTypeInfo(value: string): DiagramTypeInfo | undefined {
  return DIAGRAM_TYPES.find((d) => d.value === value);
}

/**
 * Returns diagram types available for a given layer.
 * Uses DIAGRAMS_BY_LAYER as source of truth so transverse types (e.g. CDB)
 * appear in every layer they're registered for.
 */
export function getDiagramTypesForLayer(
  layerValue: LayerValue | string,
): DiagramTypeInfo[] {
  const allowed = new Set(DIAGRAMS_BY_LAYER[layerValue as LayerValue] ?? []);
  return DIAGRAM_TYPES.filter((d) => allowed.has(d.value));
}

export function getDiagramLayer(typeValue: string): LayerValue {
  return getDiagramTypeInfo(typeValue)?.layer ?? "OA";
}

/**
 * Resolves the effective layer for a diagram tab.
 * For transverse types (CDB), uses the model's layer; otherwise derives from type.
 */
/**
 * Number of architecture diagrams that have a counterpart type in the next
 * layer, i.e. the ones a transition will recreate on the other side.
 */
export function countTransitionableDiagrams(
  diagrams: ReadonlyArray<{ type: string }>,
): number {
  return diagrams.filter((d) => getTransitionedDiagramType(d.type) !== null)
    .length;
}

export function resolveDiagramLayer(
  typeValue: string,
  modelLayer?: LayerValue,
): LayerValue {
  if (modelLayer) return modelLayer;
  return getDiagramLayer(typeValue);
}

// ─── Per-diagram-type palette (Capella-style toolboxes) ───────────────────────

export type DiagramPalette = {
  elementTypes: string[];
  relationshipTypes: string[];
};

/**
 * هر نوع دیاگرام Arcadia ابزارهای مخصوص خود را دارد (مثلاً SAB با SDFB فرق دارد).
 * این نگاشت زیرمجموعه‌ی المنت‌ها و روابط مرتبط با هر نوع دیاگرام را تعریف می‌کند.
 */
const DIAGRAM_PALETTE: Record<DiagramTypeValue, DiagramPalette> = {
  // ─── OA ───
  OEB: {
    elementTypes: ["OperationalEntity", "OperationalActor"],
    relationshipTypes: ["Generalization"],
  },
  OAB: {
    elementTypes: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: ["OperationalExchange", "Allocation"],
  },
  OAIB: {
    elementTypes: ["OperationalActivity"],
    relationshipTypes: ["OperationalExchange"],
  },
  OABD: {
    elementTypes: ["OperationalActivity"],
    relationshipTypes: [],
  },
  OPD: {
    elementTypes: ["OperationalActivity"],
    relationshipTypes: ["OperationalExchange"],
  },
  OCB: {
    elementTypes: [
      "OperationalCapability",
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: ["InvolvementLink"],
  },
  OCD: {
    elementTypes: [
      "OperationalCapability",
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: ["InvolvementLink"],
  },
  OAS: {
    elementTypes: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: ["OperationalExchange"],
  },
  OIS: {
    elementTypes: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: ["OperationalExchange"],
  },
  OAAB: {
    elementTypes: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: ["OperationalExchange", "Allocation"],
  },
  // ─── SA ───
  MCB: {
    elementTypes: [
      "SystemCapability",
      "SystemActor",
      "SystemFunction",
      "System",
    ],
    relationshipTypes: ["InvolvementLink"],
  },
  CSA: {
    elementTypes: ["System", "SystemActor"],
    relationshipTypes: ["SystemExchange"],
  },
  SAB: {
    elementTypes: [
      "System",
      "SystemActor",
      "SystemComponent",
      "SystemFunction",
    ],
    relationshipTypes: [
      "SystemExchange",
      "ComponentExchange",
      "FunctionalExchange",
      "Allocation",
    ],
  },
  SDFB: {
    elementTypes: ["SystemFunction", "FunctionPort"],
    relationshipTypes: ["FunctionalExchange"],
  },
  SFBD: {
    elementTypes: ["SystemFunction"],
    relationshipTypes: [],
  },
  SCD: {
    elementTypes: [
      "SystemCapability",
      "SystemActor",
      "SystemFunction",
      "System",
    ],
    relationshipTypes: ["InvolvementLink"],
  },
  SFB: {
    elementTypes: ["SystemFunction"],
    relationshipTypes: [],
  },
  SAS: {
    elementTypes: ["SystemActor", "SystemFunction"],
    relationshipTypes: ["FunctionalExchange"],
  },
  SS: {
    elementTypes: ["SystemActor", "SystemFunction"],
    relationshipTypes: ["FunctionalExchange"],
  },
  // ─── LA ───
  LAB: {
    elementTypes: ["LogicalComponent", "LogicalActor", "LogicalFunction"],
    relationshipTypes: [
      "ComponentExchange",
      "LogicalExchange",
      "FunctionalExchange",
      "Allocation",
      "ProvidedInterface",
      "RequiredInterface",
    ],
  },
  LDFB: {
    elementTypes: ["LogicalFunction"],
    relationshipTypes: ["LogicalExchange"],
  },
  LCB: {
    elementTypes: ["LogicalComponent"],
    relationshipTypes: ["Generalization"],
  },
  LFBD: {
    elementTypes: ["LogicalFunction"],
    relationshipTypes: [],
  },
  LFB: {
    elementTypes: ["LogicalFunction"],
    relationshipTypes: [],
  },
  LAS: {
    elementTypes: ["LogicalActor", "LogicalFunction"],
    relationshipTypes: ["LogicalExchange"],
  },
  LS: {
    elementTypes: ["LogicalActor", "LogicalFunction"],
    relationshipTypes: ["LogicalExchange"],
  },
  // ─── PA ───
  PAB: {
    elementTypes: [
      "PhysicalComponent",
      "PhysicalNode",
      "PhysicalActor",
      "PhysicalFunction",
    ],
    relationshipTypes: [
      "ComponentExchange",
      "PhysicalExchange",
      "PhysicalLink",
      "DeploymentLink",
      "Allocation",
    ],
  },
  PDFB: {
    elementTypes: ["PhysicalFunction"],
    relationshipTypes: ["PhysicalExchange"],
  },
  PCB: {
    elementTypes: ["PhysicalComponent", "PhysicalNode"],
    relationshipTypes: ["DeploymentLink", "Generalization"],
  },
  PFBD: {
    elementTypes: ["PhysicalFunction"],
    relationshipTypes: [],
  },
  PFB: {
    elementTypes: ["PhysicalFunction"],
    relationshipTypes: [],
  },
  PAS: {
    elementTypes: ["PhysicalActor", "PhysicalFunction"],
    relationshipTypes: ["PhysicalExchange"],
  },
  PS: {
    elementTypes: ["PhysicalActor", "PhysicalFunction"],
    relationshipTypes: ["PhysicalExchange"],
  },
  // ─── EPBS (legacy rendering only — not offered in UI) ───
  EPBB: {
    elementTypes: [
      "EPBSArchitecture",
      "ConfigurationItem",
      "ConfigurationItemPart",
      "ConfigurationItemInterface",
    ],
    relationshipTypes: [
      "ProvidedInterface",
      "RequiredInterface",
      "Generalization",
    ],
  },
  EAB: {
    elementTypes: [
      "EPBSArchitecture",
      "ConfigurationItem",
      "ConfigurationItemPart",
      "ConfigurationItemInterface",
    ],
    relationshipTypes: [
      "ProvidedInterface",
      "RequiredInterface",
      "Generalization",
    ],
  },
  ECB: {
    elementTypes: [
      "ConfigurationItem",
      "ConfigurationItemPart",
      "ConfigurationItemInterface",
    ],
    relationshipTypes: [
      "ProvidedInterface",
      "RequiredInterface",
      "Generalization",
    ],
  },
  // ─── Class Diagram (CDB) ───
  CDB: {
    elementTypes: [
      "CLASS",
      "INTERFACE",
      "ENUM",
      "DATA_TYPE",
      "PRIMITIVE",
      "COLLECTION",
      "UNION",
      "PACKAGE",
      "GROUP",
    ],
    relationshipTypes: [
      "ASSOCIATION",
      "GENERALIZATION",
      "REALIZATION",
      "DEPENDENCY",
    ],
  },
};

/**
 * پالت یک نوع دیاگرام را برمی‌گرداند. المنت‌ها به نوع‌های معتبرِ همان لایه فیلتر
 * می‌شوند و در صورت نبود نگاشت، به همه‌ی نوع‌های لایه برمی‌گردد (fallback).
 * برای Class Diagram (CDB) نگاشت اختصاصی دارد.
 */
export function getDiagramPalette(typeValue: string): DiagramPalette {
  const layer = getDiagramLayer(typeValue);

  // Class Diagram (CDB) uses its own element types, not layer-based ones
  if (typeValue === "CDB") {
    const palette = DIAGRAM_PALETTE.CDB;
    return {
      elementTypes: palette.elementTypes,
      relationshipTypes: palette.relationshipTypes,
    };
  }

  const validTypes = new Set<string>(
    getElementTypesForLayer(layer).map((e) => e.value),
  );

  const palette = DIAGRAM_PALETTE[typeValue as DiagramTypeValue];
  if (!palette) {
    return {
      elementTypes: [...validTypes] as string[],
      relationshipTypes: [],
    };
  }

  return {
    elementTypes: palette.elementTypes.filter((t) =>
      validTypes.has(t),
    ) as string[],
    relationshipTypes: palette.relationshipTypes,
  };
}

/**
 * Determines whether childType may be nested/contained inside parentType on diagramType
 * according to Arcadia / Capella methodology.
 *
 * Rules:
 * - Actors can NEVER contain anything, can NEVER be nested, and have NO children.
 * - OAB (Operational Architecture Blank): Flat canvas — NO structural breakdown (ساختار شکست)
 *   and NO decomposition (تجزیه) of any element (entities, actors, activities).
 *   Allocation of activities to entities/actors is modeled via Allocation relationship links.
 * - Breakdown diagrams (OEB/OEBD, LCB, PCB): Entities/Components decompose into sub-entities/components.
 * - Function Breakdown diagrams (OABD, SFBD, LFBD, PFBD): Functions decompose into sub-functions.
 * - Architecture Blank diagrams (SAB, LAB, PAB): Components decompose into sub-components,
 *   and functions are allocated inside components. Functions do NOT decompose into sub-functions.
 * - Dataflow and Capability diagrams: Flat (no nesting).
 */
export function canNestOnDiagram(
  childType: string,
  parentType: string,
  diagramType: string,
): boolean {
  if (childType.endsWith("Actor") || parentType.endsWith("Actor")) {
    return false;
  }

  // ─── OA ───
  // In OAB, no structural breakdown or decomposition occurs (no nesting).
  if (diagramType === "OAB") {
    return false;
  }
  if (diagramType === "OEB" || diagramType === "OEBD") {
    return (
      childType === "OperationalEntity" && parentType === "OperationalEntity"
    );
  }
  if (diagramType === "OABD") {
    return (
      childType === "OperationalActivity" &&
      parentType === "OperationalActivity"
    );
  }

  // ─── SA ───
  if (diagramType === "SAB") {
    if (childType === "SystemComponent") {
      return parentType === "System" || parentType === "SystemComponent";
    }
    if (childType === "SystemFunction") {
      return parentType === "System" || parentType === "SystemComponent";
    }
    return false;
  }
  if (diagramType === "SFBD" || diagramType === "SFB") {
    return childType === "SystemFunction" && parentType === "SystemFunction";
  }

  // ─── LA ───
  if (diagramType === "LAB") {
    if (childType === "LogicalComponent") {
      return parentType === "LogicalComponent";
    }
    if (childType === "LogicalFunction") {
      return parentType === "LogicalComponent";
    }
    return false;
  }
  if (diagramType === "LCB") {
    return (
      childType === "LogicalComponent" && parentType === "LogicalComponent"
    );
  }
  if (diagramType === "LFBD" || diagramType === "LFB") {
    return childType === "LogicalFunction" && parentType === "LogicalFunction";
  }

  // ─── PA ───
  if (diagramType === "PAB") {
    if (childType === "PhysicalComponent" || childType === "PhysicalNode") {
      return (
        parentType === "PhysicalComponent" || parentType === "PhysicalNode"
      );
    }
    if (childType === "PhysicalFunction") {
      return (
        parentType === "PhysicalComponent" || parentType === "PhysicalNode"
      );
    }
    return false;
  }
  if (diagramType === "PCB") {
    return (
      (childType === "PhysicalComponent" || childType === "PhysicalNode") &&
      (parentType === "PhysicalComponent" || parentType === "PhysicalNode")
    );
  }
  if (diagramType === "PFBD" || diagramType === "PFB") {
    return (
      childType === "PhysicalFunction" && parentType === "PhysicalFunction"
    );
  }

  return false;
}
