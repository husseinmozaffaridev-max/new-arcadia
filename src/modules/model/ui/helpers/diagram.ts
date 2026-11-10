import { DIAGRAM_TYPES, DIAGRAMS_BY_LAYER } from "../constants/diagram";
import type { DiagramTypeInfo, DiagramTypeValue } from "../types/diagram";
import type { LayerValue } from "../types/layer";
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
  const allowedTypes = DIAGRAMS_BY_LAYER[layerValue as LayerValue] ?? [];
  return allowedTypes
    .map((typeValue) => {
      const exact = DIAGRAM_TYPES.find(
        (d) => d.value === typeValue && d.layer === layerValue,
      );
      if (exact) return exact;
      return DIAGRAM_TYPES.find((d) => d.value === typeValue);
    })
    .filter((d): d is DiagramTypeInfo => d !== undefined);
}

export function getDiagramLayer(typeValue: string): LayerValue {
  return getDiagramTypeInfo(typeValue)?.layer ?? "OA";
}

/**
 * Resolves the effective layer for a diagram tab.
 * For transverse types (CDB), uses the model's layer; otherwise derives from type.
 */
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
  OEBD: {
    elementTypes: ["OperationalEntity", "OperationalActor"],
    relationshipTypes: [],
  },
  OEB: {
    elementTypes: ["OperationalEntity", "OperationalActor"],
    relationshipTypes: [],
  },
  OAB: {
    elementTypes: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: [
      "CommunicationMean",
      "FunctionalExchange",
      "Allocation",
    ],
  },
  OAIB: {
    elementTypes: ["OperationalActivity"],
    relationshipTypes: ["FunctionalExchange"],
  },
  OABD: {
    elementTypes: ["OperationalActivity"],
    relationshipTypes: [],
  },
  OPD: {
    elementTypes: ["OperationalActivity"],
    relationshipTypes: ["FunctionalExchange"],
  },
  OCB: {
    elementTypes: [
      "OperationalCapability",
      "Mission",
      "OperationalEntity",
      "OperationalActor",
    ],
    relationshipTypes: ["InvolvementLink"],
  },
  OCD: {
    elementTypes: [
      "OperationalCapability",
      "Mission",
      "OperationalEntity",
      "OperationalActor",
    ],
    relationshipTypes: ["InvolvementLink"],
  },
  OAS: {
    elementTypes: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: ["FunctionalExchange"],
  },
  OIS: {
    elementTypes: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: ["FunctionalExchange"],
  },
  OAAB: {
    elementTypes: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    relationshipTypes: [
      "CommunicationMean",
      "FunctionalExchange",
      "Allocation",
    ],
  },
  // ─── SA ───
  MCB: {
    elementTypes: [
      "SystemCapability",
      "SystemMission",
      "SystemActor",
      "System",
    ],
    relationshipTypes: ["InvolvementLink"],
  },
  CSA: {
    elementTypes: ["System", "SystemActor"],
    relationshipTypes: ["ComponentExchange"],
  },
  SAB: {
    elementTypes: ["System", "SystemActor", "SystemFunction", "FunctionPort"],
    relationshipTypes: [
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
    elementTypes: ["SystemCapability", "SystemActor", "System"],
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
    elementTypes: ["SystemActor", "SystemFunction", "System"],
    relationshipTypes: ["FunctionalExchange"],
  },
  // ─── LA ───
  LAB: {
    elementTypes: [
      "LogicalComponent",
      "LogicalActor",
      "LogicalFunction",
      "FunctionPort",
    ],
    relationshipTypes: [
      "ComponentExchange",
      "FunctionalExchange",
      "Allocation",
      "ProvidedInterface",
      "RequiredInterface",
    ],
  },
  LDFB: {
    elementTypes: ["LogicalFunction", "FunctionPort"],
    relationshipTypes: ["FunctionalExchange"],
  },
  LCBD: {
    elementTypes: ["LogicalComponent", "LogicalActor"],
    relationshipTypes: [],
  },
  LCB: {
    elementTypes: ["LogicalComponent"],
    relationshipTypes: [],
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
    relationshipTypes: ["FunctionalExchange"],
  },
  LS: {
    elementTypes: ["LogicalActor", "LogicalFunction", "LogicalComponent"],
    relationshipTypes: ["FunctionalExchange"],
  },
  // ─── PA ───
  PAB: {
    elementTypes: [
      "PhysicalComponent",
      "PhysicalNode",
      "PhysicalActor",
      "PhysicalFunction",
      "FunctionPort",
    ],
    relationshipTypes: [
      "ComponentExchange",
      "FunctionalExchange",
      "PhysicalLink",
      "DeploymentLink",
      "Allocation",
    ],
  },
  PDFB: {
    elementTypes: ["PhysicalFunction", "FunctionPort"],
    relationshipTypes: ["FunctionalExchange"],
  },
  PCBD: {
    elementTypes: ["PhysicalComponent", "PhysicalNode", "PhysicalActor"],
    relationshipTypes: ["DeploymentLink"],
  },
  PCB: {
    elementTypes: ["PhysicalComponent", "PhysicalNode"],
    relationshipTypes: ["DeploymentLink"],
  },
  CRB: {
    elementTypes: [
      "LogicalCapability",
      "LogicalComponent",
      "LogicalActor",
      "PhysicalComponent",
      "PhysicalNode",
      "PhysicalActor",
    ],
    relationshipTypes: ["InvolvementLink"],
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
    relationshipTypes: ["FunctionalExchange"],
  },
  PS: {
    elementTypes: [
      "PhysicalActor",
      "PhysicalFunction",
      "PhysicalComponent",
      "PhysicalNode",
    ],
    relationshipTypes: ["FunctionalExchange"],
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

  // Capability realization is a cross-layer view: both logical and physical
  // elements must be available from its toolbox.
  if (typeValue === "CRB") {
    return { ...DIAGRAM_PALETTE.CRB };
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

/** Existing relations that a diagram may display, including projected relations. */
export function getDiagramVisibleRelationshipTypes(
  typeValue: string,
): string[] {
  const creationTypes = getDiagramPalette(typeValue).relationshipTypes;
  // Capella also projects existing communication means into OCB views.
  return typeValue === "OCB"
    ? [...creationTypes, "CommunicationMean"]
    : creationTypes;
}

const TREE_BREAKDOWN_DIAGRAMS = new Set([
  "OEBD",
  "OEB",
  "OABD",
  "SFBD",
  "LFBD",
  "PFBD",
]);

export function isTreeBreakdownDiagram(typeValue: string): boolean {
  return TREE_BREAKDOWN_DIAGRAMS.has(typeValue);
}

/** A handle gesture on a breakdown view edits containment, not a model edge. */
export function planHierarchyConnection(
  child: { id: string; type: string },
  parent: { id: string; type: string },
  diagramType: string,
  elements: ReadonlyArray<{ id: string; parentId?: string | null }>,
): "valid" | "invalid-pair" | "self" | "cycle" | "already-parent" {
  if (!canNestOnDiagram(child.type, parent.type, diagramType)) {
    return "invalid-pair";
  }
  if (child.id === parent.id) return "self";
  const byId = new Map(elements.map((element) => [element.id, element]));
  if (byId.get(child.id)?.parentId === parent.id) return "already-parent";
  let current: string | null | undefined = parent.id;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    if (current === child.id) return "cycle";
    visited.add(current);
    current = byId.get(current)?.parentId;
  }
  return "valid";
}

export function getConnectionFailureMessage(
  sourceType: string,
  targetType: string,
  diagramType: string,
  isFa: boolean,
): string {
  const operationalTypes = ["OperationalEntity", "OperationalActor"];
  if (
    (diagramType === "OEBD" || diagramType === "OEB") &&
    operationalTypes.includes(sourceType) &&
    operationalTypes.includes(targetType) &&
    (sourceType === "OperationalEntity" || targetType === "OperationalEntity")
  ) {
    return isFa
      ? "در OEBD/OEB خط اتصال، ساختار والد–فرزند را نشان می‌دهد. برای زیرمجموعه‌کردن، از عنصر فرزند به موجودیت والد وصل کنید؛ برای ارتباط عملیاتی در OAB رابطهٔ Communication Mean بسازید."
      : "OEBD/OEB shows the parent-child hierarchy. Drag from a child to its parent entity for breakdown; create a Communication Mean in OAB for operational communication.";
  }
  if (diagramType === "OABD") {
    return isFa
      ? "در OABD از فعالیت فرزند به فعالیت والد وصل کنید تا ساختار شکست ساخته شود؛ برای تبادل بین فعالیت‌ها از OAIB استفاده کنید."
      : "In OABD, drag from a child activity to its parent for breakdown; use OAIB for exchanges between activities.";
  }
  return isFa
    ? `اتصال این عناصر در دیاگرام ${diagramType} مجاز نیست.`
    : `Cannot connect these elements in ${diagramType} diagram.`;
}

/**
 * Determines whether childType may be nested/contained inside parentType on diagramType
 * according to Arcadia / Capella methodology.
 *
 * Rules:
 * - Actors cannot contain children. In OEBD/OEB, an operational actor may be
 *   contained by an operational entity (Crew contains Cabin Crew in the sample).
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
  if (parentType.endsWith("Actor")) {
    return false;
  }

  // ─── OA ───
  // In OAB, no structural breakdown or decomposition occurs (no nesting).
  if (diagramType === "OAB") {
    return false;
  }
  if (diagramType === "OEB" || diagramType === "OEBD") {
    return (
      (childType === "OperationalEntity" || childType === "OperationalActor") &&
      parentType === "OperationalEntity"
    );
  }
  if (childType.endsWith("Actor")) return false;
  if (diagramType === "OABD") {
    return (
      childType === "OperationalActivity" &&
      parentType === "OperationalActivity"
    );
  }

  // ─── SA ───
  if (diagramType === "SAB") {
    if (childType === "SystemFunction") {
      return parentType === "System";
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
  if (diagramType === "LCB" || diagramType === "LCBD") {
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
  if (diagramType === "PCB" || diagramType === "PCBD") {
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
