import type { IUseCase } from "@/modules/shared/application/interfaces/use-case";
import { resolveErrorMessage } from "@/modules/shared/utils/resolve-error-message";
import type { ElementProperties } from "../../domain/entities/element";
import {
  duplicateNameMessage,
  isDuplicateName,
} from "../../domain/policies/uniqueness";
import type { IElementRepository } from "../ports/element";

export type UpdateElementPayload = {
  payload: {
    id: string;
    name: string;
    description?: string;
    parentId?: string | null;
    properties?: ElementProperties;
  };
  context: {
    token: string;
  };
};

export type UpdateElementResponse = {
  id: string;
  modelId: string;
  name: string;
  description?: string;
  type: string;
  parentId?: string | null;
  updatedAt: string;
  createdAt: string;
  properties: ElementProperties;
};

/**
 * UpdateElementUseCase
 *
 * Business rules:
 * 1. المنت باید وجود داشته باشد
 * 2. نام اگر داده شود نمی‌تواند خالی باشد
 * 3. المنت deprecated نمی‌تواند به VALIDATED تغییر وضعیت دهد
 */
export class UpdateElementUseCase
  implements IUseCase<UpdateElementPayload, UpdateElementResponse>
{
  constructor(private readonly elementRepository: IElementRepository) {}

  async execute({
    payload,
  }: UpdateElementPayload): Promise<UpdateElementResponse> {
    try {
      const element = await this.elementRepository.findElementById({
        id: payload.id,
      });

      if (!element)
        throw new Error(`Element not found with id : ${payload.id}`);

      if (
        payload.properties?.status === "VALIDATED" &&
        element.isDeprecated()
      ) {
        throw new Error("Element is deprecated and can't update");
      }

      const siblings = await this.elementRepository.findElementsByModelId({
        modelId: element.modelId,
      });

      if (isDuplicateName(payload.name, siblings, element.id)) {
        throw new Error(
          duplicateNameMessage("element", payload.name, "this layer"),
        );
      }

      element.rename(payload.name);

      if (payload.parentId) {
        if (element.type.isActor()) {
          throw new Error(
            "Actors cannot be decomposed or nested inside other elements",
          );
        }
        const parent = await this.elementRepository.findElementById({
          id: payload.parentId,
        });
        if (!parent)
          throw new Error(`Parent element "${payload.parentId}" not found`);
        if (parent.type.isActor()) {
          throw new Error(
            "Actors cannot be decomposed or contain child elements",
          );
        }
      }

      element.updateDescription(payload.description);

      element.updateProperties({ ...payload.properties });

      const response = await this.elementRepository.updateElement({
        id: payload.id,
        name: element.name,
        description: element.description,
        parentId: payload.parentId,
        properties: element.properties,
      });

      return response.toJSON();
    } catch (error) {
      throw new Error(resolveErrorMessage(error, "Error in update element"));
    }
  }
}
