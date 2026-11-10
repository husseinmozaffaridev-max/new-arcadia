import type {
  ElementTypeValue as DomainElementTypeValue,
  ElementTypeCategory,
} from "../../domain/value-objects/element-type";
import type { LayerValue } from "./layer";

export type ElementStatus = "DRAFT" | "VALIDATED" | "DEPRECATED";

export type ElementTypeValue = DomainElementTypeValue;

export type { ElementTypeCategory };

export type ElementTypeInfo = {
  value: ElementTypeValue;
  label: string;
  labelFa: string;
  layer: LayerValue;
  category: ElementTypeCategory;
};

export type Element = {
  id: string;
  modelId: string;
  type: ElementTypeValue;
  name: string;
  description?: string;
  status: ElementStatus;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ElementVisualSpec = {
  shape: "rectangle" | "rounded-rectangle" | "ellipse";
  fillColor: string;
  fillColorDark: string;
  strokeColor: string;
};
