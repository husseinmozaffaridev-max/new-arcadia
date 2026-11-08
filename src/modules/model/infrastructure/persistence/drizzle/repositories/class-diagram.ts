// @ts-nocheck
import type {
  CreateClassDiagramPayload,
  CreateClassElementLayoutPayload,
  CreateClassElementPayload,
  CreateClassEnumerationLiteralPayload,
  CreateClassOperationParameterPayload,
  CreateClassOperationPayload,
  CreateClassPropertyPayload,
  CreateClassRelationshipLayoutPayload,
  CreateClassRelationshipPayload,
  FindClassDiagramByIdQuery,
  FindClassDiagramsByModelIdQuery,
  FindClassElementByIdQuery,
  FindClassElementLayoutsByDiagramIdQuery,
  FindClassElementsByModelIdQuery,
  FindClassEnumerationLiteralsByElementIdQuery,
  FindClassOperationParametersByOperationIdQuery,
  FindClassOperationsByElementIdQuery,
  FindClassPropertiesByElementIdQuery,
  FindClassRelationshipByIdQuery,
  FindClassRelationshipLayoutsByDiagramIdQuery,
  FindClassRelationshipsByModelIdQuery,
  IClassDiagramRepository,
  RemoveClassDiagramPayload,
  RemoveClassElementLayoutPayload,
  RemoveClassElementPayload,
  RemoveClassEnumerationLiteralPayload,
  RemoveClassOperationParameterPayload,
  RemoveClassOperationPayload,
  RemoveClassPropertyPayload,
  RemoveClassRelationshipLayoutPayload,
  RemoveClassRelationshipPayload,
  UpdateClassDiagramPayload,
  UpdateClassElementLayoutPayload,
  UpdateClassElementPayload,
  UpdateClassEnumerationLiteralPayload,
  UpdateClassOperationParameterPayload,
  UpdateClassOperationPayload,
  UpdateClassPropertyPayload,
  UpdateClassRelationshipLayoutPayload,
  UpdateClassRelationshipPayload,
} from "@/modules/model/application/ports/class-diagram";
import { ClassDiagram } from "@/modules/model/domain/entities/class-diagram";
import { ClassElement } from "@/modules/model/domain/entities/class-element";
import { ClassElementLayout } from "@/modules/model/domain/entities/class-element-layout";
import { ClassEnumerationLiteral } from "@/modules/model/domain/entities/class-enumeration-literal";
import { ClassOperation } from "@/modules/model/domain/entities/class-operation";
import { ClassOperationParameter } from "@/modules/model/domain/entities/class-operation-parameter";
import { ClassProperty } from "@/modules/model/domain/entities/class-property";
import { ClassRelationship } from "@/modules/model/domain/entities/class-relationship";
import { ClassRelationshipLayout } from "@/modules/model/domain/entities/class-relationship-layout";
import { ClassCollectionKind } from "@/modules/model/domain/value-objects/class-collection-kind";
import { AggregationKind } from "@/modules/model/domain/value-objects/aggregation-kind";
import { and, eq, or } from "drizzle-orm";
import { db } from "../client";
import {
  classDiagrams,
  classElementLayouts,
  classElements,
  classEnumerationLiterals,
  classOperationParameters,
  classOperations,
  classProperties,
  classRelationshipLayouts,
  classRelationships,
} from "../schemas";

// Explicitly define row types to avoid Drizzle type caching issues
type ClassDiagramRow = {
  id: string;
  modelId: string;
  layer: string;
  name: string;
  description: string;
  viewport: { x: number; y: number; zoom: number };
  status: "DRAFT" | "VALIDATED" | "DEPRECATED";
  createdAt: Date;
  updatedAt: Date;
};

