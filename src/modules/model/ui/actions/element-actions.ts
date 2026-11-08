import type { LucideIcon } from "lucide-react";
import { getElementTypeIcon } from "../constants/element-icons";
import { getDiagramPalette } from "../helpers/diagram";
import { getElementTypesForLayer, getElementVisual } from "../helpers/element";
import type { Diagram } from "../types/diagram";
import type { ElementTypeInfo, ElementTypeValue } from "../types/element";
import type { LayerValue } from "../types/layer";

/**
 * Element actions — the single place the UI decides what may be done with an
 * element: whether it can land on a diagram, and which element types can be
 * created on a layer.
 */

export function canPlaceElementOnDiagram(
  elementType: ElementTypeValue | string,
  diagramType: string,
): boolean {
  return getDiagramPalette(diagramType).elementTypes.includes(
    elementType as ElementTypeValue,
  );
}

/** User-facing rejection message, or `null` when the element fits the diagram. */
export function getElementPlacementError(
  elementLabel: string,
  elementType: ElementTypeValue | string,
  diagramType: string,
  locale?: string,
): string | null {
  const supported = getDiagramPalette(diagramType).elementTypes;
  if (supported.includes(elementType as ElementTypeValue)) return null;

  const isFa = locale === "fa";
  return isFa
    ? `افزودن «${elementLabel}» به دیاگرام ${diagramType} مجاز نیست. این دیاگرام فقط از موارد زیر پشتیبانی می‌کند: ${supported.join(", ")}`
    : `Cannot add "${elementLabel}" to ${diagramType} diagram. This diagram only supports: ${supported.join(", ")}`;
}

export type DiagramPlacement = {
  diagram: Diagram;
  allowed: boolean;
};

/** Every diagram, flagged with whether the element is allowed on it. */
export function getDiagramPlacements(
  diagrams: Diagram[],
  elementType: ElementTypeValue | string,
): DiagramPlacement[] {
  return diagrams.map((diagram) => ({
    diagram,
    allowed: canPlaceElementOnDiagram(elementType, diagram.type),
  }));
}

export type NewElementAction = ElementTypeInfo & {
  icon: LucideIcon;
  strokeColor: string;
  fillColor: string;
};

/** Element types creatable on a layer, ready to render as menu items. */
export function getNewElementActions(layer: LayerValue): NewElementAction[] {
  return getElementTypesForLayer(layer).map((info) => {
    const visual = getElementVisual(info.value);
    return {
      ...info,
      icon: getElementTypeIcon(info.value),
      strokeColor: visual.strokeColor,
      fillColor: visual.fillColor,
    };
  });
}
