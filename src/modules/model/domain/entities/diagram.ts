import { Entity } from "@/modules/shared/domain/entity";
import { DiagramType } from "../value-objects/diagram-type";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
  visibleRelationshipIds?: string[];
}

export interface ElementLayout {
  elementId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface DiagramProps {
  modelId: string;
  type: DiagramType;
  name: string;
  description?: string;
  viewport: Viewport;
  elementLayouts: Map<string, ElementLayout>;
  visibleRelationshipIds: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Diagram — Entity
 *
 * یک نمای بصری از المنت‌های یک لایه.
 * یک المنت می‌تواند در چندین Diagram نمایش داشته باشد (layout جدا است).
 * Business behavior: مدیریت layout المنت‌ها، تغییر viewport.
 */
export class Diagram extends Entity<string> {
  private _name: string;
  private _description?: string;
  private readonly _modelId: string;
  private readonly _type: DiagramType;
  private _viewport: Viewport;
  private readonly _elementLayouts: Map<string, ElementLayout>;
  private _visibleRelationshipIds: string[] | null;
  private _updatedAt: Date;
  readonly createdAt: Date;

  private constructor(id: string, props: DiagramProps) {
    super(id);
    this._modelId = props.modelId;
    this._type = props.type;
    this._name = props.name;
    this._description = props.description;
    this._viewport = { ...props.viewport };
    this._elementLayouts = props.elementLayouts;
    this._visibleRelationshipIds = props.visibleRelationshipIds;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: {
    id: string;
    modelId: string;
    type: string;
    name: string;
    description?: string;
  }): Diagram {
    if (!props.name.trim()) throw new Error("Diagram name is required");

    return new Diagram(props.id, {
      modelId: props.modelId,
      type: DiagramType.from(props.type),
      name: props.name.trim(),
      description: props.description ?? "",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: new Map(),
      visibleRelationshipIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: string;
    modelId: string;
    type: string;
    name: string;
    description: string;
    viewport: Viewport;
    elementLayouts: ElementLayout[];
    visibleRelationshipIds?: ReadonlyArray<string> | null;
    createdAt: string;
    updatedAt: string;
  }): Diagram {
    const layouts = new Map<string, ElementLayout>();
    for (const l of props.elementLayouts) {
      layouts.set(l.elementId, l);
    }
    return new Diagram(props.id, {
      modelId: props.modelId,
      type: DiagramType.from(props.type),
      name: props.name,
      description: props.description,
      viewport: props.viewport,
      elementLayouts: layouts,
      visibleRelationshipIds: props.visibleRelationshipIds
        ? [...props.visibleRelationshipIds]
        : null,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }

  get modelId(): string {
    return this._modelId;
  }
  get type(): DiagramType {
    return this._type;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }
  get viewport(): Readonly<Viewport> {
    return this._viewport;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  get elementLayouts(): ReadonlyArray<ElementLayout> {
    return Array.from(this._elementLayouts.values());
  }

  get visibleRelationshipIds(): ReadonlyArray<string> | null {
    return this._visibleRelationshipIds
      ? [...this._visibleRelationshipIds]
      : null;
  }

  setVisibleRelationships(ids: string[]): void {
    this._visibleRelationshipIds = [...new Set(ids)];
    this._touch();
  }

  rename(name: string): void {
    if (!name.trim()) throw new Error("Diagram name can't empty");
    this._name = name.trim();
    this._touch();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._touch();
  }

  updateViewport(viewport: Viewport): void {
    this._viewport = { ...viewport };
    this._touch();
  }

  /** قرار دادن المنت در دیاگرام با موقعیت مشخص */
  placeElement(
    elementId: string,
    position: { x: number; y: number },
    size?: { width: number; height: number },
  ): void {
    this._elementLayouts.set(elementId, {
      elementId,
      position,
      size: size ?? { width: 160, height: 60 },
    });
    this._touch();
  }

  moveElement(elementId: string, position: { x: number; y: number }): void {
    const existing = this._elementLayouts.get(elementId);
    if (!existing)
      throw new Error(`Element ${elementId} does't exist in diagram.`);
    this._elementLayouts.set(elementId, { ...existing, position });
    this._touch();
  }

  /** حذف layout یک المنت از دیاگرام (المنت خودش حذف نمی‌شود) */
  removeElementLayout(elementId: string): void {
    this._elementLayouts.delete(elementId);
    this._touch();
  }

  hasElement(elementId: string): boolean {
    return this._elementLayouts.has(elementId);
  }

  getElementLayout(elementId: string): ElementLayout | null {
    return this._elementLayouts.get(elementId) ?? null;
  }

  toJSON() {
    return {
      id: this._id,
      modelId: this._modelId,
      type: this._type.value,
      name: this._name,
      description: this._description,
      viewport: this._viewport,
      elementLayouts: Array.from(this._elementLayouts.values()),
      visibleRelationshipIds: this.visibleRelationshipIds,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  private _touch(): void {
    this._updatedAt = new Date();
  }
}
