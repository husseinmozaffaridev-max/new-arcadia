import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { models } from "./model";
import { classElements } from "./class-diagram";

export const exchangeItems = pgTable("exchange_items", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  /** Reference to a ClassElement of type INTERFACE that defines this exchange item's contract */
  interfaceClassElementId: uuid("interface_class_element_id").references(
    () => classElements.id,
    { onDelete: "set null" },
  ),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  exchangeType: varchar("exchange_type", { length: 32 }).notNull(),
  protocol: varchar("protocol", { length: 128 }).default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exchangeItemElements = pgTable("exchange_item_elements", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  exchangeItemId: uuid("exchange_item_id")
    .references(() => exchangeItems.id, { onDelete: "cascade" })
    .notNull(),
  /** Optional: typed reference to a ClassElement (the data type of this element) */
  typeClassElementId: uuid("type_class_element_id").references(
    () => classElements.id,
    { onDelete: "set null" },
  ),
  name: varchar("name", { length: 255 }).notNull(),
  /** Free-text fallback when no typeClassElementId */
  dataType: varchar("data_type", { length: 128 }).default("").notNull(),
  isRequired: boolean("is_required").default(false).notNull(),
  defaultValue: varchar("default_value", { length: 255 }).default("").notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ExchangeItemAllocation — allocates an ExchangeItem to an Interface (ClassElement of type INTERFACE)
 * on a specific ClassDiagram/Model layer. Capella-style Interface ↔ ExchangeItem allocation.
 */
export const exchangeItemAllocations = pgTable("exchange_item_allocations", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  exchangeItemId: uuid("exchange_item_id")
    .references(() => exchangeItems.id, { onDelete: "cascade" })
    .notNull(),
  interfaceClassElementId: uuid("interface_class_element_id")
    .references(() => classElements.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
