import type {
  ElementProperties,
  ModelElement,
} from "../../domain/entities/element";
import type { Layer } from "../../domain/value-objects/layer";

export type FindElementsByModelIdQuery = {
  modelId: string;
};

export type FindElementsByIdQuery = {
  id: string;
};

export type CreateElementPayload = {
  modelId: string;
  layer: string;
  parentId?: string | null;
  type: string;
  name: string;
  description?: string;
  properties?: ElementProperties;
};

export type UpdateElementPayload = {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  properties?: ElementProperties;
};

export type RemoveElementPayload = {
  id: string;
};

export type FindElementsByLayerQuery = {
  modelId: string;
  layer: Layer;
};

export type FindChildElementsQuery = {
  parentId: string;
};

export type FindRootElementsQuery = {
  modelId: string;
};

export interface IElementRepository {
  findElementsByModelId(
    query: FindElementsByModelIdQuery,
  ): Promise<ModelElement[]>;
  findElementById(query: FindElementsByIdQuery): Promise<ModelElement | null>;
  createElement(payload: CreateElementPayload): Promise<ModelElement>;
  updateElement(payload: UpdateElementPayload): Promise<ModelElement>;
  removeElement(payload: RemoveElementPayload): Promise<boolean>;
  findElementsByLayer(query: FindElementsByLayerQuery): Promise<ModelElement[]>;
  findChildElements(query: FindChildElementsQuery): Promise<ModelElement[]>;
  findRootElements(query: FindRootElementsQuery): Promise<ModelElement[]>;
}
