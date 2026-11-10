import { validateRequiredName } from "../../domain/policies/naming";
import {
  ElementType,
  type ElementTypeValue,
} from "../../domain/value-objects/element-type";
import type { LayerValue } from "../../domain/value-objects/layer"; // adjust import path as needed

export type CreateElementDTOProps = {
  modelId: string;
  type: ElementTypeValue;
  name: string;
  parentId?: string;
  description?: string;
  layer: LayerValue;
};

export class CreateElementDTO {
  public readonly modelId: string;
  public readonly type: ElementTypeValue;
  public readonly name: string;
  public readonly parentId?: string;
  public readonly description?: string;
  public readonly layer: LayerValue;

  private constructor(props: CreateElementDTOProps) {
    this.modelId = props.modelId;
    this.type = props.type;
    this.name = props.name;
    this.parentId = props.parentId;
    this.description = props.description;
    this.layer = props.layer;
  }

  static create(props: {
    modelId: string;
    type: ElementTypeValue;
    name: string;
    parentId?: string;
    description?: string;
    layer: LayerValue;
  }): CreateElementDTO {
    return new CreateElementDTO({
      modelId: CreateElementDTO.validateModelId(props.modelId),
      type: CreateElementDTO.validateType(props.type),
      name: CreateElementDTO.validateName(props.name),
      parentId: CreateElementDTO.validateParentId(props.parentId),
      description: CreateElementDTO.validateDescription(props.description),
      layer: CreateElementDTO.validateLayer(props.layer),
    });
  }

  private static validateModelId(modelId: string): string {
    if (!modelId) {
      throw new Error("Model id is required");
    }
    const trimmed = modelId.trim();

    if (!trimmed) {
      throw new Error("Model ID cannot be empty");
    }

    if (trimmed.length > 255) {
      throw new Error("Model ID cannot exceed 255 characters");
    }

    return trimmed;
  }

  private static validateType(type: ElementTypeValue): ElementTypeValue {
    if (!type) throw new Error("Element type is required");
    return ElementType.from(type).value;
  }

  private static validateName(name: string): string {
    return validateRequiredName(name, {
      label: "Element name",
      maxLength: 100,
    });
  }

  private static validateParentId(parentId?: string): string | undefined {
    if (parentId === undefined || parentId === null) return undefined;

    const trimmed = parentId.trim();

    if (!trimmed) {
      throw new Error("Parent ID cannot be empty");
    }

    if (trimmed.length > 255) {
      throw new Error("Parent ID cannot exceed 255 characters");
    }

    return trimmed;
  }

  private static validateDescription(description?: string): string | undefined {
    if (description === undefined || description === null) return undefined;

    const trimmed = description.trim();

    if (trimmed.length === 0) return undefined;

    if (trimmed.length > 500) {
      throw new Error("Element description cannot exceed 500 characters");
    }

    return trimmed;
  }

  private static validateLayer(layer: LayerValue): LayerValue {
    if (!layer) {
      throw new Error("Layer is required");
    }

    // Adjust the list of valid layers based on your domain
    const validLayers: LayerValue[] = ["OA", "SA", "LA", "PA", "EPBS"];

    if (!validLayers.includes(layer)) {
      throw new Error(
        `Invalid layer. Must be one of: ${validLayers.join(", ")}`,
      );
    }

    return layer;
  }
}
