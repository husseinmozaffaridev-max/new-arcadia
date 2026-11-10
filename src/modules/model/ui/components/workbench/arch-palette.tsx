"use client";

import { Spline } from "lucide-react";
import { useMemo } from "react";
import { Separator } from "@/modules/shared/ui/components/ui/separator";
import { RELATIONSHIP_VISUAL } from "../../constants/relationship";
import type { DiagramPalette } from "../../helpers/diagram";
import type { ElementTypeCounts } from "../../helpers/element-count";
import { getRelationshipTypeInfo } from "../../helpers/relationship";
import type { LayerValue } from "../../types/layer";
import { ElementShapeList } from "../element-shape-list";

export type ArchPaletteProps = {
  layer: LayerValue;
  palette: DiagramPalette;
  activeTab: { type: string };
  counts?: ElementTypeCounts;
};

export function ArchPalette({
  layer,
  palette,
  activeTab,
  counts,
}: ArchPaletteProps) {
  const relationships = useMemo(
    () =>
      palette.relationshipTypes.map((value) => getRelationshipTypeInfo(value)),
    [palette],
  );

  return (
    <>
      <div className="px-3 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Elements · {activeTab.type}
        </p>
      </div>

      <ElementShapeList
        layer={layer}
        types={palette.elementTypes}
        counts={counts}
      />

      {relationships.length > 0 && (
        <>
          <Separator className="my-1" />
          <div className="px-3 pt-1">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Spline className="size-3" />
              Relationships
            </p>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {relationships.map((rel) => {
              const visual = RELATIONSHIP_VISUAL[rel.value];
              return (
                <div
                  key={rel.value}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
                  title={`${rel.label} — drag between node handles to create`}
                >
                  <svg
                    width="20"
                    height="8"
                    viewBox="0 0 20 8"
                    className="shrink-0"
                    aria-hidden="true"
                    role="presentation"
                  >
                    <line
                      x1="1"
                      y1="4"
                      x2="19"
                      y2="4"
                      stroke={visual.strokeColor}
                      strokeWidth={visual.strokeWidth}
                      strokeDasharray={
                        visual.strokeDash && visual.strokeDash !== "none"
                          ? visual.strokeDash
                          : undefined
                      }
                    />
                  </svg>
                  <span className="text-xs leading-tight">{rel.label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="px-3 py-2 text-center">
        <p className="text-[10px] text-muted-foreground">
          {activeTab.type === "OEBD" || activeTab.type === "OEB"
            ? "Drag from a child entity or actor to its parent entity to build the hierarchy. Create communication links in OAB."
            : activeTab.type === "OABD"
              ? "Drag from a child activity to its parent activity to build the breakdown. Use OAIB for activity exchanges."
              : "Drag elements onto the canvas. Connect by dragging between handles."}
        </p>
      </div>
    </>
  );
}
