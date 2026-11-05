import { ElementType } from "../../domain/value-objects/element-type";
import { ELEMENT_TYPES, ELEMENT_VISUAL } from "../constants/element";
import type {
  ElementTypeInfo,
  ElementTypeValue,
  ElementVisualSpec,
} from "../types/element";
import type { LayerValue } from "../types/layer";

export function getElementTypeInfo(
  value: ElementTypeValue | string,
): ElementTypeInfo {
  const found = ELEMENT_TYPES.find((e) => e.value === value);
  if (found) return found;

  const domain = ElementType.tryFrom(value);
  return {
    value: value as ElementTypeValue,
    label: domain?.label ?? value,
    labelFa: domain?.labelFa ?? value,
    layer: domain?.layer.value ?? "OA",
    category: domain?.category ?? "architecture",
  };
}

export function getElementTypesForLayer(
  layerValue: LayerValue | string,
): ElementTypeInfo[] {
  return ELEMENT_TYPES.filter((e) => e.layer === layerValue);
}

export function getElementVisual(
  type: ElementTypeValue | string,
): ElementVisualSpec {
  return (
    ELEMENT_VISUAL[type as ElementTypeValue] ?? {
      shape: "rectangle",
      fillColor: "#E5E7EB",
      fillColorDark: "#374151",
      strokeColor: "#9CA3AF",
    }
  );
}

export type CanvasNodeType =
  | "actor-node"
  | "entity-node"
  | "function-node"
  | "component-node"
  | "architecture-node";

/**
 * نوع node سفارشی React Flow را بر اساس دسته‌ی المنت Arcadia برمی‌گرداند.
 * actor → actor، entity → entity، function → function، component → component،
 * بقیه (Mission, Capability, Node, Port, System, Process) → fallback عمومی.
 */
export function getNodeTypeForElement(type: ElementTypeValue): CanvasNodeType {
  const category = getElementTypeInfo(type).category;
  if (category === "actor") return "actor-node";
  if (category === "entity") return "entity-node";
  if (category === "function") return "function-node";
  if (category === "component") return "component-node";
  return "architecture-node";
}
