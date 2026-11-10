import type { IUseCase } from "@/modules/shared/application/interfaces/use-case";
import { resolveErrorMessage } from "@/modules/shared/utils/resolve-error-message";
import type { ElementLayout, Viewport } from "../../domain/entities/diagram";
import type { IDiagramRepository } from "../ports/diagram";

export type UpdateDiagramLayoutPayload = {
  payload: {
    id: string;
    viewport?: Viewport;
    elementLayouts?: ElementLayout[];
    visibleRelationshipIds?: string[];
  };
  context: {
    token: string;
  };
};

export type UpdateDiagramLayoutResponse = {
  id: string;
  modelId: string;
  type: string;
  viewport: Viewport;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  elementLayouts: ElementLayout[];
  visibleRelationshipIds: ReadonlyArray<string> | null;
};

/**
 * UpdateDiagramLayoutUseCase
 *
 * Business rules:
 * 1. دیاگرام باید وجود داشته باشد
 * 2. layout شامل موقعیت و اندازه المنت‌ها و viewport می‌شود
 */
export class UpdateDiagramLayoutUseCase
  implements IUseCase<UpdateDiagramLayoutPayload, UpdateDiagramLayoutResponse>
{
  constructor(private readonly diagramRepository: IDiagramRepository) {}

  async execute({
    payload,
  }: UpdateDiagramLayoutPayload): Promise<UpdateDiagramLayoutResponse> {
    try {
      const diagram = await this.diagramRepository.findById({ id: payload.id });
      if (!diagram)
        throw new Error(`Diagram not found with id : ${payload.id}`);

      diagram.updateViewport({ ...diagram.viewport, ...payload.viewport });
      if (payload.visibleRelationshipIds !== undefined) {
        diagram.setVisibleRelationships(payload.visibleRelationshipIds);
      }

      const response = await this.diagramRepository.updateLayout({
        id: payload.id,
        viewport: {
          ...diagram.viewport,
          visibleRelationshipIds:
            diagram.visibleRelationshipIds === null
              ? undefined
              : [...diagram.visibleRelationshipIds],
        },
        elementLayouts: payload.elementLayouts,
      });

      return response.toJSON();
    } catch (error) {
      throw new Error(
        resolveErrorMessage(error, "Error in update diagram layout"),
      );
    }
  }
}
