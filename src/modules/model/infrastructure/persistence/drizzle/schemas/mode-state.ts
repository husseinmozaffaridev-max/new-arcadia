import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { models } from "./model";

export const layerEnum = pgEnum("layer", ["SA", "LA", "PA"]);
export const modeTypeEnum = pgEnum("mode_type", ["INITIAL", "FINAL", "NORMAL"]);
export const stateTypeEnum = pgEnum("state_type", [
  "INITIAL",
  "FINAL",
  "NORMAL",
]);

export const modes = pgTable("modes", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: layerEnum("layer").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  isInitial: boolean("is_initial").default(false).notNull(),
  isFinal: boolean("is_final").default(false).notNull(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  layer: layerEnum("layer").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  isInitial: boolean("is_initial").default(false).notNull(),
  isFinal: boolean("is_final").default(false).notNull(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stateTransitions = pgTable("state_transitions", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" })
    .notNull(),
  sourceStateId: uuid("source_state_id")
    .references(() => states.id, { onDelete: "cascade" })
    .notNull(),
  targetStateId: uuid("target_state_id")
    .references(() => states.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  trigger: varchar("trigger", { length: 255 }).default("").notNull(),
  guard: varchar("guard", { length: 500 }).default("").notNull(),
  effect: varchar("effect", { length: 500 }).default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
