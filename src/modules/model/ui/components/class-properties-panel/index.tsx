"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FolderOpen,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/modules/shared/ui/components/ui/badge";
import { Button } from "@/modules/shared/ui/components/ui/button";
import { Input } from "@/modules/shared/ui/components/ui/input";
import { Label } from "@/modules/shared/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shared/ui/components/ui/select";
import { Separator } from "@/modules/shared/ui/components/ui/separator";
import { Textarea } from "@/modules/shared/ui/components/ui/textarea";
import { getClassDiagramByIdKey } from "../../clients/get-class-diagram-by-id";
import { useUpdateClassElement } from "../../clients/update-class-element";
import { getClassElementTypeInfo } from "../../constants/class-diagram";
import {
  canHaveAttributes,
  canHaveOperations,
  isContainerType,
} from "../../helpers/class-diagram";
import { useMoveToPackage } from "../../hooks/use-move-to-package";
import type { CanvasNode, ClassNodeData } from "../../stores/canvas";
import { useCanvasStore } from "../../stores/canvas";
import {
  useCanEditActiveLayer,
  useWorkbenchStore,
} from "../../stores/workbench";
import { ClassEnumerationSection } from "./literals-section";
import { ClassOperationsSection } from "./operations-section";
import { ClassPropertiesSection } from "./properties-section";

export { ClassEdgeProperties } from "./edge-section";

// Simplified types matching the canvas store's ClassNodeData shape
export type PropertyData = NonNullable<ClassNodeData["properties"]>[number];
export type OperationData = NonNullable<ClassNodeData["operations"]>[number];
export type LiteralData = NonNullable<
  ClassNodeData["enumerationLiterals"]
>[number];

type ClassNodePropertiesProps = {
  node: CanvasNode;
};

const STATUS_LABELS = {
  DRAFT: "Draft",
  VALIDATED: "Validated",
  DEPRECATED: "Deprecated",
} as const;

const STATUS_VARIANTS = {
  DRAFT: "secondary",
  VALIDATED: "default",
  DEPRECATED: "destructive",
} as const;

// ─── Class Node Properties ───────────────────────────────────────────────────

