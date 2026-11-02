import type {
  ElementProperties,
  ElementStatus,
} from "../../domain/entities/element";
import { validateRequiredName } from "../../domain/policies/naming";

export type UpdateElementDTOProps = {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  properties?: ElementProperties;
};

export class UpdateElementDTO {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly parentId?: string | null;
  public readonly properties?: ElementProperties;

  private constructor(props: UpdateElementDTOProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.parentId = props.parentId;
    this.properties = props.properties;
  }

  static create(props: {
    id: string;
    name: string;
    description?: string;
    parentId?: string | null;
    properties?: ElementProperties;
  }): UpdateElementDTO {
    return new UpdateElementDTO({
      id: UpdateElementDTO.validateId(props.id),
      name: UpdateElementDTO.validateName(props.name),
      description: UpdateElementDTO.validateDescription(props.description),
      parentId: props.parentId,
      properties: UpdateElementDTO.validateProperties(props.properties),
    });
  }

  private static validateId(id: string): string {
    const trimmed = id.trim();
    if (!trimmed) {
      throw new Error("Element ID cannot be empty");
    }
    if (trimmed.length > 255) {
      throw new Error("Element ID cannot exceed 255 characters");
    }
    return trimmed;
  }

  private static validateName(name: string): string {
    return validateRequiredName(name, {
      label: "Element name",
      maxLength: 100,
    });
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

  private static validateProperties(
    properties?: ElementProperties,
  ): ElementProperties | undefined {
    if (properties === undefined || properties === null) return undefined;

    if (typeof properties !== "object" || Array.isArray(properties)) {
      throw new Error("Properties must be an object");
    }

    // Validate status if present
    if (properties.status !== undefined) {
      const validStatuses: ElementStatus[] = [
        "DEPRECATED",
        "DRAFT",
        "VALIDATED",
      ];
      if (!validStatuses.includes(properties.status)) {
        throw new Error(
          `Element status must be one of: ${validStatuses.join(", ")}`,
        );
      }
    }

    // Validate stereotype if present
    if (properties.stereotype !== undefined) {
      if (typeof properties.stereotype !== "string") {
        throw new Error("Stereotype must be a string");
      }
      const trimmed = properties.stereotype.trim();
      if (trimmed.length > 100) {
        throw new Error("Stereotype cannot exceed 100 characters");
      }
      // Optionally store trimmed
      properties.stereotype = trimmed;
    }

    // No validation for other dynamic keys (they can be anything)
    return properties;
  }
}
