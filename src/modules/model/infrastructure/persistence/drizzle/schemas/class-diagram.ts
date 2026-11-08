import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { models } from "./model";

// ─── eee Enums ─────────────────────────────────────────────────────────────────────

export const classElementTypeEnum = pgEnum("class_element_type", [
  "CLASS",
  "INTERFACE",
  "ENUM",
  "DATA_TYPE",
  "PRIMITIVE",
  "COLLECTION",
  "UNION",
  "PACKAGE",
  "GROUP",
]);

/**
 * Relationship kinds aligned with Capella's metamodel:
 *   - ASSOCIATION   (plain, aggregation, composition determined by isAggregate/isComposite flags)
 *   - GENERALIZATION (UML is-a)
 *   - REALIZATION   (UML implements interface)
 *   - DEPENDENCY    (UML uses)
 *
 * NOTE: DIRECTED_ASSOCIATION has been removed. Direction is expressed via the
 * isNavigableSource/isNavigableTarget flags present on the row.
 */
export const classRelationshipTypeEnum = pgEnum("class_relationship_type", [
  "ASSOCIATION",
  "GENERALIZATION",
  "REALIZATION",
  "DEPENDENCY",
]);

export const classStatusEnum = pgEnum("class_status", [
  "DRAFT",
  "VALIDATED",
  "DEPRECATED",
]);

export const classVisibilityEnum = pgEnum("class_visibility", [
  "public",
  "private",
  "protected",
  "package",
]);

/** UML-style collection kinds for typed Properties (Capella `Collection`). */
export const classCollectionKindEnum = pgEnum("class_collection_kind", [
  "NONE",
  "SET",
  "BAG",
  "SEQUENCE",
  "ORDERED_SET",
]);

/** Parameter direction (IN, OUT, INOUT) — UML/Capella standard. */
export const classParameterDirectionEnum = pgEnum("class_parameter_direction", [
  "IN",
  "OUT",
  "INOUT",
  "RETURN",
]);

/** Aggregation kind (NONE, SHARED, COMPOSITE) — UML/Capella standard. */
export const aggregationKindEnum = pgEnum("aggregation_kind", [
  "NONE",
  "SHARED",
  "COMPOSITE",
]);

// ─── Tables ────────────────────────────────────────────────────────────────────

/**
 * ClassDiagram — a *view* over the Model's data package.
 *
 * Per ARCADIA/Capella semantics:
 *  - A ClassDiagram is owned by a Model (layer-scoped), not by individual elements.
 *  - Elements/relationships belong to the Model, NOT to the diagram.
 *  - A diagram just stores layout decisions (which element is drawn where).
 */
