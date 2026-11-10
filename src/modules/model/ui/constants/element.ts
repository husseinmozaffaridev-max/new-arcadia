import { ElementType } from "../../domain/value-objects/element-type";
import type {
  ElementTypeInfo,
  ElementTypeValue,
  ElementVisualSpec,
} from "../types/element";
import type { LayerValue } from "../types/layer";

/**
 * Element type metadata derived from the domain `ElementType` value object.
 * EPBS types are excluded — the layer is legacy-only and never offered.
 */
export const ELEMENT_TYPES: ElementTypeInfo[] = ElementType.all()
  .filter((type) => type.layer.value !== "EPBS")
  .map((type) => ({
    value: type.value,
    label: type.label,
    labelFa: type.labelFa,
    layer: type.layer.value,
    category: type.category,
  }));

export const ELEMENT_VISUAL: Record<ElementTypeValue, ElementVisualSpec> = {
  // ─── OA ───────────────────────────────────────────────────────────────────
  Mission: {
    // ← NEW
    shape: "ellipse",
    fillColor: "#D5F5E3",
    fillColorDark: "#0d2b1a",
    strokeColor: "#1D8348",
  },
  OperationalEntity: {
    shape: "rounded-rectangle",
    fillColor: "#AED6F1",
    fillColorDark: "#1a3a52",
    strokeColor: "#2E86C1",
  },
  OperationalActor: {
    shape: "rounded-rectangle",
    fillColor: "#D5D8DC",
    fillColorDark: "#2d3436",
    strokeColor: "#717D7E",
  },
  OperationalActivity: {
    shape: "rectangle",
    fillColor: "#F9E79F",
    fillColorDark: "#3d3200",
    strokeColor: "#D4AC0D",
  },
  OperationalCapability: {
    shape: "ellipse",
    fillColor: "#A9DFBF",
    fillColorDark: "#1a3d2b",
    strokeColor: "#1E8449",
  },
  OperationalProcess: {
    shape: "rounded-rectangle",
    fillColor: "#D7BDE2",
    fillColorDark: "#2d1a3d",
    strokeColor: "#7D3C98",
  },
  // ─── SA ───────────────────────────────────────────────────────────────────
  System: {
    shape: "rounded-rectangle",
    fillColor: "#AED6F1",
    fillColorDark: "#1a3a52",
    strokeColor: "#1A5276",
  },
  SystemActor: {
    shape: "rounded-rectangle",
    fillColor: "#D5D8DC",
    fillColorDark: "#2d3436",
    strokeColor: "#717D7E",
  },
  SystemMission: {
    shape: "ellipse",
    fillColor: "#D5F5E3",
    fillColorDark: "#0d2b1a",
    strokeColor: "#1D8348",
  },
  SystemFunction: {
    shape: "rectangle",
    fillColor: "#FAD7A0",
    fillColorDark: "#3d2800",
    strokeColor: "#CA6F1E",
  },
  SystemCapability: {
    shape: "ellipse",
    fillColor: "#A9DFBF",
    fillColorDark: "#1a3d2b",
    strokeColor: "#1D8348",
  },
  SystemComponent: {
    shape: "rounded-rectangle",
    fillColor: "#85C1E9",
    fillColorDark: "#0d2d47",
    strokeColor: "#1A5276",
  },
  FunctionPort: {
    // ← NEW
    shape: "rectangle",
    fillColor: "#FDEBD0",
    fillColorDark: "#3d1a00",
    strokeColor: "#E67E22",
  },
  // ─── LA ───────────────────────────────────────────────────────────────────
  LogicalComponent: {
    shape: "rounded-rectangle",
    fillColor: "#A9DFBF",
    fillColorDark: "#1a3d2b",
    strokeColor: "#1E8449",
  },
  LogicalActor: {
    shape: "rounded-rectangle",
    fillColor: "#D5D8DC",
    fillColorDark: "#2d3436",
    strokeColor: "#717D7E",
  },
  LogicalFunction: {
    shape: "rectangle",
    fillColor: "#F9E79F",
    fillColorDark: "#3d3200",
    strokeColor: "#D4AC0D",
  },
  LogicalCapability: {
    shape: "ellipse",
    fillColor: "#A9DFBF",
    fillColorDark: "#1a3d2b",
    strokeColor: "#1E8449",
  },
  // ─── PA ───────────────────────────────────────────────────────────────────
  PhysicalComponent: {
    shape: "rectangle",
    fillColor: "#D2B4DE",
    fillColorDark: "#2d1a3d",
    strokeColor: "#6C3483",
  },
  PhysicalNode: {
    shape: "rectangle",
    fillColor: "#AEB6BF",
    fillColorDark: "#1a1f24",
    strokeColor: "#2C3E50",
  },
  PhysicalFunction: {
    shape: "rectangle",
    fillColor: "#FAD7A0",
    fillColorDark: "#3d2800",
    strokeColor: "#CA6F1E",
  },
  PhysicalActor: {
    shape: "rounded-rectangle",
    fillColor: "#D5D8DC",
    fillColorDark: "#2d3436",
    strokeColor: "#717D7E",
  },
  // ─── EPBS (legacy rendering only — not offered in UI) ────────────────────
  EPBSArchitecture: {
    shape: "rounded-rectangle",
    fillColor: "#FADBD8",
    fillColorDark: "#3d1a1a",
    strokeColor: "#E74C3C",
  },
  ConfigurationItem: {
    shape: "rounded-rectangle",
    fillColor: "#FADBD8",
    fillColorDark: "#3d1a1a",
    strokeColor: "#E74C3C",
  },
  ConfigurationItemPart: {
    shape: "rounded-rectangle",
    fillColor: "#FDEBD0",
    fillColorDark: "#3d2a00",
    strokeColor: "#E67E22",
  },
  ConfigurationItemInterface: {
    shape: "rounded-rectangle",
    fillColor: "#D6EAF8",
    fillColorDark: "#1a3a52",
    strokeColor: "#2E86C1",
  },
};

export const ELEMENTS_BY_LAYER: Record<LayerValue, ElementTypeValue[]> =
  Object.fromEntries(
    (["OA", "SA", "LA", "PA", "EPBS"] as LayerValue[]).map((layer) => [
      layer,
      layer === "EPBS"
        ? []
        : ELEMENT_TYPES.filter((t) => t.layer === layer).map((t) => t.value),
    ]),
  ) as Record<LayerValue, ElementTypeValue[]>;
