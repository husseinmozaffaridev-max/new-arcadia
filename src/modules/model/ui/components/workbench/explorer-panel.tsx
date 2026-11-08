"use client";

import { Check, FolderTree, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { DiagramFormDialog } from "@/modules/project/ui/components/diagram-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/shared/ui/components/ui/dropdown-menu";
import { ScrollArea } from "@/modules/shared/ui/components/ui/scroll-area";
import { useConfirm } from "@/modules/shared/ui/hooks/use-confirm";
import { getElementPlacementError } from "../../actions/element-actions";
import { OFFERED_LAYERS } from "../../constants/layer";
import { resolveDiagramLayer } from "../../helpers/diagram";
import { getLayerInfo } from "../../helpers/layer";
import { useExplorerActions } from "../../hooks/use-explorer-actions";
import { useCanvasStore } from "../../stores/canvas";
import { isLayerEditable, useWorkbenchStore } from "../../stores/workbench";
import type { Diagram } from "../../types/diagram";
import type { Model } from "../../types/model";
import {
  type ElementTreeNode,
  type ExplorerHandlers,
  ExplorerTree,
} from "./explorer-tree";
import type { WorkbenchModelData } from "./workbench";

type ExplorerPanelProps = {
  projectId: string;
  modelData: WorkbenchModelData[];
  onTreeChanged: () => void;
  onTransition: (model: Model) => void;
};

export function ExplorerPanel({
  projectId,
  modelData,
  onTreeChanged,
  onTransition,
}: ExplorerPanelProps) {
  const locale = useLocale();
  const confirm = useConfirm();

  const openTab = useWorkbenchStore((s) => s.openTab);
  const closeTab = useWorkbenchStore((s) => s.closeTab);
  const renameTab = useWorkbenchStore((s) => s.renameTab);
  const selectElement = useWorkbenchStore((s) => s.selectElement);
  const currentLayer = useWorkbenchStore((s) => s.currentLayer);
  const projectPermissions = useWorkbenchStore((s) => s.projectPermissions);
  const permissionsResolved = useWorkbenchStore((s) => s.permissionsResolved);

  /** RBAC: layers the user may actually create a model in. */
  const editableLayers = useMemo(
    () =>
      OFFERED_LAYERS.filter((layer) =>
        isLayerEditable(projectPermissions, permissionsResolved, layer.value),
      ),
    [projectPermissions, permissionsResolved],
  );

  const selectCanvasNode = useCanvasStore((s) => s.selectNode);
  const canvasNodes = useCanvasStore((s) => s.nodes);

  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    isCreateDiagramPending,
    isUpdateDiagramPending,
    isCreateModelPending,
    onNewModel,
    onNewElement,
    onNewClassElement,
    onDeleteElement,
    onDeleteDiagram,
    onAddElementToDiagram,
    diagramDialogModel,
    setDiagramDialogModel,
    editDiagram,
    setEditDiagram,
    onSubmitDiagram,
    onSubmitEditDiagram,
  } = useExplorerActions({
    projectId,
    modelData,
    onTreeChanged,
    openTab,
    closeTab,
    renameTab,
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const target = container.querySelector(`[data-layer="${currentLayer}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentLayer]);

  const existingLayers = useMemo(
    () => new Set(modelData.map((m) => m.model.layer)),
    [modelData],
  );

  const createDiagramTakenNames = useMemo(() => {
    if (!diagramDialogModel) return undefined;
    return modelData
      .find((m) => m.model.id === diagramDialogModel.id)
      ?.diagrams.map((d) => d.name);
  }, [modelData, diagramDialogModel]);

  const editDiagramTakenNames = useMemo(() => {
    if (!editDiagram) return undefined;
    return modelData
      .find((m) => m.model.id === editDiagram.model.id)
      ?.diagrams.filter((d) => d.id !== editDiagram.diagram.id)
      .map((d) => d.name);
  }, [modelData, editDiagram]);

  const handleSelectElement = useCallback(
    (elementId: string) => {
      selectElement(elementId);

      // find first diagram that contains this element and open it
      for (const { model, diagrams } of modelData) {
        const diagram = diagrams.find((d) =>
          d.elementLayouts.some((l) => l.elementId === elementId),
        );
        if (diagram) {
          openTab({
            diagramId: diagram.id,
            modelId: model.id,
            name: diagram.name,
            type: diagram.type,
            layer: resolveDiagramLayer(diagram.type, model.layer),
          });
          return;
        }
      }

      // fallback: if on current canvas, select the node
      if (canvasNodes.some((n) => n.id === elementId)) {
        selectCanvasNode(elementId);
      }
    },
    [selectElement, selectCanvasNode, canvasNodes, modelData, openTab],
  );

  const handleDeleteElement = useCallback(
    async (element: ElementTreeNode) => {
      const ok = await confirm({
        tone: "danger",
        title: "Delete element",
        description: `Delete "${element.name}"? This also removes it from any diagram.`,
        confirmText: "Delete",
      });
      if (!ok) return;
      onDeleteElement(element);
    },
    [confirm, onDeleteElement],
  );

  const handleDeleteDiagram = useCallback(
    async (diagram: Diagram) => {
      const ok = await confirm({
        tone: "danger",
        title: "Delete diagram",
        description: `Delete diagram "${diagram.name}"?`,
        confirmText: "Delete",
      });
      if (!ok) return;
      onDeleteDiagram(diagram);
    },
    [confirm, onDeleteDiagram],
  );

  const handleAddElementToDiagram = useCallback(
    (element: ElementTreeNode, diagram: Diagram) => {
      const placementError = getElementPlacementError(
        element.name,
        element.type,
        diagram.type,
        locale,
      );
      if (placementError) {
        toast.error(placementError);
        return;
      }
      onAddElementToDiagram(element, diagram);
    },
    [onAddElementToDiagram, locale],
  );

  const handleOpenDiagram = useCallback(
    (model: Model, diagram: Diagram) => {
      openTab({
        diagramId: diagram.id,
        modelId: model.id,
        name: diagram.name,
        type: diagram.type,
        layer: resolveDiagramLayer(diagram.type, model.layer),
      });
    },
    [openTab],
  );

  const handlers: ExplorerHandlers = useMemo(
    () => ({
      onOpenDiagram: handleOpenDiagram,
      onSelectElement: handleSelectElement,
      onNewElement,
      onNewClassElement,
      onDeleteElement: handleDeleteElement,
      onDeleteDiagram: handleDeleteDiagram,
      onNewDiagram: setDiagramDialogModel,
      onEditDiagram: (model: Model, diagram: Diagram) =>
        setEditDiagram({ model, diagram }),
      onTransition,
      onAddElementToDiagram: handleAddElementToDiagram,
      diagrams: modelData.flatMap((m) => [...m.diagrams, ...m.scenarioDiagrams]),
    }),
    [
      handleOpenDiagram,
      handleSelectElement,
      onNewElement,
      onNewClassElement,
      handleDeleteElement,
      handleDeleteDiagram,
      setDiagramDialogModel,
      setEditDiagram,
      handleAddElementToDiagram,
      onTransition,
      modelData,
    ],
  );

  return (
    <aside className="flex h-full min-h-0 flex-col border-r bg-card">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b bg-muted/30 px-3">
        <FolderTree className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Project Explorer
        </p>
        {/* RBAC: only offered when the user may create at least one model. */}
        {editableLayers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="New model"
                aria-label="New model"
                disabled={isCreateModelPending}
                className="ms-auto flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <Plus className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-62" align="end">
              <DropdownMenuLabel>New Model</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {editableLayers.map((layer) => {
                const exists = existingLayers.has(layer.value);
                return (
                  <DropdownMenuItem
                    key={layer.value}
                    disabled={exists}
                    onSelect={() => onNewModel(layer.value)}
                  >
                    <span className="flex-1">{layer.label}</span>
                    {exists ? (
                      <Check className="size-3.5 text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {layer.value}
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div ref={scrollRef}>
          <ExplorerTree
            modelData={modelData}
            handlers={handlers}
            existingLayers={existingLayers}
            editableLayers={editableLayers.map((layer) => layer.value)}
            onNewModel={onNewModel}
          />
        </div>
      </ScrollArea>

      {diagramDialogModel && (
        <DiagramFormDialog
          open={!!diagramDialogModel}
          onOpenChange={(open) => !open && setDiagramDialogModel(null)}
          diagram={null}
          loading={isCreateDiagramPending}
          onSubmit={onSubmitDiagram}
          takenNames={createDiagramTakenNames}
          layer={{
            value: diagramDialogModel.layer,
            label: getLayerInfo(diagramDialogModel.layer).label,
          }}
        />
      )}

      {editDiagram && (
        <DiagramFormDialog
          open={!!editDiagram}
          onOpenChange={(open) => !open && setEditDiagram(null)}
          diagram={{
            name: editDiagram.diagram.name,
            description: editDiagram.diagram.description,
            type: editDiagram.diagram.type,
          }}
          loading={isUpdateDiagramPending}
          onSubmit={onSubmitEditDiagram}
          takenNames={editDiagramTakenNames}
          layer={{
            value: editDiagram.model.layer,
            label: getLayerInfo(editDiagram.model.layer).label,
          }}
        />
      )}
    </aside>
  );
}
