"use client";

import { Boxes, GitMerge, Layers } from "lucide-react";
import { Input } from "@/modules/shared/ui/components/ui/input";
import { Label } from "@/modules/shared/ui/components/ui/label";
import { ScrollArea } from "@/modules/shared/ui/components/ui/scroll-area";
import type { Element } from "../../../types/element";
import type { LayerValue } from "../../../types/layer";
import { PreviewGroup, StatCard } from "./preview-step";
import type { RowState } from "./use-transition-wizard";

export function ReviewStep({
  sourceLayer,
  targetLayer,
  targetModelName,
  onTargetModelName,
  includedCount,
  components,
  functions,
  rows,
}: {
  sourceLayer: LayerValue;
  targetLayer: LayerValue;
  targetModelName: string;
  onTargetModelName: (value: string) => void;
  includedCount: number;
  components: Element[];
  functions: Element[];
  rows: Record<string, RowState>;
}) {
  const actorGroupTitle =
    sourceLayer === "OA"
      ? "Entities & Actors"
      : sourceLayer === "SA"
        ? "Actors"
        : "Actors & Components";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="target-model-name" className="text-xs">
          Target model name
        </Label>
        <Input
          id="target-model-name"
          value={targetModelName}
          onChange={(e) => onTargetModelName(e.target.value)}
          className="h-8 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          An existing {targetLayer} model will be reused if one already exists.
          Compatible relationships and realization trace links are created automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatCard label="Elements" value={includedCount} icon={Boxes} />
        <StatCard
          label="Realization links"
          value={includedCount}
          icon={GitMerge}
        />
        <StatCard label="Target layer" value={targetLayer} icon={Layers} />
      </div>

      {includedCount === 0 ? (
        <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
          Nothing selected — go back and pick at least one element.
        </p>
      ) : (
        <ScrollArea className="h-56">
          <div className="flex flex-col gap-3 pr-2">
            <PreviewGroup
              title={actorGroupTitle}
              elements={components}
              rows={rows}
            />
            <PreviewGroup title="Functions" elements={functions} rows={rows} />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
