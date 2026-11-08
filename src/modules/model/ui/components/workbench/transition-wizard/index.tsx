"use client";

import {
  ArrowRight,
  Boxes,
  Check,
  GitMerge,
  Layers,
  type LucideIcon,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/modules/shared/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/modules/shared/ui/components/ui/dialog";
import { cn } from "@/modules/shared/ui/libs/cn";
import { getLayerInfo } from "../../../helpers/layer";
import type { Element } from "../../../types/element";
import type { Model } from "../../../types/model";
import { MappingStep } from "./mapping-step";
import { LayerChip } from "./preview-step";
import { ReviewStep } from "./review-step";
import { useTransitionWizard } from "./use-transition-wizard";

type TransitionWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sourceModel: Model;
  sourceElements: Element[];
  onCompleted: () => void;
};

export function TransitionWizard({
  open,
  onOpenChange,
  projectId,
  sourceModel,
  sourceElements,
  onCompleted,
}: TransitionWizardProps) {
  const {
    step,
    setStep,
    targetModelName,
    setTargetModelName,
    rows,
    updateRow,
    setManyInclude,
    includedIn,
    includedCount,
    handleConfirm,
    transitionable,
    components,
    functions,
    sourceLayer,
    targetLayer,
    transition,
  } = useTransitionWizard({
    projectId,
    sourceModel,
    sourceElements,
    onCompleted,
    onOpenChange,
  });

  const targetLayerInfo = targetLayer ? getLayerInfo(targetLayer) : null;

  if (!targetLayer || !targetLayerInfo) return null;

  const actorComponentLabel =
    sourceLayer === "OA"
      ? "Entities & Actors"
      : sourceLayer === "SA"
        ? "Actors"
        : "Actors & Components";

  const STEPS: Array<{ label: string; icon: LucideIcon; count: number }> = [
    {
      label: actorComponentLabel,
      icon: Users,
      count: includedIn(components),
    },
    { label: "Functions", icon: Boxes, count: includedIn(functions) },
    { label: "Review", icon: Sparkles, count: includedCount },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 max-h-[calc(100dvh-2rem)]">
        <DialogHeader className="space-y-3 border-b bg-muted/30 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4 text-primary" />
            Layer Transition
          </DialogTitle>
          <DialogDescription className="sr-only">
            Map elements from {getLayerInfo(sourceLayer).label} to{" "}
            {targetLayerInfo.label}.
          </DialogDescription>

          <div className="flex items-center gap-3">
            <LayerChip layer={sourceLayer} />
            <div className="flex flex-1 items-center">
              <span className="h-px flex-1 bg-border" />
              <span className="rounded-full border bg-background p-1.5">
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <LayerChip layer={targetLayer} />
          </div>

          <div className="flex items-center gap-1 pt-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div key={s.label} className="flex flex-1 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full text-[10px]",
                        active || done
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20",
                      )}
                    >
                      {done ? <Check className="size-2.5" /> : i + 1}
                    </span>
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                    {s.count > 0 && (
                      <span className="rounded-full bg-primary/15 px-1.5 text-[9px] font-semibold text-primary">
                        {s.count}
                      </span>
                    )}
                  </button>
                  {i < STEPS.length - 1 && (
                    <span className="h-px flex-1 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 py-4">
          {step === 0 && (
            <MappingStep
              icon={Users}
              title={
                sourceLayer === "OA"
                  ? "Map actors & entities"
                  : sourceLayer === "SA"
                    ? "Map actors"
                    : "Map actors & components"
              }
              subtitle="Each becomes a new element in the target layer, realized from the source."
              emptyHint={
                sourceLayer === "OA"
                  ? "No actors or entities to transition here."
                  : sourceLayer === "SA"
                    ? "No actors to transition here."
                    : "No actors or components to transition here."
              }
              elements={components}
              rows={rows}
              onToggle={(id, v) => updateRow(id, { include: v })}
              onName={(id, v) => updateRow(id, { targetName: v })}
              onToggleAll={setManyInclude}
            />
          )}

          {step === 1 && (
            <MappingStep
              icon={Boxes}
              title="Map activities & functions"
              subtitle="Operational/system behaviour carried forward as functions."
              emptyHint="No activities or functions to transition here."
              elements={functions}
              rows={rows}
              onToggle={(id, v) => updateRow(id, { include: v })}
              onName={(id, v) => updateRow(id, { targetName: v })}
              onToggleAll={setManyInclude}
            />
          )}

          {step === 2 && (
            <ReviewStep
              sourceLayer={sourceLayer}
              targetLayer={targetLayer}
              targetModelName={targetModelName}
              onTargetModelName={setTargetModelName}
              includedCount={includedCount}
              components={components.filter((e) => rows[e.id]?.include)}
              functions={functions.filter((e) => rows[e.id]?.include)}
              rows={rows}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3">
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{includedCount}</span>{" "}
            of {transitionable.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                step === 0 ? onOpenChange(false) : setStep(step - 1)
              }
              disabled={transition.isPending}
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>

            {step < 2 ? (
              <Button type="button" size="sm" onClick={() => setStep(step + 1)}>
                Next
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                loading={transition.isPending}
                disabled={includedCount === 0}
              >
                <GitMerge className="size-3.5" />
                Create {targetLayer} Model
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
