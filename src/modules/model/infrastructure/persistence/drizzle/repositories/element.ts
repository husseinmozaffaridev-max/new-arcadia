import type {
  CreateElementPayload,
  FindChildElementsQuery,
  FindElementsByIdQuery,
  FindElementsByLayerQuery,
  FindElementsByModelIdQuery,
  FindRootElementsQuery,
  IElementRepository,
  RemoveElementPayload,
  UpdateElementPayload,
} from "@/modules/model/application/ports/element";
import {
  type ElementProperties,
  ModelElement,
} from "@/modules/model/domain/entities/element";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { elements } from "../schemas/element";

type ElementRow = typeof elements.$inferSelect;

function toElement(row: ElementRow): ModelElement {
  return ModelElement.reconstitute({
    id: row.id,
    modelId: row.modelId,
    type: row.type,
    name: row.name,
    layer: row.layer,
    parentId: row.parentId,
    description: row.description,
    properties: row.properties as ElementProperties,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export class DrizzleElementRepository implements IElementRepository {
  async findElementsByLayer(
    query: FindElementsByLayerQuery,
  ): Promise<ModelElement[]> {
    const rows = await db
      .select()
      .from(elements)
      .where(eq(elements.modelId, query.modelId));

    return rows.filter((r) => r.layer === query.layer.value).map(toElement);
  }

  async findChildElements(
    query: FindChildElementsQuery,
  ): Promise<ModelElement[]> {
    const rows = await db
      .select()
      .from(elements)
      .where(eq(elements.parentId, query.parentId));

    return rows.map(toElement);
  }

  async findRootElements(
    query: FindRootElementsQuery,
  ): Promise<ModelElement[]> {
    const rows = await db
      .select()
      .from(elements)
      .where(eq(elements.modelId, query.modelId));
    return rows.filter((r) => r.parentId === null).map(toElement);
  }

  async findElementsByModelId(
    query: FindElementsByModelIdQuery,
  ): Promise<ModelElement[]> {
    const rows = await db
      .select()
      .from(elements)
      .where(eq(elements.modelId, query.modelId));
    return rows.map(toElement);
  }

  async findElementById(
    query: FindElementsByIdQuery,
  ): Promise<ModelElement | null> {
    const row = await db.query.elements.findFirst({
      where: eq(elements.id, query.id),
    });
    return row ? toElement(row) : null;
  }

  async createElement(payload: CreateElementPayload): Promise<ModelElement> {
    const response = await db
      .insert(elements)
      .values({
        parentId: payload.parentId ?? null,
        modelId: payload.modelId,
        type: payload.type,
        name: payload.name,
        layer: payload.layer,
        description: payload.description ?? "",
        properties: {
          status: "DRAFT",
          ...(payload.properties ?? {}),
        },
      })
      .returning();
    const [row] = response;

    if (!row) throw new Error("Failed to create element");

    return toElement(row);
  }

  async updateElement(payload: UpdateElementPayload): Promise<ModelElement> {
    const existing = await db.query.elements.findFirst({
      where: eq(elements.id, payload.id),
    });
    if (!existing) throw new Error(`Element not found with id : ${payload.id}`);

    const currentProps = existing.properties as ElementProperties;

    const newProps = payload.properties
      ? { ...currentProps, ...payload.properties }
      : currentProps;

    const now = new Date();

    const response = await db
      .update(elements)
      .set({
        name: payload.name,
        properties: newProps,
        description: payload.description ?? existing.description,
        ...(payload.parentId !== undefined && { parentId: payload.parentId }),
        updatedAt: now,
      })
      .where(eq(elements.id, payload.id))
      .returning();

    const [updated] = response;
    if (!updated) throw new Error(`Element not found with id : ${payload.id}`);
    return toElement(updated);
  }

  async removeElement(payload: RemoveElementPayload): Promise<boolean> {
    const result = await db.delete(elements).where(eq(elements.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }
}
