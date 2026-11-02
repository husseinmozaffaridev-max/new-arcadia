import type { IUseCase } from "@/modules/shared/application/interfaces/use-case";
import { resolveErrorMessage } from "@/modules/shared/utils/resolve-error-message";
import type { ElementProperties } from "../../domain/entities/element";
import { SHORT_NAME_MAX_LENGTH } from "../../domain/policies/naming";
import {
  findAvailableCountedName,
  findAvailableName,
} from "../../domain/policies/uniqueness";
import {
  ElementType,
  type ElementTypeValue,
} from "../../domain/value-objects/element-type";
import { Layer, type LayerValue } from "../../domain/value-objects/layer";
import type { IElementRepository } from "../ports/element";
import type { IModelRepository } from "./../ports/model";

export type CreateElementPayload = {
  payload: {
    modelId: string;
    type: ElementTypeValue;
    name: string;
    parentId?: string;
    description?: string;
    layer: LayerValue;
  };
  context: {
    token: string;
  };
};

export type CreateElementResponse = {
  id: string;
  modelId: string;
  name: string;
  description?: string;
  type: ElementTypeValue;
  parentId?: string | null;
  updatedAt: string;
  createdAt: string;
  layer: LayerValue;
  properties: ElementProperties;
};

export class CreateElementUseCase
  implements IUseCase<CreateElementPayload, CreateElementResponse>
{
  constructor(
    private readonly modelRepository: IModelRepository,
    private readonly elementRepository: IElementRepository,
  ) {}

  async execute({
    payload,
  }: CreateElementPayload): Promise<CreateElementResponse> {
    try {
      const model = await this.modelRepository.findModelById(payload.modelId);

      if (!model)
        throw new Error(`Model not found with id : ${payload.modelId}`);

      const layer = Layer.from(payload.layer);

      if (!model.layer.equals(layer)) {
        throw new Error(
          `Layer mismatch: model is ${model.layer.label} but element layer is ${layer.label}`,
        );
      }

      if (payload.parentId) {
        const parent = await this.elementRepository.findElementById({
          id: payload.parentId,
        });
        if (!parent)
          throw new Error(`Parent element "${payload.parentId}" not found`);
        if (!parent.layer.equals(layer)) {
          throw new Error("Parent element must be in the same layer");
        }
        if (parent.type.isActor()) {
          throw new Error("Actors cannot be decomposed or contain child elements");
        }
      }

      const elementType = ElementType.from(payload.type);
      if (payload.parentId && elementType.isActor()) {
        throw new Error("Actors cannot be decomposed or nested inside other elements");
      }

      const siblings = await this.elementRepository.findElementsByModelId({
        modelId: payload.modelId,
      });

      const name = findAvailableCountedName(
        payload.name,
        siblings.map((sibling) => sibling.name),
        { maxLength: SHORT_NAME_MAX_LENGTH },
      );

      const response = await this.elementRepository.createElement({
        modelId: payload.modelId,
        layer: layer.toString(),
        parentId: payload.parentId ?? null,
        type: ElementType.from(payload.type).toString(),
        name,
        description: payload.description,
      });

      return response.toJSON();
    } catch (error) {
      throw new Error(resolveErrorMessage(error, "Error in create element"));
    }
  }
}