export const classDiagrams = pgTable("class_diagrams", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: varchar("layer", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  status: classStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ClassElement — owns identity; belongs to a Model (NOT a ClassDiagram).
 * A single element can be displayed on many diagrams via ClassElementLayout rows.
 */
export const classElements = pgTable("class_elements", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: varchar("layer", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  elementType: classElementTypeEnum("element_type").notNull(),
  visibility: classVisibilityEnum("visibility").default("public").notNull(),
  isAbstract: boolean("is_abstract").default(false).notNull(),
  isStatic: boolean("is_static").default(false).notNull(),
  parentId: uuid("parent_id"),
  ordering: integer("ordering").default(0).notNull(),
  status: classStatusEnum("status").default("DRAFT").notNull(),
  extensionProperties: jsonb("extension_properties").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ClassProperty — UML Property / Capella Property.
 * Owned by a ClassElement (the parent class). Typed reference via typeClassElementId.
 */
export const classProperties = pgTable("class_properties", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  classElementId: uuid("class_element_id")
    .references(() => classElements.id, { onDelete: "cascade" })
    .notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: varchar("layer", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  /** Reference to another ClassElement that types this property (referential integrity) */
  typeClassElementId: uuid("type_class_element_id"),
  /** Free-text fallback for primitive/external types (used when no typeClassElementId) */
  typeLiteral: varchar("type_literal", { length: 255 }).default("").notNull(),
  isStatic: boolean("is_static").default(false).notNull(),
  isReadOnly: boolean("is_read_only").default(false).notNull(),
  isDerived: boolean("is_derived").default(false).notNull(),
  isID: boolean("is_id").default(false).notNull(),
  visibility: classVisibilityEnum("visibility").default("public").notNull(),
  multiplicityLower: integer("multiplicity_lower").default(1).notNull(),
  multiplicityUpper: varchar("multiplicity_upper", { length: 32 })
    .default("1")
    .notNull(),
  isOrdered: boolean("is_ordered").default(false).notNull(),
  isUnique: boolean("is_unique").default(false).notNull(),
  collectionKind: classCollectionKindEnum("collection_kind")
    .default("NONE")
    .notNull(),
  aggregationKind: aggregationKindEnum("aggregation_kind")
    .default("NONE")
    .notNull(),
  defaultValue: text("default_value").default("").notNull(),
  ordering: integer("ordering").default(0).notNull(),
  status: classStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ClassOperation — UML Operation / Capella Operation.
 * Owned by a ClassElement. Has Parameters (separate table).
 */
export const classOperations = pgTable("class_operations", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  classElementId: uuid("class_element_id")
    .references(() => classElements.id, { onDelete: "cascade" })
    .notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: varchar("layer", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  /** Typed return reference */
  returnTypeClassElementId: uuid("return_type_class_element_id"),
  returnTypeLiteral: varchar("return_type_literal", { length: 255 })
    .default("")
    .notNull(),
  returnMultiplicityLower: integer("return_multiplicity_lower")
    .default(1)
    .notNull(),
  returnMultiplicityUpper: varchar("return_multiplicity_upper", { length: 32 })
    .default("1")
    .notNull(),
  isStatic: boolean("is_static").default(false).notNull(),
  isAbstract: boolean("is_abstract").default(false).notNull(),
  isQuery: boolean("is_query").default(false).notNull(),
  visibility: classVisibilityEnum("visibility").default("public").notNull(),
  ordering: integer("ordering").default(0).notNull(),
  status: classStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ClassOperationParameter — Parameter of an Operation.
 * Typed by a ClassElement (referential integrity).
 */
export const classOperationParameters = pgTable("class_operation_parameters", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  classOperationId: uuid("class_operation_id")
    .references(() => classOperations.id, { onDelete: "cascade" })
    .notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: varchar("layer", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  typeClassElementId: uuid("type_class_element_id"),
  typeLiteral: varchar("type_literal", { length: 255 }).default("").notNull(),
  multiplicityLower: integer("multiplicity_lower").default(1).notNull(),
  multiplicityUpper: varchar("multiplicity_upper", { length: 32 })
    .default("1")
    .notNull(),
  defaultValue: text("default_value").default("").notNull(),
  direction: classParameterDirectionEnum("direction").default("IN").notNull(),
  isOrdered: boolean("is_ordered").default(false).notNull(),
  isUnique: boolean("is_unique").default(false).notNull(),
  ordering: integer("ordering").default(0).notNull(),
  status: classStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ClassEnumerationLiteral — values of a ClassElement of type ENUM.
 * The owning ClassElement must have elementType = 'ENUM'.
 */
export const classEnumerationLiterals = pgTable("class_enumeration_literals", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  classElementId: uuid("class_element_id")
    .references(() => classElements.id, { onDelete: "cascade" })
    .notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: varchar("layer", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).default("").notNull(),
  ordering: integer("ordering").default(0).notNull(),
  status: classStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ClassRelationship — relationship between two ClassElements; owned by Model.
 *
 * Capella alignment:
 *  - ASSOCIATION kind covers plain/aggregation/composition (distinguished by
 *    aggregationKind), not by three separate relationship types.
 *  - Directionality captured by isNavigableSource/isNavigableTarget flags.
 */
export const classRelationships = pgTable("class_relationships", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: varchar("layer", { length: 10 }).notNull(),
  sourceElementId: uuid("source_element_id")
    .references(() => classElements.id, { onDelete: "cascade" })
    .notNull(),
  targetElementId: uuid("target_element_id")
    .references(() => classElements.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  relationshipType: classRelationshipTypeEnum("relationship_type").notNull(),
  /** Aggregation kind (NONE, SHARED, COMPOSITE) - Capella standard */
  aggregationKind: aggregationKindEnum("aggregation_kind")
    .default("NONE")
    .notNull(),
  /** Generalization constraints (for GENERALIZATION relationships) */
  isDisjoint: boolean("is_disjoint").default(false).notNull(),
  isComplete: boolean("is_complete").default(false).notNull(),
  isDerived: boolean("is_derived").default(false).notNull(),
  sourceMultiplicityLower: integer("source_multiplicity_lower")
    .default(1)
    .notNull(),
  sourceMultiplicityUpper: varchar("source_multiplicity_upper", { length: 32 })
    .default("*")
    .notNull(),
  targetMultiplicityLower: integer("target_multiplicity_lower")
    .default(1)
    .notNull(),
  targetMultiplicityUpper: varchar("target_multiplicity_upper", { length: 32 })
    .default("*")
    .notNull(),
  sourceRole: varchar("source_role", { length: 255 }).default("").notNull(),
  targetRole: varchar("target_role", { length: 255 }).default("").notNull(),
  isNavigableSource: boolean("is_navigable_source").default(true).notNull(),
  isNavigableTarget: boolean("is_navigable_target").default(true).notNull(),
  status: classStatusEnum("status").default("DRAFT").notNull(),
  extensionProperties: jsonb("extension_properties").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ClassElementLayout — a *view* decision: where element X is rendered on diagram Y.
 * This is the ONLY table that links an element to a specific ClassDiagram.
 */
export const classElementLayouts = pgTable("class_element_layouts", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  classDiagramId: uuid("class_diagram_id")
    .references(() => classDiagrams.id, { onDelete: "cascade" })
    .notNull(),
  classElementId: uuid("class_element_id")
    .references(() => classElements.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").default("").notNull(),
  x: real("x").default(0).notNull(),
  y: real("y").default(0).notNull(),
  width: real("width").default(160).notNull(),
  height: real("height").default(80).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ClassRelationshipLayout — same idea for relationship rendering decorations
 * (e.g. label positions, waypoints). Optional; one row per (diagram, relationship).
 */
export const classRelationshipLayouts = pgTable("class_relationship_layouts", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  classDiagramId: uuid("class_diagram_id")
    .references(() => classDiagrams.id, { onDelete: "cascade" })
    .notNull(),
  classRelationshipId: uuid("class_relationship_id")
    .references(() => classRelationships.id, { onDelete: "cascade" })
    .notNull(),
  labelX: integer("label_x"),
  labelY: integer("label_y"),
  sourceRoleLabelX: integer("source_role_label_x"),
  sourceRoleLabelY: integer("source_role_label_y"),
  targetRoleLabelX: integer("target_role_label_x"),
  targetRoleLabelY: integer("target_role_label_y"),
  sourceMultLabelX: integer("source_mult_label_x"),
  sourceMultLabelY: integer("source_mult_label_y"),
  targetMultLabelX: integer("target_mult_label_x"),
  targetMultLabelY: integer("target_mult_label_y"),
  waypoints: jsonb("waypoints").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
