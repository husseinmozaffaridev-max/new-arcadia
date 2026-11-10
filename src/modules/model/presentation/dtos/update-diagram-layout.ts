import type { ElementLayout, Viewport } from "../../domain/entities/diagram";

export type UpdateDiagramLayoutDTOProps = {
  id: string;
  viewport?: Viewport;
  elementLayouts?: ElementLayout[];
  visibleRelationshipIds?: string[];
};

export class UpdateDiagramLayoutDTO {
  public readonly id: string;
  public readonly viewport?: Viewport;
  public readonly elementLayouts?: ElementLayout[];
  public readonly visibleRelationshipIds?: string[];

  private constructor(props: UpdateDiagramLayoutDTOProps) {
    this.id = props.id;
    this.viewport = props.viewport;
    this.elementLayouts = props.elementLayouts;
    this.visibleRelationshipIds = props.visibleRelationshipIds;
  }

  static create(props: {
    id: string;
    viewport?: Viewport;
    elementLayouts?: ElementLayout[];
    visibleRelationshipIds?: string[];
  }): UpdateDiagramLayoutDTO {
    return new UpdateDiagramLayoutDTO({
      id: UpdateDiagramLayoutDTO.validateId(props.id),
      viewport: UpdateDiagramLayoutDTO.validateViewport(props.viewport),
      elementLayouts: UpdateDiagramLayoutDTO.validateElementLayouts(
        props.elementLayouts,
      ),
      visibleRelationshipIds: UpdateDiagramLayoutDTO.validateRelationshipIds(
        props.visibleRelationshipIds,
      ),
    });
  }

  private static validateRelationshipIds(ids?: string[]): string[] | undefined {
    if (ids === undefined) return undefined;
    if (
      !Array.isArray(ids) ||
      ids.some((id) => typeof id !== "string" || !id.trim())
    ) {
      throw new Error("Visible relationship IDs must be non-empty strings");
    }
    return [...new Set(ids)];
  }

  private static validateId(id: string): string {
    const trimmed = id.trim();
    if (!trimmed) {
      throw new Error("Diagram ID cannot be empty");
    }
    if (trimmed.length > 255) {
      throw new Error("Diagram ID cannot exceed 255 characters");
    }
    return trimmed;
  }

  private static validateViewport(viewport?: Viewport): Viewport | undefined {
    if (viewport === undefined || viewport === null) return undefined;

    const { x, y, zoom } = viewport;

    if (typeof x !== "number" || Number.isNaN(x)) {
      throw new Error("Viewport x must be a valid number");
    }
    if (typeof y !== "number" || Number.isNaN(y)) {
      throw new Error("Viewport y must be a valid number");
    }
    if (typeof zoom !== "number" || Number.isNaN(zoom) || zoom <= 0) {
      throw new Error("Viewport zoom must be a positive number");
    }

    // Optionally clamp or allow any finite number for x,y
    return { x, y, zoom };
  }

  private static validateElementLayouts(
    layouts?: ElementLayout[],
  ): ElementLayout[] | undefined {
    if (layouts === undefined || layouts === null) return undefined;
    if (!Array.isArray(layouts)) {
      throw new Error("Element layouts must be an array");
    }

    // An empty list clears the diagram. It must remain distinct from an omitted field.
    if (layouts.length === 0) return [];

    for (const layout of layouts) {
      if (!layout || typeof layout !== "object") {
        throw new Error("Each element layout must be an object");
      }

      // Validate elementId
      if (!layout.elementId || typeof layout.elementId !== "string") {
        throw new Error(
          "Each element layout must have a valid elementId (string)",
        );
      }
      const trimmedId = layout.elementId.trim();
      if (!trimmedId) {
        throw new Error("Element ID in layout cannot be empty");
      }
      if (trimmedId.length > 255) {
        throw new Error("Element ID cannot exceed 255 characters");
      }

      // Validate position
      const { position } = layout;
      if (!position || typeof position !== "object") {
        throw new Error("Each element layout must have a position object");
      }
      if (typeof position.x !== "number" || Number.isNaN(position.x)) {
        throw new Error("Position.x must be a valid number");
      }
      if (typeof position.y !== "number" || Number.isNaN(position.y)) {
        throw new Error("Position.y must be a valid number");
      }

      // Validate size
      const { size } = layout;
      if (!size || typeof size !== "object") {
        throw new Error("Each element layout must have a size object");
      }
      if (
        typeof size.width !== "number" ||
        Number.isNaN(size.width) ||
        size.width <= 0
      ) {
        throw new Error("Size.width must be a positive number");
      }
      if (
        typeof size.height !== "number" ||
        Number.isNaN(size.height) ||
        size.height <= 0
      ) {
        throw new Error("Size.height must be a positive number");
      }
    }

    return layouts;
  }
}
