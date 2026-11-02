import type { IUseCase } from "@/modules/shared/application/interfaces/use-case";
import { resolveErrorMessage } from "@/modules/shared/utils/resolve-error-message";
import {
  findAvailableCountedName,
  findAvailableName,
} from "../../../domain/policies/uniqueness";
import { ClassElementType } from "../../../domain/value-objects/class-element-type";
import { Layer } from "../../../domain/value-objects/layer";
import type {
  CreateClassElementPayload,
  IClassDiagramRepository,
} from "../../ports/class-diagram";

export type CreateClassElementUseCasePayload = {
  payload: CreateClassElementPayload;
  context: {
    token: string;
  };
};

export type CreateClassElementUseCaseResponse = {
  id: string;
  modelId: string;
  layer: string;
  name: string;
  description: string;
  elementType: string;
  visibility: string;
  isAbstract: boolean;
  isStatic: boolean;
  parentId: string | null;
  ordering: number;
  status: string;
  extensionProperties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export class CreateClassElementUseCase
  implements
    IUseCase<
      CreateClassElementUseCasePayload,
      CreateClassElementUseCaseResponse
    >
{
  constructor(private readonly repository: IClassDiagramRepository) {}

  async execute({
    payload,
  }: CreateClassElementUseCasePayload): Promise<CreateClassElementUseCaseResponse> {
    try {
      // Validate element type
      ClassElementType.from(payload.elementType);

      // Validate layer
      Layer.from(payload.layer);

      // Validate parent exists and belongs to same model
      if (payload.parentId) {
        const parent = await this.repository.findElementById({
          id: payload.parentId,
        });
        if (!parent) {
          throw new Error(
            `Parent element not found with id: ${payload.parentId}`,
          );
        }
        if (parent.modelId !== payload.modelId) {
          throw new Error("Parent element must belong to the same model");
        }
      }

      const siblings = await this.repository.findElementsByModelId({
        modelId: payload.modelId,
      });

      const element = await this.repository.createElement({
        ...payload,
        name: findAvailableCountedName(
          payload.name,
          siblings.map((sibling) => sibling.name),
        ),
      });

      return element.toJSON();
    } catch (error) {
      throw new Error(
        resolveErrorMessage(error, "Error creating class element"),
      );
    }
  }
}
