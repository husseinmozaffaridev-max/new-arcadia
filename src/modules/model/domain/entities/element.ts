import { Entity } from "@/modules/shared/domain/entity";
import { ElementType } from "../value-objects/element-type";
import { Layer } from "../value-objects/layer";

export type ElementStatus = "DRAFT" | "VALIDATED" | "DEPRECATED";

export type ElementProperties = {
  status: ElementStatus;
  stereotype?: string;
  portDirection?: "IN" | "OUT" | "INOUT";
  availableInModes?: string[];
  [key: string]: unknown;
};

type ModelElementProps = {
  modelId: string;
  layer: Layer;
  type: ElementType;
  name: string;
  description?: string;
  properties: ElementProperties;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ModelElement — Entity
 */
export class ModelElement extends Entity<string> {
  private _name: string;
  private _description?: string;
  private readonly _modelId: string;
  private readonly _layer: Layer;
  private readonly _type: ElementType;
  private readonly _parentId: string | null;
  private _properties: ElementProperties;
  private _updatedAt: Date;
  readonly createdAt: Date;

  private constructor(id: string, props: ModelElementProps) {
    super(id);
    this._modelId = props.modelId;
    this._layer = props.layer;
    this._type = props.type;
    this._name = props.name;
    this._description = props.description;
    this._properties = { ...props.properties };
    this._parentId = props.parentId;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: {
    id: string;
    modelId: string;
    layer: string;
    type: string;
    name: string;
    description?: string;
    properties?: Partial<ElementProperties>;
    parentId?: string | null;
  }): ModelElement {
    if (!props.name.trim()) throw new Error("Element name is required");

    const elementType = ElementType.from(props.type);
    const layer = Layer.from(props.layer);

    // اطمینان از تطابق type با layer
    if (!elementType.layer.equals(layer)) {
      throw new Error(
        `Element type "${elementType.label}" does not belong to layer "${layer.label}"`,
      );
    }

    if (props.parentId && elementType.isActor()) {
      throw new Error(
        "Actors cannot be decomposed or nested inside other elements",
      );
    }

    return new ModelElement(props.id, {
      modelId: props.modelId,
      layer,
      type: elementType,
      name: props.name.trim(),
      description: props.description ?? "",
      properties: { status: "DRAFT", ...props.properties },
      parentId: props.parentId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: string;
    modelId: string;
    layer: string;
    type: string;
    name: string;
    description: string;
    properties: ElementProperties;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
  }): ModelElement {
    return new ModelElement(props.id, {
      modelId: props.modelId,
      layer: Layer.from(props.layer),
      type: ElementType.from(props.type),
      name: props.name,
      description: props.description,
      properties: props.properties,
      parentId: props.parentId,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  get modelId(): string {
    return this._modelId;
  }
  get layer(): Layer {
    return this._layer;
  }
  get type(): ElementType {
    return this._type;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }
  get properties(): Readonly<ElementProperties> {
    return this._properties;
  }
  get status(): ElementStatus {
    return this._properties.status;
  }
  get parentId(): string | null {
    return this._parentId;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  isRoot(): boolean {
    return this._parentId === null;
  }

  // ─── Mutations ────────────────────────────────────────────────────────────────

  rename(name: string): void {
    if (!name.trim()) throw new Error("Element name can't be empty");
    this._name = name.trim();
    this._touch();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._touch();
  }

  validate(): void {
    if (this._properties.status === "DEPRECATED")
      throw new Error("Cannot validate a deprecated element");
    this._properties = { ...this._properties, status: "VALIDATED" };
    this._touch();
  }

  deprecate(): void {
    this._properties = { ...this._properties, status: "DEPRECATED" };
    this._touch();
  }

  updateProperties(partial: Partial<ElementProperties>): void {
    this._properties = { ...this._properties, ...partial };
    this._touch();
  }

  setAvailableInModes(modeIds: string[]): void {
    this._properties = { ...this._properties, availableInModes: modeIds };
    this._touch();
  }

  isDeprecated(): boolean {
    return this._properties.status === "DEPRECATED";
  }
  isValidated(): boolean {
    return this._properties.status === "VALIDATED";
  }

  toJSON() {
    return {
      id: this._id,
      modelId: this._modelId,
      layer: this._layer.value,
      type: this._type.value,
      name: this._name,
      description: this._description,
      properties: this._properties,
      parentId: this._parentId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  private _touch(): void {
    this._updatedAt = new Date();
  }
}