export function ClassNodeProperties({ node }: ClassNodePropertiesProps) {
  const data = node.data as ClassNodeData;
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description ?? "");

  const updateClassElement = useUpdateClassElement();
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const currentLayer = useWorkbenchStore((s) => s.currentLayer);
  const diagramId = useCanvasStore((s) => s.diagramId);
  const queryClient = useQueryClient();
  const { moveToPackage, isPending: isMoving } = useMoveToPackage();

  // Get all Package nodes in the canvas (excluding current node)
  const packages = useMemo(() => {
    const currentNodes = useCanvasStore.getState().nodes;
    return currentNodes.filter(
      (n) =>
        n.id !== node.id && (n.data as ClassNodeData).elementType === "PACKAGE",
    );
  }, [node.id]);

  const currentParentId = data.parentId ?? null;

  const invalidateElements = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["class-elements", data.modelId],
    });
    queryClient.invalidateQueries({
      queryKey: ["workbench-data"],
    });
    if (diagramId) {
      queryClient.invalidateQueries({
        queryKey: getClassDiagramByIdKey(diagramId),
      });
    }
  }, [queryClient, data.modelId, diagramId]);

  const typeInfo = getClassElementTypeInfo(data.elementType);
  const canEdit = useCanEditActiveLayer();

  useEffect(() => {
    setName(data.name);
    setDescription(data.description ?? "");
  }, [data]);

  const handleSave = useCallback(() => {
    updateClassElement.mutate(
      {
        name,
        description,
        id: data.elementId,
        modelId: data.modelId,
      },
      {
        onSuccess: () => {
          updateNodeData(data.elementId, {
            ...data,
            name,
            description,
          });
          invalidateElements();
        },
        onError: ({ message }) => {
          toast.error(message || "Error saving changes");
        },
      },
    );
  }, [
    updateClassElement,
    name,
    description,
    data,
    updateNodeData,
    invalidateElements,
  ]);

  const updateClassElementStatus = useCallback(
    (status: "DRAFT" | "VALIDATED" | "DEPRECATED") => {
      updateClassElement.mutate(
        { id: data.elementId, modelId: data.modelId, name: data.name, status },
        {
          onSuccess: () => {
            updateNodeData(data.elementId, {
              ...data,
              status,
            });
            invalidateElements();
          },
          onError({ message }) {
            toast.error(message || "Error updating status");
          },
        },
      );
    },
    [data, updateClassElement, updateNodeData, invalidateElements],
  );

  const handlePackageChange = useCallback(
    (packageId: string) => {
      const targetId = packageId === "__none__" ? null : packageId;
      const targetPackage = packages.find((p) => p.id === targetId);
      moveToPackage(
        data.elementId,
        data.modelId,
        targetId,
        targetPackage?.data.name,
      );
    },
    [data.elementId, data.modelId, packages, moveToPackage],
  );

  return (
    <div className="flex flex-col gap-0">
      {/* Type Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="size-3 shrink-0 rounded-sm border"
            style={{
              borderColor: typeInfo.color,
              backgroundColor: `${typeInfo.color}20`,
            }}
          />
          <span className="text-xs font-semibold text-foreground/90">
            {typeInfo.label}
          </span>
          {data.isAbstract && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 italic opacity-70"
            >
              abstract
            </Badge>
          )}
          {data.isStatic && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 opacity-70"
            >
              static
            </Badge>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-muted-foreground">Status:</span>
          <Badge
            variant={STATUS_VARIANTS[data.status]}
            className="text-[10px] px-1.5 py-0 font-medium"
          >
            {STATUS_LABELS[data.status]}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Name + Description */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <Label
            className="text-[10px] font-medium text-muted-foreground"
            htmlFor="class-name"
          >
            Name
          </Label>
          {canEdit ? (
            <Input
              id="class-name"
              value={name}
              onBlur={handleSave}
              className="h-7 text-xs"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          ) : (
            <p id="class-name" className="text-xs text-muted-foreground">
              {data.name}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label
            className="text-[10px] font-medium text-muted-foreground"
            htmlFor="class-desc"
          >
            Description
          </Label>
          {canEdit ? (
            <Textarea
              rows={2}
              id="class-desc"
              value={description}
              onBlur={handleSave}
              placeholder="Optional description..."
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/50"
            />
          ) : (
            <p id="class-desc" className="text-xs text-muted-foreground">
              {data.description || "—"}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Parent Package - Only for non-container elements */}
      {!isContainerType(data.elementType) && packages.length > 0 && (
        <>
          <div className="px-4 py-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                <FolderOpen className="size-3" />
                Parent Package
              </Label>
              {canEdit ? (
                <Select
                  value={currentParentId ?? "__none__"}
                  onValueChange={handlePackageChange}
                  disabled={isMoving}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="No package (root)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">
                        No package (root)
                      </span>
                    </SelectItem>
                    {packages.map((pkg) => {
                      const pkgData = pkg.data as ClassNodeData;
                      return (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkgData.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const pkg = packages.find((p) => p.id === currentParentId);
                    return pkg
                      ? (pkg.data as ClassNodeData).name
                      : "No package (root)";
                  })()}
                </p>
              )}
              {currentParentId && (
                <p className="text-[9px] text-muted-foreground">
                  This element is contained in a package
                </p>
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Attributes - Only for types that can own attributes */}
      {canHaveAttributes(data.elementType) && (
        <div className="px-4 py-3">
          <ClassPropertiesSection
            properties={data.properties ?? []}
            elementId={data.elementId}
            modelId={data.modelId}
            layer={currentLayer}
            elementType={data.elementType}
            onUpdate={invalidateElements}
          />
        </div>
      )}

      <Separator />

      {/* Operations - Only for types that can own operations */}
      {canHaveOperations(data.elementType) && (
        <div className="px-4 py-3">
          <ClassOperationsSection
            operations={data.operations ?? []}
            elementId={data.elementId}
            modelId={data.modelId}
            layer={currentLayer}
            elementType={data.elementType}
            onUpdate={invalidateElements}
          />
        </div>
      )}

      {/* Enumeration Literals */}
      {data.elementType === "ENUM" && (
        <>
          <Separator />
          <div className="px-4 py-3">
            <ClassEnumerationSection
              literals={data.enumerationLiterals ?? []}
              elementId={data.elementId}
              modelId={data.modelId}
              layer={currentLayer}
              onUpdate={invalidateElements}
            />
          </div>
        </>
      )}

      <Separator />

      {/* Quick Actions */}
      {canEdit && (
        <div className="px-4 py-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
            Quick Actions
          </p>
          <div className="flex flex-col gap-0.5">
            {data.status !== "VALIDATED" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={updateClassElement.isPending}
                className="justify-start gap-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => updateClassElementStatus("VALIDATED")}
              >
                {updateClassElement.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                )}
                Validate
              </Button>
            )}
            {data.status !== "DRAFT" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={updateClassElement.isPending}
                className="justify-start gap-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => updateClassElementStatus("DRAFT")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Revert to Draft
              </Button>
            )}
            {data.status !== "DEPRECATED" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={updateClassElement.isPending}
                onClick={() => updateClassElementStatus("DEPRECATED")}
                className="justify-start gap-2 h-7 text-xs text-destructive/80 hover:text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Deprecate
              </Button>
            )}
          </div>
        </div>
      )}

      {updateClassElement.isPending && (
        <div className="px-4 pb-3">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Saving...
          </span>
        </div>
      )}
    </div>
  );
}