type ClassElementRow = {
  id: string;
  modelId: string;
  layer: string;
  name: string;
  description: string;
  elementType:
    | "CLASS"
    | "INTERFACE"
    | "ENUM"
    | "DATA_TYPE"
    | "PRIMITIVE"
    | "COLLECTION"
    | "UNION"
    | "PACKAGE"
    | "GROUP";
  visibility: "public" | "private" | "protected" | "package";
  isAbstract: boolean;
  isStatic: boolean;
  parentId: string | null;
  ordering: number;
  status: "DRAFT" | "VALIDATED" | "DEPRECATED";
  extensionProperties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

type ClassRelationshipRow = {
  id: string;
  modelId: string;
  layer: string;
  sourceElementId: string;
  targetElementId: string;
  name: string;
  description: string;
  relationshipType:
    | "ASSOCIATION"
    | "GENERALIZATION"
    | "REALIZATION"
    | "DEPENDENCY";
  aggregationKind: "NONE" | "SHARED" | "COMPOSITE";
  isDisjoint: boolean;
  isComplete: boolean;
  sourceMultiplicityLower: number;
  sourceMultiplicityUpper: string;
  targetMultiplicityLower: number;
  targetMultiplicityUpper: string;
  sourceRole: string;
  targetRole: string;
  isNavigableSource: boolean;
  isNavigableTarget: boolean;
  status: "DRAFT" | "VALIDATED" | "DEPRECATED";
  extensionProperties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

type ClassPropertyRow = {
  id: string;
  classElementId: string;
  modelId: string;
  layer: string;
  name: string;
  description: string;
  typeClassElementId: string | null;
  typeLiteral: string;
  isStatic: boolean;
  isReadOnly: boolean;
  isDerived: boolean;
  isID: boolean;
  visibility: "public" | "private" | "protected" | "package";
  multiplicityLower: number;
  multiplicityUpper: string;
  isOrdered: boolean;
  isUnique: boolean;
  collectionKind: "NONE" | "SET" | "BAG" | "SEQUENCE" | "ORDERED_SET";
  aggregationKind: "NONE" | "SHARED" | "COMPOSITE";
  defaultValue: string;
  ordering: number;
  status: "DRAFT" | "VALIDATED" | "DEPRECATED";
  createdAt: Date;
  updatedAt: Date;
};

type ClassOperationRow = {
  id: string;
  classElementId: string;
  modelId: string;
  layer: string;
  name: string;
  description: string;
  returnTypeClassElementId: string | null;
  returnTypeLiteral: string;
  returnMultiplicityLower: number;
  returnMultiplicityUpper: string;
  isStatic: boolean;
  isAbstract: boolean;
  visibility: "public" | "private" | "protected" | "package";
  ordering: number;
  status: "DRAFT" | "VALIDATED" | "DEPRECATED";
  createdAt: Date;
  updatedAt: Date;
};

type ClassOperationParameterRow = {
  id: string;
  classOperationId: string;
  modelId: string;
  layer: string;
  name: string;
  typeClassElementId: string | null;
  typeLiteral: string;
  multiplicityLower: number;
  multiplicityUpper: string;
  defaultValue: string | null;
  direction: "IN" | "OUT" | "INOUT" | "RETURN";
  isOrdered: boolean;
  isUnique: boolean;
  ordering: number;
  status: "DRAFT" | "VALIDATED" | "DEPRECATED";
  createdAt: Date;
  updatedAt: Date;
};

type ClassEnumerationLiteralRow = {
  id: string;
  classElementId: string;
  modelId: string;
  layer: string;
  name: string;
  value: string;
  ordering: number;
  status: "DRAFT" | "VALIDATED" | "DEPRECATED";
  createdAt: Date;
  updatedAt: Date;
};

type ClassElementLayoutRow = {
  id: string;
  classDiagramId: string;
  classElementId: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
};

type ClassRelationshipLayoutRow = {
  id: string;
  classDiagramId: string;
  classRelationshipId: string;
  labelX: number | null;
  labelY: number | null;
  sourceRoleLabelX: number | null;
  sourceRoleLabelY: number | null;
  targetRoleLabelX: number | null;
  targetRoleLabelY: number | null;
  sourceMultLabelX: number | null;
  sourceMultLabelY: number | null;
  targetMultLabelX: number | null;
  targetMultLabelY: number | null;
  waypoints: Array<{ x: number; y: number }>;
  createdAt: Date;
  updatedAt: Date;
};

function toClassDiagram(
  row: ClassDiagramRow,
  elementLayouts?: Array<{
    elementId: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>,
  relationshipLayouts?: Array<{
    relationshipId: string;
    labelX: number | null;
    labelY: number | null;
    sourceRoleLabelX: number | null;
    sourceRoleLabelY: number | null;
    targetRoleLabelX: number | null;
    targetRoleLabelY: number | null;
    sourceMultLabelX: number | null;
    sourceMultLabelY: number | null;
    targetMultLabelX: number | null;
    targetMultLabelY: number | null;
    waypoints: Array<{ x: number; y: number }>;
  }>,
): ClassDiagram {
  return ClassDiagram.reconstitute({
    id: row.id,
    modelId: row.modelId,
    layer: row.layer,
    name: row.name,
    description: row.description,
    viewport: row.viewport ?? { x: 0, y: 0, zoom: 1 },
    elementLayouts: Array.isArray(elementLayouts) ? elementLayouts : [],
    relationshipLayouts: Array.isArray(relationshipLayouts)
      ? relationshipLayouts
      : [],
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toClassElement(row: ClassElementRow): ClassElement {
  return ClassElement.reconstitute({
    id: row.id,
    modelId: row.modelId,
    layer: row.layer,
    name: row.name,
    description: row.description,
    elementType: row.elementType,
    visibility: row.visibility,
    isAbstract: row.isAbstract,
    isStatic: row.isStatic,
    parentId: row.parentId,
    ordering: row.ordering,
    status: row.status,
    extensionProperties: row.extensionProperties,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toClassRelationship(row: ClassRelationshipRow): ClassRelationship {
  return ClassRelationship.reconstitute({
    id: row.id,
    modelId: row.modelId,
    layer: row.layer,
    sourceElementId: row.sourceElementId,
    targetElementId: row.targetElementId,
    name: row.name,
    description: row.description,
    relationshipType: row.relationshipType,
    aggregationKind: row.aggregationKind,
    isDisjoint: row.isDisjoint,
    isComplete: row.isComplete,
    sourceMultiplicityLower: row.sourceMultiplicityLower,
    sourceMultiplicityUpper: row.sourceMultiplicityUpper,
    targetMultiplicityLower: row.targetMultiplicityLower,
    targetMultiplicityUpper: row.targetMultiplicityUpper,
    sourceRole: row.sourceRole,
    targetRole: row.targetRole,
    isNavigableSource: row.isNavigableSource,
    isNavigableTarget: row.isNavigableTarget,
    status: row.status,
    extensionProperties: row.extensionProperties,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toClassProperty(row: ClassPropertyRow): ClassProperty {
  return ClassProperty.reconstitute({
    id: row.id,
    classElementId: row.classElementId,
    modelId: row.modelId,
    layer: row.layer,
    name: row.name,
    description: row.description,
    typeClassElementId: row.typeClassElementId,
    typeLiteral: row.typeLiteral,
    isStatic: row.isStatic,
    isReadOnly: row.isReadOnly,
    isDerived: row.isDerived,
    isID: row.isID,
    visibility: row.visibility,
    multiplicityLower: row.multiplicityLower,
    multiplicityUpper: row.multiplicityUpper,
    isOrdered: row.isOrdered,
    isUnique: row.isUnique,
    collectionKind: ClassCollectionKind.from(row.collectionKind),
    aggregationKind: AggregationKind.from(row.aggregationKind),
    defaultValue: row.defaultValue,
    ordering: row.ordering,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toClassOperation(row: ClassOperationRow): ClassOperation {
  return ClassOperation.reconstitute({
    id: row.id,
    classElementId: row.classElementId,
    modelId: row.modelId,
    layer: row.layer,
    name: row.name,
    description: row.description,
    returnTypeClassElementId: row.returnTypeClassElementId,
    returnTypeLiteral: row.returnTypeLiteral,
    returnMultiplicityLower: row.returnMultiplicityLower,
    returnMultiplicityUpper: row.returnMultiplicityUpper,
    isStatic: row.isStatic,
    isAbstract: row.isAbstract,
    visibility: row.visibility,
    ordering: row.ordering,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toClassOperationParameter(
  row: ClassOperationParameterRow,
): ClassOperationParameter {
  return ClassOperationParameter.reconstitute({
    id: row.id,
    classOperationId: row.classOperationId,
    modelId: row.modelId,
    layer: row.layer,
    name: row.name,
    typeClassElementId: row.typeClassElementId,
    typeLiteral: row.typeLiteral,
    multiplicityLower: row.multiplicityLower,
    multiplicityUpper: row.multiplicityUpper,
    defaultValue: row.defaultValue ?? "",
    direction: row.direction,
    isOrdered: row.isOrdered,
    isUnique: row.isUnique,
    ordering: row.ordering,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toClassEnumerationLiteral(
  row: ClassEnumerationLiteralRow,
): ClassEnumerationLiteral {
  return ClassEnumerationLiteral.reconstitute({
    id: row.id,
    classElementId: row.classElementId,
    modelId: row.modelId,
    layer: row.layer,
    name: row.name,
    value: row.value,
    ordering: row.ordering,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toClassElementLayout(row: ClassElementLayoutRow): ClassElementLayout {
  return ClassElementLayout.reconstitute({
    id: row.id,
    classDiagramId: row.classDiagramId,
    classElementId: row.classElementId,
    description: row.description,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toClassRelationshipLayout(
  row: ClassRelationshipLayoutRow,
): ClassRelationshipLayout {
  return ClassRelationshipLayout.reconstitute({
    id: row.id,
    classDiagramId: row.classDiagramId,
    classRelationshipId: row.classRelationshipId,
    labelX: row.labelX,
    labelY: row.labelY,
    sourceRoleLabelX: row.sourceRoleLabelX,
    sourceRoleLabelY: row.sourceRoleLabelY,
    targetRoleLabelX: row.targetRoleLabelX,
    targetRoleLabelY: row.targetRoleLabelY,
    sourceMultLabelX: row.sourceMultLabelX,
    sourceMultLabelY: row.sourceMultLabelY,
    targetMultLabelX: row.targetMultLabelX,
    targetMultLabelY: row.targetMultLabelY,
    waypoints: row.waypoints as Array<{ x: number; y: number }>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export class DrizzleClassDiagramRepository implements IClassDiagramRepository {
  // ─── ClassDiagram ──────────────────────────────────────────────────────────

  async findByModelId(
    query: FindClassDiagramsByModelIdQuery,
  ): Promise<ClassDiagram[]> {
    const rows = await db
      .select()
      .from(classDiagrams)
      .where(eq(classDiagrams.modelId, query.modelId));
    return rows.map(toClassDiagram);
  }

  async findById(
    query: FindClassDiagramByIdQuery,
  ): Promise<ClassDiagram | null> {
    const row = await db.query.classDiagrams.findFirst({
      where: eq(classDiagrams.id, query.id),
    });
    if (!row) return null;

    const layoutRows = await db
      .select()
      .from(classElementLayouts)
      .where(eq(classElementLayouts.classDiagramId, query.id));

    const elementLayouts = layoutRows.map((l) => ({
      elementId: l.classElementId,
      position: { x: l.x, y: l.y },
      size: { width: l.width, height: l.height },
    }));

    const relLayoutRows = await db
      .select()
      .from(classRelationshipLayouts)
      .where(eq(classRelationshipLayouts.classDiagramId, query.id));

    const relationshipLayouts = relLayoutRows.map((l) => ({
      relationshipId: l.classRelationshipId,
      labelX: l.labelX,
      labelY: l.labelY,
      sourceRoleLabelX: l.sourceRoleLabelX,
      sourceRoleLabelY: l.sourceRoleLabelY,
      targetRoleLabelX: l.targetRoleLabelX,
      targetRoleLabelY: l.targetRoleLabelY,
      sourceMultLabelX: l.sourceMultLabelX,
      sourceMultLabelY: l.sourceMultLabelY,
      targetMultLabelX: l.targetMultLabelX,
      targetMultLabelY: l.targetMultLabelY,
      waypoints: (l.waypoints ?? []) as Array<{ x: number; y: number }>,
    }));

    return toClassDiagram(row, elementLayouts, relationshipLayouts);
  }

  async create(payload: CreateClassDiagramPayload): Promise<ClassDiagram> {
    const response = await db
      .insert(classDiagrams)
      .values({
        modelId: payload.modelId,
        layer: payload.layer,
        name: payload.name,
        description: payload.description ?? "",
        viewport: { x: 0, y: 0, zoom: 1 },
        status: "DRAFT",
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassDiagram");
    return toClassDiagram(row);
  }

  async update(payload: UpdateClassDiagramPayload): Promise<ClassDiagram> {
    const existing = await db.query.classDiagrams.findFirst({
      where: eq(classDiagrams.id, payload.id),
    });
    if (!existing)
      throw new Error(`ClassDiagram not found with id: ${payload.id}`);

    const response = await db
      .update(classDiagrams)
      .set({
        name: payload.name ?? existing.name,
        description: payload.description ?? existing.description,
        updatedAt: new Date(),
      })
      .where(eq(classDiagrams.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(`ClassDiagram not found with id: ${payload.id}`);
    return toClassDiagram(updated);
  }

  async updateLayout(payload: {
    id: string;
    viewport?: { x: number; y: number; zoom: number };
    elementLayouts?: Array<{
      elementId: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
  }): Promise<ClassDiagram> {
    const existing = await db.query.classDiagrams.findFirst({
      where: eq(classDiagrams.id, payload.id),
    });
    if (!existing)
      throw new Error(`ClassDiagram not found with id: ${payload.id}`);

    // Update diagram metadata (viewport)
    if (payload.viewport) {
      await db
        .update(classDiagrams)
        .set({ viewport: payload.viewport, updatedAt: new Date() })
        .where(eq(classDiagrams.id, payload.id));
    }

    // Replace element layouts if provided
    if (payload.elementLayouts) {
      // Delete existing layouts
      await db
        .delete(classElementLayouts)
        .where(eq(classElementLayouts.classDiagramId, payload.id));

      // Insert new layouts
      if (payload.elementLayouts.length > 0) {
        await db.insert(classElementLayouts).values(
          payload.elementLayouts.map((layout) => ({
            classDiagramId: payload.id,
            classElementId: layout.elementId,
            x: layout.position.x,
            y: layout.position.y,
            width: layout.size.width,
            height: layout.size.height,
          })),
        );
      }
    }

    // Re-fetch the diagram with updated layouts
    const diagram = await this.findById({ id: payload.id });
    if (!diagram)
      throw new Error(`ClassDiagram not found with id: ${payload.id}`);
    return diagram;
  }

  async remove(payload: RemoveClassDiagramPayload): Promise<boolean> {
    const result = await db
      .delete(classDiagrams)
      .where(eq(classDiagrams.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }

  // ─── ClassElement (owned by Model) ────────────────────────────────────────

  async findElementsByModelId(
    query: FindClassElementsByModelIdQuery,
  ): Promise<ClassElement[]> {
    const conditions = [eq(classElements.modelId, query.modelId)];
    if (query.layer) {
      conditions.push(eq(classElements.layer, query.layer));
    }
    const rows = await db
      .select()
      .from(classElements)
      .where(and(...conditions))
      .orderBy(classElements.ordering);
    return rows.map(toClassElement);
  }

  async findElementById(
    query: FindClassElementByIdQuery,
  ): Promise<ClassElement | null> {
    const row = await db.query.classElements.findFirst({
      where: eq(classElements.id, query.id),
    });
    return row ? toClassElement(row) : null;
  }

  async createElement(
    payload: CreateClassElementPayload,
  ): Promise<ClassElement> {
    const response = await db
      .insert(classElements)
      .values({
        modelId: payload.modelId,
        layer: payload.layer,
        name: payload.name,
        description: payload.description ?? "",
        elementType: payload.elementType,
        visibility: payload.visibility ?? "public",
        isAbstract: payload.isAbstract ?? false,
        isStatic: payload.isStatic ?? false,
        parentId: payload.parentId ?? null,
        ordering: payload.ordering ?? 0,
        extensionProperties: payload.extensionProperties ?? {},
        status: "DRAFT",
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassElement");
    return toClassElement(row);
  }

  async updateElement(
    payload: UpdateClassElementPayload,
  ): Promise<ClassElement> {
    const existing = await db.query.classElements.findFirst({
      where: eq(classElements.id, payload.id),
    });
    if (!existing)
      throw new Error(`ClassElement not found with id: ${payload.id}`);

    const response = await db
      .update(classElements)
      .set({
        name: payload.name ?? existing.name,
        description: payload.description ?? existing.description,
        status: (payload.status ?? existing.status) as
          | "DRAFT"
          | "VALIDATED"
          | "DEPRECATED",
        elementType: (payload.elementType ?? existing.elementType) as
          | "CLASS"
          | "INTERFACE"
          | "ENUM"
          | "DATA_TYPE"
          | "PRIMITIVE",
        visibility: (payload.visibility ?? existing.visibility) as
          | "public"
          | "private"
          | "protected"
          | "package",
        isAbstract: payload.isAbstract ?? existing.isAbstract,
        isStatic: payload.isStatic ?? existing.isStatic,
        parentId: payload.parentId ?? existing.parentId,
        ordering: payload.ordering ?? existing.ordering,
        extensionProperties:
          payload.extensionProperties ?? existing.extensionProperties,
        updatedAt: new Date(),
      })
      .where(eq(classElements.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(`ClassElement not found with id: ${payload.id}`);
    return toClassElement(updated);
  }

  async removeElement(payload: RemoveClassElementPayload): Promise<boolean> {
    // Cascade delete: properties, operations, parameters, literals, layouts, relationships
    await db
      .delete(classProperties)
      .where(eq(classProperties.classElementId, payload.id));
    await db
      .delete(classOperations)
      .where(eq(classOperations.classElementId, payload.id));
    await db
      .delete(classEnumerationLiterals)
      .where(eq(classEnumerationLiterals.classElementId, payload.id));
    await db
      .delete(classElementLayouts)
      .where(eq(classElementLayouts.classElementId, payload.id));
    await db
      .delete(classRelationships)
      .where(
        or(
          eq(classRelationships.sourceElementId, payload.id),
          eq(classRelationships.targetElementId, payload.id),
        ),
      );
    const result = await db
      .delete(classElements)
      .where(eq(classElements.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }

  // ─── ClassRelationship (owned by Model) ──────────────────────────────────

  async findRelationshipsByModelId(
    query: FindClassRelationshipsByModelIdQuery,
  ): Promise<ClassRelationship[]> {
    const conditions = [eq(classRelationships.modelId, query.modelId)];
    if (query.layer) {
      conditions.push(eq(classRelationships.layer, query.layer));
    }
    const rows = await db
      .select()
      .from(classRelationships)
      .where(and(...conditions));
    return rows.map(toClassRelationship);
  }

  async findRelationshipById(
    query: FindClassRelationshipByIdQuery,
  ): Promise<ClassRelationship | null> {
    const row = await db.query.classRelationships.findFirst({
      where: eq(classRelationships.id, query.id),
    });
    return row ? toClassRelationship(row) : null;
  }

  async createRelationship(
    payload: CreateClassRelationshipPayload,
  ): Promise<ClassRelationship> {
    const response = await db
      .insert(classRelationships)
      .values({
        modelId: payload.modelId,
        layer: payload.layer,
        sourceElementId: payload.sourceElementId,
        targetElementId: payload.targetElementId,
        name: payload.name ?? "",
        description: payload.description ?? "",
        relationshipType: payload.relationshipType,
        aggregationKind: payload.aggregationKind ?? "NONE",
        isDisjoint: payload.isDisjoint ?? false,
        isComplete: payload.isComplete ?? false,
        isDerived: payload.isDerived ?? false,
        sourceMultiplicityLower: payload.sourceMultiplicityLower ?? 1,
        sourceMultiplicityUpper: payload.sourceMultiplicityUpper ?? "*",
        targetMultiplicityLower: payload.targetMultiplicityLower ?? 1,
        targetMultiplicityUpper: payload.targetMultiplicityUpper ?? "*",
        sourceRole: payload.sourceRole ?? "",
        targetRole: payload.targetRole ?? "",
        isNavigableSource: payload.isNavigableSource ?? true,
        isNavigableTarget: payload.isNavigableTarget ?? true,
        extensionProperties: payload.extensionProperties ?? {},
        status: "DRAFT",
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassRelationship");
    return toClassRelationship(row);
  }

  async updateRelationship(
    payload: UpdateClassRelationshipPayload,
  ): Promise<ClassRelationship> {
    const existing = await db.query.classRelationships.findFirst({
      where: eq(classRelationships.id, payload.id),
    });
    if (!existing)
      throw new Error(`ClassRelationship not found with id: ${payload.id}`);

    const response = await db
      .update(classRelationships)
      .set({
        name: payload.name ?? existing.name,
        description: payload.description ?? existing.description,
        relationshipType: (payload.relationshipType ??
          existing.relationshipType) as
          | "ASSOCIATION"
          | "GENERALIZATION"
          | "REALIZATION"
          | "DEPENDENCY",
        aggregationKind: (payload.aggregationKind ??
          existing.aggregationKind) as "NONE" | "SHARED" | "COMPOSITE",
        isDisjoint: payload.isDisjoint ?? existing.isDisjoint,
        isComplete: payload.isComplete ?? existing.isComplete,
        isDerived: payload.isDerived ?? existing.isDerived,
        sourceMultiplicityLower:
          payload.sourceMultiplicityLower ?? existing.sourceMultiplicityLower,
        sourceMultiplicityUpper:
          payload.sourceMultiplicityUpper ?? existing.sourceMultiplicityUpper,
        targetMultiplicityLower:
          payload.targetMultiplicityLower ?? existing.targetMultiplicityLower,
        targetMultiplicityUpper:
          payload.targetMultiplicityUpper ?? existing.targetMultiplicityUpper,
        sourceRole: payload.sourceRole ?? existing.sourceRole,
        targetRole: payload.targetRole ?? existing.targetRole,
        isNavigableSource:
          payload.isNavigableSource ?? existing.isNavigableSource,
        isNavigableTarget:
          payload.isNavigableTarget ?? existing.isNavigableTarget,
        extensionProperties:
          payload.extensionProperties ?? existing.extensionProperties,
        updatedAt: new Date(),
      })
      .where(eq(classRelationships.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(`ClassRelationship not found with id: ${payload.id}`);
    return toClassRelationship(updated);
  }

  async removeRelationship(
    payload: RemoveClassRelationshipPayload,
  ): Promise<boolean> {
    await db
      .delete(classRelationshipLayouts)
      .where(eq(classRelationshipLayouts.classRelationshipId, payload.id));
    const result = await db
      .delete(classRelationships)
      .where(eq(classRelationships.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }

  // ─── ClassProperty ────────────────────────────────────────────────────────

  async findPropertiesByElementId(
    query: FindClassPropertiesByElementIdQuery,
  ): Promise<ClassProperty[]> {
    const rows = await db
      .select()
      .from(classProperties)
      .where(eq(classProperties.classElementId, query.classElementId))
      .orderBy(classProperties.ordering);
    return rows.map(toClassProperty);
  }

  async findPropertyById(
    query: FindClassElementByIdQuery,
  ): Promise<ClassProperty | null> {
    const row = await db.query.classProperties.findFirst({
      where: eq(classProperties.id, query.id),
    });
    return row ? toClassProperty(row) : null;
  }

  async createProperty(
    payload: CreateClassPropertyPayload,
  ): Promise<ClassProperty> {
    const response = await db
      .insert(classProperties)
      .values({
        classElementId: payload.classElementId,
        modelId: payload.modelId,
        layer: payload.layer,
        name: payload.name,
        description: payload.description ?? "",
        typeClassElementId: payload.typeClassElementId ?? null,
        typeLiteral: payload.typeLiteral ?? "",
        isStatic: payload.isStatic ?? false,
        isReadOnly: payload.isReadOnly ?? false,
        isDerived: payload.isDerived ?? false,
        isID: payload.isID ?? false,
        visibility: payload.visibility ?? "public",
        multiplicityLower: payload.multiplicityLower ?? 1,
        multiplicityUpper: payload.multiplicityUpper ?? "1",
        isOrdered: payload.isOrdered ?? false,
        isUnique: payload.isUnique ?? false,
        collectionKind: payload.collectionKind ?? "NONE",
        aggregationKind: payload.aggregationKind ?? "NONE",
        defaultValue: payload.defaultValue ?? "",
        ordering: payload.ordering ?? 0,
        status: "DRAFT",
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassProperty");
    return toClassProperty(row);
  }

  async updateProperty(
    payload: UpdateClassPropertyPayload,
  ): Promise<ClassProperty> {
    const existing = await db.query.classProperties.findFirst({
      where: eq(classProperties.id, payload.id),
    });
    if (!existing)
      throw new Error(`ClassProperty not found with id: ${payload.id}`);

    const response = await db
      .update(classProperties)
      .set({
        name: payload.name ?? existing.name,
        description: payload.description ?? existing.description,
        typeClassElementId:
          payload.typeClassElementId ?? existing.typeClassElementId,
        typeLiteral: payload.typeLiteral ?? existing.typeLiteral,
        isStatic: payload.isStatic ?? existing.isStatic,
        isReadOnly: payload.isReadOnly ?? existing.isReadOnly,
        isDerived: payload.isDerived ?? existing.isDerived,
        isID: payload.isID ?? existing.isID,
        visibility: (payload.visibility ?? existing.visibility) as
          | "public"
          | "private"
          | "protected"
          | "package",
        multiplicityLower:
          payload.multiplicityLower ?? existing.multiplicityLower,
        multiplicityUpper:
          payload.multiplicityUpper ?? existing.multiplicityUpper,
        isOrdered: payload.isOrdered ?? existing.isOrdered,
        isUnique: payload.isUnique ?? existing.isUnique,
        collectionKind: (payload.collectionKind ?? existing.collectionKind) as
          | "NONE"
          | "SET"
          | "BAG"
          | "SEQUENCE"
          | "ORDERED_SET",
        aggregationKind: (payload.aggregationKind ??
          existing.aggregationKind) as "NONE" | "SHARED" | "COMPOSITE",
        defaultValue: payload.defaultValue ?? existing.defaultValue,
        ordering: payload.ordering ?? existing.ordering,
        updatedAt: new Date(),
      })
      .where(eq(classProperties.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(`ClassProperty not found with id: ${payload.id}`);
    return toClassProperty(updated);
  }

  async removeProperty(payload: RemoveClassPropertyPayload): Promise<boolean> {
    const result = await db
      .delete(classProperties)
      .where(eq(classProperties.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }

  // ─── ClassOperation ──────────────────────────────────────────────────────

  async findOperationsByElementId(
    query: FindClassOperationsByElementIdQuery,
  ): Promise<ClassOperation[]> {
    const rows = await db
      .select()
      .from(classOperations)
      .where(eq(classOperations.classElementId, query.classElementId))
      .orderBy(classOperations.ordering);
    return rows.map(toClassOperation);
  }

  async findOperationById(
    query: FindClassElementByIdQuery,
  ): Promise<ClassOperation | null> {
    const row = await db.query.classOperations.findFirst({
      where: eq(classOperations.id, query.id),
    });
    return row ? toClassOperation(row) : null;
  }

  async createOperation(
    payload: CreateClassOperationPayload,
  ): Promise<ClassOperation> {
    const response = await db
      .insert(classOperations)
      .values({
        classElementId: payload.classElementId,
        modelId: payload.modelId,
        layer: payload.layer,
        name: payload.name,
        description: payload.description ?? "",
        returnTypeClassElementId: payload.returnTypeClassElementId ?? null,
        returnTypeLiteral: payload.returnTypeLiteral ?? "",
        returnMultiplicityLower: payload.returnMultiplicityLower ?? 1,
        returnMultiplicityUpper: payload.returnMultiplicityUpper ?? "1",
        isStatic: payload.isStatic ?? false,
        isAbstract: payload.isAbstract ?? false,
        visibility: payload.visibility ?? "public",
        ordering: payload.ordering ?? 0,
        status: "DRAFT",
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassOperation");
    return toClassOperation(row);
  }

  async updateOperation(
    payload: UpdateClassOperationPayload,
  ): Promise<ClassOperation> {
    const existing = await db.query.classOperations.findFirst({
      where: eq(classOperations.id, payload.id),
    });
    if (!existing)
      throw new Error(`ClassOperation not found with id: ${payload.id}`);

    const response = await db
      .update(classOperations)
      .set({
        name: payload.name ?? existing.name,
        description: payload.description ?? existing.description,
        returnTypeClassElementId:
          payload.returnTypeClassElementId ?? existing.returnTypeClassElementId,
        returnTypeLiteral:
          payload.returnTypeLiteral ?? existing.returnTypeLiteral,
        returnMultiplicityLower:
          payload.returnMultiplicityLower ?? existing.returnMultiplicityLower,
        returnMultiplicityUpper:
          payload.returnMultiplicityUpper ?? existing.returnMultiplicityUpper,
        isStatic: payload.isStatic ?? existing.isStatic,
        isAbstract: payload.isAbstract ?? existing.isAbstract,
        visibility: (payload.visibility ?? existing.visibility) as
          | "public"
          | "private"
          | "protected"
          | "package",
        ordering: payload.ordering ?? existing.ordering,
        updatedAt: new Date(),
      })
      .where(eq(classOperations.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(`ClassOperation not found with id: ${payload.id}`);
    return toClassOperation(updated);
  }

  async removeOperation(
    payload: RemoveClassOperationPayload,
  ): Promise<boolean> {
    await db
      .delete(classOperationParameters)
      .where(eq(classOperationParameters.classOperationId, payload.id));
    const result = await db
      .delete(classOperations)
      .where(eq(classOperations.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }

  // ─── ClassOperationParameter ─────────────────────────────────────────────

  async findParametersByOperationId(
    query: FindClassOperationParametersByOperationIdQuery,
  ): Promise<ClassOperationParameter[]> {
    const rows = await db
      .select()
      .from(classOperationParameters)
      .where(
        eq(classOperationParameters.classOperationId, query.classOperationId),
      )
      .orderBy(classOperationParameters.ordering);
    return rows.map(toClassOperationParameter);
  }

  async findParameterById(
    query: FindClassElementByIdQuery,
  ): Promise<ClassOperationParameter | null> {
    const row = await db.query.classOperationParameters.findFirst({
      where: eq(classOperationParameters.id, query.id),
    });
    return row ? toClassOperationParameter(row) : null;
  }

  async createParameter(
    payload: CreateClassOperationParameterPayload,
  ): Promise<ClassOperationParameter> {
    const response = await db
      .insert(classOperationParameters)
      .values({
        classOperationId: payload.classOperationId,
        modelId: payload.modelId,
        layer: payload.layer,
        name: payload.name,
        typeClassElementId: payload.typeClassElementId ?? null,
        typeLiteral: payload.typeLiteral ?? "",
        multiplicityLower: payload.multiplicityLower ?? 1,
        multiplicityUpper: payload.multiplicityUpper ?? "1",
        defaultValue: payload.defaultValue ?? "",
        direction: payload.direction ?? "IN",
        isOrdered: payload.isOrdered ?? false,
        isUnique: payload.isUnique ?? false,
        ordering: payload.ordering ?? 0,
        status: "DRAFT",
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassOperationParameter");
    return toClassOperationParameter(row);
  }

  async updateParameter(
    payload: UpdateClassOperationParameterPayload,
  ): Promise<ClassOperationParameter> {
    const existing = await db.query.classOperationParameters.findFirst({
      where: eq(classOperationParameters.id, payload.id),
    });
    if (!existing)
      throw new Error(
        `ClassOperationParameter not found with id: ${payload.id}`,
      );

    const response = await db
      .update(classOperationParameters)
      .set({
        name: payload.name ?? existing.name,
        typeClassElementId:
          payload.typeClassElementId ?? existing.typeClassElementId,
        typeLiteral: payload.typeLiteral ?? existing.typeLiteral,
        multiplicityLower:
          payload.multiplicityLower ?? existing.multiplicityLower,
        multiplicityUpper:
          payload.multiplicityUpper ?? existing.multiplicityUpper,
        defaultValue: payload.defaultValue ?? existing.defaultValue,
        direction: payload.direction ?? existing.direction,
        isOrdered: payload.isOrdered ?? existing.isOrdered,
        isUnique: payload.isUnique ?? existing.isUnique,
        ordering: payload.ordering ?? existing.ordering,
        updatedAt: new Date(),
      })
      .where(eq(classOperationParameters.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(
        `ClassOperationParameter not found with id: ${payload.id}`,
      );
    return toClassOperationParameter(updated);
  }

  async removeParameter(
    payload: RemoveClassOperationParameterPayload,
  ): Promise<boolean> {
    const result = await db
      .delete(classOperationParameters)
      .where(eq(classOperationParameters.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }

  // ─── ClassEnumerationLiteral ─────────────────────────────────────────────

  async findEnumerationLiteralsByElementId(
    query: FindClassEnumerationLiteralsByElementIdQuery,
  ): Promise<ClassEnumerationLiteral[]> {
    const rows = await db
      .select()
      .from(classEnumerationLiterals)
      .where(eq(classEnumerationLiterals.classElementId, query.classElementId))
      .orderBy(classEnumerationLiterals.ordering);
    return rows.map(toClassEnumerationLiteral);
  }

  async findEnumerationLiteralById(
    query: FindClassElementByIdQuery,
  ): Promise<ClassEnumerationLiteral | null> {
    const row = await db.query.classEnumerationLiterals.findFirst({
      where: eq(classEnumerationLiterals.id, query.id),
    });
    return row ? toClassEnumerationLiteral(row) : null;
  }

  async createEnumerationLiteral(
    payload: CreateClassEnumerationLiteralPayload,
  ): Promise<ClassEnumerationLiteral> {
    const response = await db
      .insert(classEnumerationLiterals)
      .values({
        classElementId: payload.classElementId,
        modelId: payload.modelId,
        layer: payload.layer,
        name: payload.name,
        value: payload.value ?? "",
        ordering: payload.ordering ?? 0,
        status: "DRAFT",
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassEnumerationLiteral");
    return toClassEnumerationLiteral(row);
  }

  async updateEnumerationLiteral(
    payload: UpdateClassEnumerationLiteralPayload,
  ): Promise<ClassEnumerationLiteral> {
    const existing = await db.query.classEnumerationLiterals.findFirst({
      where: eq(classEnumerationLiterals.id, payload.id),
    });
    if (!existing)
      throw new Error(
        `ClassEnumerationLiteral not found with id: ${payload.id}`,
      );

    const response = await db
      .update(classEnumerationLiterals)
      .set({
        name: payload.name ?? existing.name,
        value: payload.value ?? existing.value,
        ordering: payload.ordering ?? existing.ordering,
        updatedAt: new Date(),
      })
      .where(eq(classEnumerationLiterals.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(
        `ClassEnumerationLiteral not found with id: ${payload.id}`,
      );
    return toClassEnumerationLiteral(updated);
  }

  async removeEnumerationLiteral(
    payload: RemoveClassEnumerationLiteralPayload,
  ): Promise<boolean> {
    const result = await db
      .delete(classEnumerationLiterals)
      .where(eq(classEnumerationLiterals.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }

  // ─── ClassElementLayout (view positions) ──────────────────────────────────

  async findElementLayoutsByDiagramId(
    query: FindClassElementLayoutsByDiagramIdQuery,
  ): Promise<ClassElementLayout[]> {
    const rows = await db
      .select()
      .from(classElementLayouts)
      .where(eq(classElementLayouts.classDiagramId, query.classDiagramId));
    return rows.map(toClassElementLayout);
  }

  async findElementLayoutById(
    query: FindClassElementByIdQuery,
  ): Promise<ClassElementLayout | null> {
    const row = await db.query.classElementLayouts.findFirst({
      where: eq(classElementLayouts.id, query.id),
    });
    return row ? toClassElementLayout(row) : null;
  }

  async createElementLayout(
    payload: CreateClassElementLayoutPayload,
  ): Promise<ClassElementLayout> {
    const response = await db
      .insert(classElementLayouts)
      .values({
        classDiagramId: payload.classDiagramId,
        classElementId: payload.classElementId,
        description: payload.description ?? "",
        x: payload.x ?? 0,
        y: payload.y ?? 0,
        width: payload.width ?? 160,
        height: payload.height ?? 80,
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassElementLayout");
    return toClassElementLayout(row);
  }

  async updateElementLayout(
    payload: UpdateClassElementLayoutPayload,
  ): Promise<ClassElementLayout> {
    const existing = await db.query.classElementLayouts.findFirst({
      where: eq(classElementLayouts.id, payload.id),
    });
    if (!existing)
      throw new Error(`ClassElementLayout not found with id: ${payload.id}`);

    const response = await db
      .update(classElementLayouts)
      .set({
        description: payload.description ?? existing.description,
        x: payload.x ?? existing.x,
        y: payload.y ?? existing.y,
        width: payload.width ?? existing.width,
        height: payload.height ?? existing.height,
        updatedAt: new Date(),
      })
      .where(eq(classElementLayouts.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(`ClassElementLayout not found with id: ${payload.id}`);
    return toClassElementLayout(updated);
  }

  async removeElementLayout(
    payload: RemoveClassElementLayoutPayload,
  ): Promise<boolean> {
    const result = await db
      .delete(classElementLayouts)
      .where(eq(classElementLayouts.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }

  // ─── ClassRelationshipLayout ──────────────────────────────────────────────

  async findRelationshipLayoutsByDiagramId(
    query: FindClassRelationshipLayoutsByDiagramIdQuery,
  ): Promise<ClassRelationshipLayout[]> {
    const rows = await db
      .select()
      .from(classRelationshipLayouts)
      .where(eq(classRelationshipLayouts.classDiagramId, query.classDiagramId));
    return rows.map(toClassRelationshipLayout);
  }

  async findRelationshipLayoutById(
    query: FindClassElementByIdQuery,
  ): Promise<ClassRelationshipLayout | null> {
    const row = await db.query.classRelationshipLayouts.findFirst({
      where: eq(classRelationshipLayouts.id, query.id),
    });
    return row ? toClassRelationshipLayout(row) : null;
  }

  async createRelationshipLayout(
    payload: CreateClassRelationshipLayoutPayload,
  ): Promise<ClassRelationshipLayout> {
    const response = await db
      .insert(classRelationshipLayouts)
      .values({
        classDiagramId: payload.classDiagramId,
        classRelationshipId: payload.classRelationshipId,
        labelX: payload.labelX ?? null,
        labelY: payload.labelY ?? null,
        waypoints: payload.waypoints ?? [],
      })
      .returning();
    const [row] = response;
    if (!row) throw new Error("Failed to create ClassRelationshipLayout");
    return toClassRelationshipLayout(row);
  }

  async updateRelationshipLayout(
    payload: UpdateClassRelationshipLayoutPayload,
  ): Promise<ClassRelationshipLayout> {
    const existing = await db.query.classRelationshipLayouts.findFirst({
      where: eq(classRelationshipLayouts.id, payload.id),
    });
    if (!existing)
      throw new Error(
        `ClassRelationshipLayout not found with id: ${payload.id}`,
      );

    const response = await db
      .update(classRelationshipLayouts)
      .set({
        labelX: payload.labelX ?? existing.labelX,
        labelY: payload.labelY ?? existing.labelY,
        waypoints: payload.waypoints ?? existing.waypoints,
        updatedAt: new Date(),
      })
      .where(eq(classRelationshipLayouts.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated)
      throw new Error(
        `ClassRelationshipLayout not found with id: ${payload.id}`,
      );
    return toClassRelationshipLayout(updated);
  }

  async removeRelationshipLayout(
    payload: RemoveClassRelationshipLayoutPayload,
  ): Promise<boolean> {
    const result = await db
      .delete(classRelationshipLayouts)
      .where(eq(classRelationshipLayouts.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }
}
