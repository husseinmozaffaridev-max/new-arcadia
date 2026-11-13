"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { DiagramFormValues } from "@/modules/project/ui/schemas/diagram";
import { useCreateClassDiagram } from "../clients/create-class-diagram";
import { useCreateClassElement } from "../clients/create-class-element";
import { useCreateDiagram } from "../clients/create-diagram";
import { useCreateElement } from "../clients/create-element";
import { useCreateModel } from "../clients/create-model";
import { useCreateScenario } from "../clients/create-scenario";
import { getClassDiagramByIdKey } from "../clients/get-class-diagram-by-id";
import { useRemoveClassDiagram } from "../clients/remove-class-diagram";
import { useRemoveClassElement } from "../clients/remove-class-element";
import { useRemoveDiagram } from "../clients/remove-diagram";
import { useRemoveElement } from "../clients/remove-element";
import { useRemoveScenario } from "../clients/remove-scenario";
import { useUpdateClassDiagram } from "../clients/update-class-diagram";
import { useUpdateDiagram } from "../clients/update-diagram";
import { useUpdateScenario } from "../clients/update-scenario";
import type { WorkbenchModelData } from "../components/workbench/workbench";
import { getClassElementTypeInfo } from "../constants/class-diagram";
import { resolveDiagramLayer } from "../helpers/diagram";
import { getElementTypeInfo } from "../helpers/element";
import { getLayerInfo } from "../helpers/layer";
import { useCanvasStore } from "../stores/canvas";
import { useWorkbenchStore } from "../stores/workbench";
import type { ClassElementTypeValue } from "../types/class-diagram";
import type { Diagram, DiagramTypeValue } from "../types/diagram";
import type { ElementTypeValue } from "../types/element";
import type { LayerValue } from "../types/layer";
import type { Model } from "../types/model";

const SCENARIO_TYPES = new Set([
  "OIS",
  "OAS",
  "SS",
  "SAS",
  "LS",
  "LAS",
  "PS",
  "PAS",
]);

type ExplorerActionsParams = {
  projectId: string;
  modelData: WorkbenchModelData[];
  onTreeChanged: () => void;
  openTab: (tab: {
    diagramId: string;
    modelId: string;
    name: string;
    type: DiagramTypeValue;
    layer: LayerValue;
  }) => void;
  closeTab: (diagramId: string) => void;
  renameTab: (diagramId: string, name: string) => void;
};

