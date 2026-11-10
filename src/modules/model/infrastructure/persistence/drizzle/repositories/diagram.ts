import { eq } from "drizzle-orm";
import type {
  CreateDiagramPayload,
  FindByIdQuery,
  FindByModelIdQuery,
  IDiagramRepository,
  RemoveDiagramPayload,
  UpdateDiagramLayoutPayload,
  UpdateDiagramPayload,
} from "@/modules/model/application/ports/diagram";
import {
  Diagram,
  type ElementLayout,
  type Viewport,
} from "@/modules/model/domain/entities/diagram";
import { db } from "../client";
import { diagrams } from "../schemas/diagram";

type DiagramRow = typeof diagrams.$inferSelect;

function toEntity(row: DiagramRow): Diagram {
  // Parse JSON strings back to objects
  const storedViewport: Viewport = row.viewport
    ? typeof row.viewport === "string"
      ? (JSON.parse(row.viewport) as Viewport)
      : (row.viewport as Viewport)
    : { x: 0, y: 0, zoom: 1 };
  const viewport: Viewport = {
    x: storedViewport.x,
    y: storedViewport.y,
    zoom: storedViewport.zoom,
  };

  const elementLayouts: ElementLayout[] = row.elementLayouts
    ? (row.elementLayouts as ElementLayout[])
    : [];

  return Diagram.reconstitute({
    id: row.id,
    modelId: row.modelId,
    type: row.type,
    name: row.name,
    description: row.description ?? "",
    viewport,
    elementLayouts,
    visibleRelationshipIds: storedViewport.visibleRelationshipIds ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export class DrizzleDiagramRepository implements IDiagramRepository {
  async findByModelId(query: FindByModelIdQuery): Promise<Diagram[]> {
    const rows = await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.modelId, query.modelId));
    return rows.map(toEntity);
  }

  async findById(query: FindByIdQuery): Promise<Diagram | null> {
    const row = await db.query.diagrams.findFirst({
      where: eq(diagrams.id, query.id),
    });
    return row ? toEntity(row) : null;
  }

  async create(payload: CreateDiagramPayload): Promise<Diagram> {
    const response = await db
      .insert(diagrams)
      .values({
        modelId: payload.modelId,
        type: payload.type.value,
        name: payload.name,
        description: payload.description ?? "",
        viewport: { x: 0, y: 0, zoom: 1, visibleRelationshipIds: [] },
        elementLayouts: [],
      })
      .returning();

    const [row] = response;

    if (!row) throw new Error("Failed to create diagram");

    return toEntity(row);
  }

  async update(payload: UpdateDiagramPayload): Promise<Diagram> {
    const now = new Date();
    const response = await db
      .update(diagrams)
      .set({
        name: payload.name,
        description: payload.description ?? "",
        updatedAt: now,
      })
      .where(eq(diagrams.id, payload.id))
      .returning();
    const [updated] = response;
    if (!updated) throw new Error(`Diagram not found with id : ${payload.id}`);
    return toEntity(updated);
  }

  async updateLayout(payload: UpdateDiagramLayoutPayload): Promise<Diagram> {
    const now = new Date();
    const updateData: Partial<typeof diagrams.$inferInsert> = {
      updatedAt: now,
    };

    if (payload.viewport !== undefined) {
      updateData.viewport = payload.viewport;
    }

    if (payload.elementLayouts !== undefined) {
      updateData.elementLayouts = payload.elementLayouts;
    }

    const response = await db
      .update(diagrams)
      .set(updateData)
      .where(eq(diagrams.id, payload.id))
      .returning();
    const [row] = response;
    if (!row) throw new Error(`Diagram not found with id : ${payload.id}`);
    return toEntity(row);
  }

  async remove(payload: RemoveDiagramPayload): Promise<boolean> {
    const result = await db.delete(diagrams).where(eq(diagrams.id, payload.id));
    return (result?.rowCount ?? 0) > 0;
  }
}
