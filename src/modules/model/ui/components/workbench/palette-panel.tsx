"use client";

import { Boxes, Lock } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea } from "@/modules/shared/ui/components/ui/scroll-area";
import { Separator } from "@/modules/shared/ui/components/ui/separator";
import {
  getDiagramPalette,
  getDiagramTypesForLayer,
} from "../../helpers/diagram";
import { getElementTypesForLayer } from "../../helpers/element";
import {
  countClassElementsByType,
  countElementsByType,
} from "../../helpers/element-count";
import { getLayerInfo, getSectionTitle } from "../../helpers/layer";
import { useWorkbenchStore } from "../../stores/workbench";
import type { ClassElementData } from "../../types/class-diagram";
import type { Element } from "../../types/element";
import type { Model } from "../../types/model";
import { ElementShapeList } from "../element-shape-list";
import { ArchPalette } from "./arch-palette";
import { ClassPalette } from "./class-palette";
import { ScenarioPalette } from "./scenario-palette";

type PaletteModelData = Array<{
  model: Model;
  archElements: Element[];
  classElements: ClassElementData[];
}>;

/**
 * PalettePanel
 *
 * جعبه‌ابزار کنار canvas. اگر دیاگرامی باز باشد، ابزارهای آن را نشان می‌دهد.
 * اگر دیاگرامی باز نباشد، المنت‌های لایه فعال را نشان می‌دهد (مطابق Capella).
 */
export function PalettePanel({ modelData }: { modelData: PaletteModelData }) {
  const activeTab = useWorkbenchStore((s) =>
    s.tabs.find((t) => t.diagramId === s.activeDiagramId),
  );
  const currentLayer = useWorkbenchStore((s) => s.currentLayer);

  const layer = activeTab?.layer ?? currentLayer;
  const isClassDiagram = activeTab?.type === "CDB";
  const isScenario = ["OIS", "SS", "LS", "PS"].includes(activeTab?.type ?? "");

  /**
   * RBAC: the palette creates new model elements, so it is only rendered when
   * the user holds `edit<Layer>` for the layer being displayed. Read-only
   * members see an explanatory notice instead of draggable tools.
   */
  const canEdit = useWorkbenchStore((s) => s.canEditLayer(layer));

  const palette = useMemo(
    () => (activeTab ? getDiagramPalette(activeTab.type) : null),
    [activeTab],
  );

  const layerElementTypes = useMemo(
    () => (palette ? null : getElementTypesForLayer(layer)),
    [palette, layer],
  );

  const layerDiagramTypes = useMemo(
    () => (palette ? null : getDiagramTypesForLayer(layer)),
    [palette, layer],
  );

  const layerInfo = getLayerInfo(layer);

  const layerModel = useMemo(
    () => modelData.find((entry) => entry.model.layer === layer),
    [modelData, layer],
  );

  const counts = useMemo(
    () => countElementsByType(layerModel?.archElements ?? []),
    [layerModel],
  );

  const classCounts = useMemo(
    () => countClassElementsByType(layerModel?.classElements ?? []),
    [layerModel],
  );

  return (
    <aside className="flex h-full min-h-0 flex-col border-l bg-card">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b bg-muted/30 px-3">
        <Boxes className="size-3.5 text-muted-foreground" />
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="sr-only">Palette — </span>
          {getSectionTitle(layer)}
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {!canEdit ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-4 text-center">
            <Lock className="size-4 text-muted-foreground" />
            <p className="text-[11px] font-medium text-foreground">
              Read-only layer
            </p>
            <p className="text-[10px] text-muted-foreground">
              You do not have edit access to {layerInfo.label}. Ask a project
              admin for the matching editor role.
            </p>
          </div>
        ) : activeTab && palette ? (
          isClassDiagram ? (
            <ClassPalette palette={palette} counts={classCounts} />
          ) : isScenario ? (
            <ScenarioPalette type={activeTab.type} />
          ) : (
            <ArchPalette
              layer={layer}
              palette={palette}
              activeTab={activeTab}
              counts={counts}
            />
          )
        ) : layerElementTypes ? (
          <>
            <div className="px-3 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {layerInfo.label} · Available Element Types
              </p>
            </div>
            <ElementShapeList
              layer={layer}
              types={layerElementTypes.map((e) => e.value)}
              counts={counts}
            />

            {layerDiagramTypes && layerDiagramTypes.length > 0 && (
              <>
                <Separator className="my-1" />
                <div className="px-3 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Diagram Types
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-2">
                  {layerDiagramTypes.map((dt) => (
                    <div
                      key={`${layer}-${dt.value}`}
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground"
                    >
                      <Boxes className="size-3 shrink-0" />
                      <span>{dt.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="px-3 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">
                Open a diagram to drag elements onto the canvas.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4 text-center">
            <p className="text-[11px] text-muted-foreground">
              Open a diagram to see its tools
            </p>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