export function useExplorerActions({
  projectId,
  modelData,
  onTreeChanged,
  openTab,
  closeTab,
  renameTab,
}: ExplorerActionsParams) {
  const createDiagram = useCreateDiagram();
  const createClassDiagram = useCreateClassDiagram();
  const createClassElement = useCreateClassElement();
  const createElement = useCreateElement();
  const createModel = useCreateModel();
  const createScenario = useCreateScenario();
  const removeDiagram = useRemoveDiagram();
  const removeClassDiagram = useRemoveClassDiagram();
  const removeElement = useRemoveElement();
  const removeClassElement = useRemoveClassElement();
  const removeScenario = useRemoveScenario();
  const updateDiagram = useUpdateDiagram();
  const updateClassDiagram = useUpdateClassDiagram();
  const updateScenario = useUpdateScenario();
  const queryClient = useQueryClient();

  const [diagramDialogModel, setDiagramDialogModel] = useState<Model | null>(
    null,
  );
  const [editDiagram, setEditDiagram] = useState<{
    model: Model;
    diagram: Diagram;
  } | null>(null);

  const onNewModel = useCallback(
    (layer: LayerValue) => {
      createModel.mutate(
        { projectId, layer, name: getLayerInfo(layer).label },
        {
          onSuccess: () => {
            toast.success(`${getLayerInfo(layer).label} model created`);
            useWorkbenchStore.getState().setCurrentLayer(layer);
            onTreeChanged();
          },
          onError: ({ message }) =>
            toast.error(message || "Error creating model"),
        },
      );
    },
    [createModel, projectId, onTreeChanged],
  );

  const onNewElement = useCallback(
    (model: Model, type: ElementTypeValue) => {
      const info = getElementTypeInfo(type);
      createElement.mutate(
        {
          type,
          layer: model.layer,
          modelId: model.id,
          name: info.label,
        },
        {
          onSuccess: () => {
            toast.success(`${info.label} created`);
            onTreeChanged();
          },
          onError: ({ message }) =>
            toast.error(message || "Error creating element"),
        },
      );
    },
    [createElement, onTreeChanged],
  );

  const onNewClassElement = useCallback(
    (model: Model, type: ClassElementTypeValue) => {
      const info = getClassElementTypeInfo(type);
      createClassElement.mutate(
        {
          elementType: type,
          layer: model.layer,
          modelId: model.id,
          name: info.label,
        },
        {
          onSuccess: () => {
            toast.success(`${info.label} created`);
            onTreeChanged();
          },
          onError: ({ message }) =>
            toast.error(message || "Error creating element"),
        },
      );
    },
    [createClassElement, onTreeChanged],
  );

  const onDeleteElement = useCallback(
    async (element: { id: string; name: string; modelId?: string }) => {
      const modelId = element.modelId;
      if (!modelId) return;

      const modelDataItem = modelData.find((m) => m.model.id === modelId);
      const isClassElement = modelDataItem?.classElements.some(
        (e) => e.id === element.id,
      );

      if (isClassElement) {
        removeClassElement.mutate(
          { id: element.id, modelId },
          {
            onSuccess: () => {
              const { removeNode, diagramId } = useCanvasStore.getState();
              removeNode(element.id);
              queryClient.invalidateQueries({
                queryKey: ["class-elements", modelId],
              });
              if (diagramId) {
                queryClient.invalidateQueries({
                  queryKey: getClassDiagramByIdKey(diagramId),
                });
              }
              toast.success("Element deleted");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error deleting element"),
          },
        );
      } else {
        removeElement.mutate(element.id, {
          onSuccess: () => {
            toast.success("Element deleted");
            onTreeChanged();
          },
          onError: ({ message }) =>
            toast.error(message || "Error deleting element"),
        });
      }
    },
    [removeElement, removeClassElement, modelData, onTreeChanged, queryClient],
  );

  const onDeleteDiagram = useCallback(
    async (diagram: Diagram) => {
      if (diagram.type === "CDB") {
        removeClassDiagram.mutate(
          { id: diagram.id, modelId: diagram.modelId },
          {
            onSuccess: () => {
              closeTab(diagram.id);
              toast.success("Diagram deleted");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error deleting diagram"),
          },
        );
      } else if (SCENARIO_TYPES.has(diagram.type)) {
        removeScenario.mutate(
          { id: diagram.id },
          {
            onSuccess: () => {
              closeTab(diagram.id);
              toast.success("Scenario deleted");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error deleting scenario"),
          },
        );
      } else {
        removeDiagram.mutate(diagram.id, {
          onSuccess: () => {
            closeTab(diagram.id);
            toast.success("Diagram deleted");
            onTreeChanged();
          },
          onError: ({ message }) =>
            toast.error(message || "Error deleting diagram"),
        });
      }
    },
    [
      removeDiagram,
      removeClassDiagram,
      removeScenario,
      closeTab,
      onTreeChanged,
    ],
  );

  const onSubmitDiagram = useCallback(
    (values: DiagramFormValues) => {
      if (!diagramDialogModel) return;
      const model = diagramDialogModel;

      if (values.type === "CDB") {
        createClassDiagram.mutate(
          {
            name: values.name,
            modelId: model.id,
            layer: model.layer,
            description: values.description,
          },
          {
            onSuccess: ({ data }) => {
              setDiagramDialogModel(null);
              openTab({
                diagramId: data.id,
                modelId: model.id,
                name: data.name,
                type: "CDB",
                layer: model.layer,
              });
              toast.success("Diagram created");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error creating diagram"),
          },
        );
      } else if (SCENARIO_TYPES.has(values.type)) {
        const scenarioType =
          values.type === "OAS"
            ? "OIS"
            : values.type === "SAS"
              ? "SS"
              : values.type === "LAS"
                ? "LS"
                : values.type === "PAS"
                  ? "PS"
                  : values.type;
        createScenario.mutate(
          {
            name: values.name,
            modelId: model.id,
            description: values.description,
            scenarioType,
          },
          {
            onSuccess: ({ data }) => {
              setDiagramDialogModel(null);
              openTab({
                diagramId: data.id,
                modelId: model.id,
                name: data.name,
                type: data.scenarioType as DiagramTypeValue,
                layer: model.layer,
              });
              toast.success("Scenario created");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error creating scenario"),
          },
        );
      } else {
        createDiagram.mutate(
          {
            name: values.name,
            type: values.type,
            modelId: model.id,
            description: values.description,
          },
          {
            onSuccess: ({ data }) => {
              setDiagramDialogModel(null);
              openTab({
                diagramId: data.id,
                modelId: model.id,
                name: data.name,
                type: data.type,
                layer: model.layer,
              });
              toast.success("Diagram created");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error creating diagram"),
          },
        );
      }
    },
    [
      createDiagram,
      createClassDiagram,
      createScenario,
      diagramDialogModel,
      openTab,
      onTreeChanged,
    ],
  );

  const onSubmitEditDiagram = useCallback(
    (values: DiagramFormValues) => {
      if (!editDiagram) return;
      const { diagram } = editDiagram;

      if (diagram.type === "CDB") {
        updateClassDiagram.mutate(
          {
            id: diagram.id,
            modelId: diagram.modelId,
            name: values.name,
            description: values.description,
          },
          {
            onSuccess: () => {
              renameTab(diagram.id, values.name);
              setEditDiagram(null);
              toast.success("Diagram updated");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error updating diagram"),
          },
        );
      } else if (SCENARIO_TYPES.has(diagram.type)) {
        updateScenario.mutate(
          {
            id: diagram.id,
            name: values.name,
            description: values.description,
          },
          {
            onSuccess: () => {
              renameTab(diagram.id, values.name);
              setEditDiagram(null);
              toast.success("Scenario updated");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error updating scenario"),
          },
        );
      } else {
        updateDiagram.mutate(
          {
            id: diagram.id,
            name: values.name,
            description: values.description,
          },
          {
            onSuccess: () => {
              renameTab(diagram.id, values.name);
              setEditDiagram(null);
              toast.success("Diagram updated");
              onTreeChanged();
            },
            onError: ({ message }) =>
              toast.error(message || "Error updating diagram"),
          },
        );
      }
    },
    [
      updateDiagram,
      updateClassDiagram,
      updateScenario,
      editDiagram,
      renameTab,
      onTreeChanged,
    ],
  );

  const onAddElementToDiagram = useCallback(
    (
      element: {
        id: string;
        type: string;
        name: string;
        status: string;
        description?: string;
      },
      diagram: Diagram,
    ) => {
      const diagramModel = modelData.find(
        (m) => m.model.id === diagram.modelId,
      );

      openTab({
        diagramId: diagram.id,
        modelId: diagram.modelId,
        name: diagram.name,
        type: diagram.type,
        layer: resolveDiagramLayer(diagram.type, diagramModel?.model.layer),
      });

      // Find the element data from modelData
      for (const { model, archElements, classElements } of modelData) {
        if (model.id !== diagram.modelId) continue;

        const el =
          archElements.find((e) => e.id === element.id) ??
          classElements.find((e) => e.id === element.id);
        if (el) {
          useCanvasStore.getState().requestElementInsert({
            elementId: el.id,
            elementType: ("type" in el
              ? el.type
              : (el as { elementType: string })
                  .elementType) as ElementTypeValue,
            name: el.name,
            description: "description" in el ? el.description : undefined,
            status: ("status" in el
              ? el.status
              : (el as { status: string }).status) as
              | "DRAFT"
              | "VALIDATED"
              | "DEPRECATED",
          });
          toast.success(`Added "${el.name}" to ${diagram.name}`);
          return;
        }
      }
    },
    [modelData, openTab],
  );

  return {
    // Mutation states
    isCreateDiagramPending: createDiagram.isPending || createScenario.isPending,
    isUpdateDiagramPending:
      updateDiagram.isPending ||
      updateClassDiagram.isPending ||
      updateScenario.isPending,
    isCreateModelPending: createModel.isPending,

    // Model actions
    onNewModel,

    // Element actions
    onNewElement,
    onNewClassElement,
    onDeleteElement,

    // Diagram actions
    onDeleteDiagram,
    onAddElementToDiagram,

    // Diagram dialog state
    diagramDialogModel,
    setDiagramDialogModel,
    editDiagram,
    setEditDiagram,
    onSubmitDiagram,
    onSubmitEditDiagram,
  };
}
