import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { scenarios } from "./scenario";
import { classElements } from "./class-diagram";

export const scenarioLifelines = pgTable("scenario_lifelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id")
    .references(() => scenarios.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  /** Type of element this lifeline represents (e.g., "ClassElement", "Function", "Actor") */
  representedElementType: varchar("represented_element_type", {
    length: 50,
  }).notNull(),
  /** Reference to the represented element (e.g., ClassElement id for structural scenarios) */
  representedElementId: uuid("represented_element_id").references(
    () => classElements.id,
    { onDelete: "set null" },
  ),
  /** Free-text fallback for external/legacy elements without a ClassElement reference */
  representedElementExternalId: varchar("represented_element_external_id", {
    length: 255,
  }),
  columnIndex: integer("column_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
