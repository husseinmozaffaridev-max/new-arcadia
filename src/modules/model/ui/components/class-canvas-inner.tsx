"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLocale } from "next-intl";
import { type DragEventHandler, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ClassConnectionPolicy } from "../../domain/policies/class-connection";
import { getElementPlacementError } from "../actions/element-actions";
import { useCreateClassElement } from "../clients/create-class-element";
import { useCreateClassRelationship } from "../clients/create-class-relationship";
import { getClassDiagramByIdKey } from "../clients/get-class-diagram-by-id";
import { getElementRelationsKey } from "../clients/get-element-relations";
import { useUpdateClassDiagramLayout } from "../clients/update-class-diagram-layout";
import { getClassElementTypeInfo } from "../constants/class-diagram";
import {
  buildClassNodes,
  buildNodeDataFromCreatedElement,
  buildNodeDataFromInsertRequest,
  cascadePosition,
  mergeClassNodes,
} from "../helpers/class-canvas";
import { buildClassEdges } from "../helpers/class-canvas-edges";
import {
  getDefaultSize,
  isContainerType,
  nodesToAbsoluteLayouts,
} from "../helpers/class-diagram";
import { getElementTypeInfo } from "../helpers/element";
import { useCanvasBehaviour } from "../hooks/use-canvas-behaviour";
import { useCanvasStore } from "../stores/canvas";
import { useCanEditActiveLayer, useWorkbenchStore } from "../stores/workbench";
import type {
  ClassElementData,
  ClassElementTypeValue,
  ClassRelationshipData,
  ClassRelationshipTypeValue,
} from "../types/class-diagram";
import type { Diagram } from "../types/diagram";
import { ClassDiagramContextMenu } from "./class-diagram-context-menu";
import { ConnectionDialog } from "./connection-dialog";
import { ClassEdge } from "./edges/class-edge";
import { ClassNode } from "./nodes/class/class-node";
import { PackageNode } from "./nodes/class/package-node";

const NODE_TYPES = {
  "class-node": ClassNode,
  "package-node": PackageNode,
} as const;

const EDGE_TYPES = {
  "class-edge": ClassEdge,
} as const;

type ClassCanvasInnerProps = {
  diagram: Diagram;
  elements: ClassElementData[];
  relationships: ClassRelationshipData[];
};

export function ClassCanvasInner({
  diagram,
  elements,
  relationships,
}: ClassCanvasInnerProps) {
  const locale = useLocale();
  const isFa = locale === "fa";

  // RBAC: without `edit<layer>` the canvas is fully static.
  const canEdit = useCanEditActiveLayer();

  const createClassElement = useCreateClassElement();
  const createClassRelationship = useCreateClassRelationship();
  const updateClassDiagramLayout = useUpdateClassDiagramLayout();

  const createRelationship = useCallback(
    (payload: {
      name: string;
      sourceElementId: string;
      targetElementId: string;
      type: ClassRelationshipTypeValue;
    }) => {
      const { modelId, pushHistory, addEdge } = useCanvasStore.getState();
      if (!modelId) return;

      const activeTab = useWorkbenchStore
        .getState()
        .tabs.find((t) => t.diagramId === useCanvasStore.getState().diagramId);
      const layer = activeTab?.layer ?? "LA";

      pushHistory();

      createClassRelationship.mutate(
        {
          modelId,
          layer,
          name: payload.name,
          relationshipType: payload.type,
          sourceElementId: payload.sourceElementId,
          targetElementId: payload.targetElementId,
        },
        {
          onSuccess: ({ data: rel }) => {
            addEdge({
              id: rel.id,
              type: "class-edge",
              source: payload.sourceElementId,
              target: payload.targetElementId,
              data: {
                name: rel.name,
                modelId,
                relationshipId: rel.id,
                relationshipType:
                  rel.relationshipType as ClassRelationshipTypeValue,
                description: rel.description,
                aggregationKind:
                  rel.aggregationKind as ClassRelationshipData["aggregationKind"],
                sourceMultiplicityLower: rel.sourceMultiplicityLower,
                sourceMultiplicityUpper: rel.sourceMultiplicityUpper,
                targetMultiplicityLower: rel.targetMultiplicityLower,
                targetMultiplicityUpper: rel.targetMultiplicityUpper,
                sourceRole: rel.sourceRole,
                targetRole: rel.targetRole,
                isNavigableSource: rel.isNavigableSource,
                isNavigableTarget: rel.isNavigableTarget,
              },
            });
          },
          onError: ({ message }) => {
            toast.error(
              message ||
                (isFa
                  ? "خطا در ایجاد رابطه"
                  : "Error creating class relationship"),
            );
          },
        },
      );
    },
    [createClassRelationship, isFa],
  );

  const {
    reactFlowRef,
    nodes,
    edges,
    diagramId,
    modelId,
    pendingConnection,
    selectNode,
    pushHistory,
    addNode,
    initCanvas,
    reset,
    setPendingConnection,
    clearInsertRequest,
    queryClient,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    onEdgeClick,
    onNodeDragStop,
    handleDragOver,
    handleConfirm,
  } = useCanvasBehaviour({
    onConfirm: (type, name, _description) => {
      if (!pendingConnection) return;
      createRelationship({
        name,
        type: type as unknown as ClassRelationshipTypeValue,
        sourceElementId: pendingConnection.sourceNodeId,
        targetElementId: pendingConnection.targetNodeId,
      });
    },
  });

  useEffect(() => {
    initCanvas(diagram.id, diagram.modelId, [], []);
    return () => reset();
  }, [initCanvas, reset, diagram.id, diagram.modelId]);

  useEffect(() => {
    const newNodes = buildClassNodes(
      elements,
      diagram.elementLayouts,
      diagram.modelId,
    );
    const merged = mergeClassNodes(newNodes, useCanvasStore.getState().nodes);

    const nodeIds = new Set(newNodes.map((n) => n.id));
    const newEdges = buildClassEdges(relationships, nodeIds, diagram.modelId);

    useCanvasStore.getState().setNodes(merged);
    useCanvasStore.getState().setEdges(newEdges);
  }, [elements, relationships, diagram.elementLayouts, diagram.modelId]);

  const handleConnect = useCallback(
    (connection: { source?: string | null; target?: string | null }) => {
      if (!connection.source || !connection.target) return;

      const currentNodes = useCanvasStore.getState().nodes;
      const sourceNode = currentNodes.find((n) => n.id === connection.source);
      const targetNode = currentNodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      const sourceType = getElementTypeInfo(sourceNode.data.elementType).value;
      const targetType = getElementTypeInfo(targetNode.data.elementType).value;
      if (!sourceType || !targetType) return;

      const allowedTypes = ClassConnectionPolicy.getAllowedRelationshipTypes(
        sourceType,
        targetType,
      ).map((rt) => rt.value as unknown as ClassRelationshipTypeValue);

      if (allowedTypes.length === 0) {
        toast.error(
          isFa
            ? "امکان برقراری اتصال بین این دو عنصر وجود ندارد."
            : "Cannot create a connection between these two elements.",
        );
        return;
      }

      if (allowedTypes.length === 1) {
        createRelationship({
          name: allowedTypes[0],
          type: allowedTypes[0],
          sourceElementId: connection.source,
          targetElementId: connection.target,
        });
        return;
      }

      setPendingConnection({
        allowedTypes:
          allowedTypes as unknown as import("../types/relationship").RelationshipTypeValue[],
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
      });
    },
    [setPendingConnection, createRelationship, isFa],
  );

  const handleExplorerDrop = useCallback(
    (rawData: string, position: { x: number; y: number }) => {
      if (!modelId || !diagramId) return;

      try {
        const { elementId, elementType, name, status, description } =
          JSON.parse(rawData);

        const currentNodes = useCanvasStore.getState().nodes;
        if (currentNodes.some((n) => n.id === elementId)) {
          toast.info(
            isFa
              ? `«${name}» قبلاً روی این دیاگرام قرار دارد`
              : `"${name}" is already on this diagram`,
          );
          return;
        }

        const activeTab = useWorkbenchStore
          .getState()
          .tabs.find((t) => t.diagramId === diagramId);
        if (activeTab) {
          const placementError = getElementPlacementError(
            name,
            elementType,
            activeTab.type,
            locale,
          );
          if (placementError) {
            toast.error(placementError);
            return;
          }
        }

        pushHistory();

        const elementLayouts = nodesToAbsoluteLayouts(currentNodes);
        const isContainer = isContainerType(
          elementType as ClassElementTypeValue,
        );
        const defaultSize = getDefaultSize(
          elementType as ClassElementTypeValue,
        );

        updateClassDiagramLayout.mutate(
          {
            id: String(diagramId),
            modelId: String(modelId),
            elementLayouts: [
              ...elementLayouts,
              { position, elementId, size: defaultSize },
            ],
          },
          {
            onSuccess: () => {
              addNode({
                id: elementId,
                type: isContainer ? "package-node" : "class-node",
                position,
                data: buildNodeDataFromInsertRequest({
                  name,
                  elementId,
                  elementType,
                  modelId: String(modelId),
                  description,
                  status,
                }),
              });
              selectNode(elementId);
              queryClient.invalidateQueries({
                queryKey: getElementRelationsKey(elementId),
              });
              queryClient.invalidateQueries({
                queryKey: getClassDiagramByIdKey(String(diagramId)),
              });
              toast.success(
                isFa
                  ? `«${name}» به دیاگرام اضافه شد`
                  : `Added "${name}" to diagram`,
              );
            },
            onError: ({ message }) =>
              toast.error(
                message ||
                  (isFa
                    ? "خطا در افزودن عنصر به دیاگرام"
                    : "Error adding element to diagram"),
              ),
          },
        );
      } catch {
        // ignore parse errors
      }
    },
    [
      modelId,
      diagramId,
      pushHistory,
      updateClassDiagramLayout,
      addNode,
      selectNode,
      queryClient,
      locale,
      isFa,
    ],
  );

  const handlePaletteDrop = useCallback(
    (elementType: string, position: { x: number; y: number }) => {
      if (!modelId || !diagramId) return;

      pushHistory();

      const activeTab = useWorkbenchStore
        .getState()
        .tabs.find((t) => t.diagramId === useCanvasStore.getState().diagramId);
      const layer = activeTab?.layer ?? "LA";

      createClassElement.mutate(
        {
          modelId: String(modelId),
          layer,
          name: getClassElementTypeInfo(elementType as ClassElementTypeValue)
            .label,
          elementType: elementType as ClassElementTypeValue,
        },
        {
          onSuccess: ({ data: el }) => {
            const currentNodes = useCanvasStore.getState().nodes;
            const elementLayouts = nodesToAbsoluteLayouts(currentNodes);
            const isContainer = isContainerType(
              elementType as ClassElementTypeValue,
            );
            const defaultSize = getDefaultSize(
              elementType as ClassElementTypeValue,
            );

            updateClassDiagramLayout.mutate(
              {
                id: String(diagramId),
                modelId: String(modelId),
                elementLayouts: [
                  ...elementLayouts,
                  { position, elementId: el.id, size: defaultSize },
                ],
              },
              {
                onError: ({ message }) => {
                  toast.error(
                    message ||
                      (isFa ? "خطا در افزودن عنصر" : "Error adding element"),
                  );
                },
                onSuccess: () => {
                  addNode({
                    id: el.id,
                    type: isContainer ? "package-node" : "class-node",
                    position,
                    data: buildNodeDataFromCreatedElement({
                      id: el.id,
                      name: el.name,
                      elementType: el.elementType,
                      modelId: String(modelId),
                      description: el.description,
                      status: el.status,
                      isAbstract: el.isAbstract,
                      isStatic: el.isStatic,
                    }),
                  });
                  queryClient.invalidateQueries({
                    queryKey: getClassDiagramByIdKey(String(diagramId)),
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["class-elements"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["workbench-data"],
                  });
                },
              },
            );
          },
          onError: ({ message }) => {
            toast.error(
              message ||
                (isFa
                  ? "خطا در افزودن عنصر کلاس"
                  : "Error adding class element"),
            );
          },
        },
      );
    },
    [
      modelId,
      diagramId,
      pushHistory,
      createClassElement,
      updateClassDiagramLayout,
      addNode,
      queryClient,
      isFa,
    ],
  );

  const handleDrop: DragEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault();
      if (!canEdit) return;
      if (!reactFlowRef.current || !modelId || !diagramId) return;

      const bounds = reactFlowRef.current.getBoundingClientRect();
      const position = {
        y: event.clientY - bounds.top - 30,
        x: event.clientX - bounds.left - 80,
      };

      const explorerData = event.dataTransfer.getData(
        "application/explorer-element",
      );
      if (explorerData) {
        handleExplorerDrop(explorerData, position);
        return;
      }

      const elementType = event.dataTransfer.getData(
        "application/element-type",
      );
      if (!elementType) return;

      handlePaletteDrop(elementType, position);
    },
    [
      canEdit,
      reactFlowRef,
      modelId,
      diagramId,
      handleExplorerDrop,
      handlePaletteDrop,
    ],
  );

  const insertRequest = useCanvasStore((s) => s.insertRequest);
  useEffect(() => {
    if (!canEdit) return;
    if (!insertRequest) return;
    if (!diagramId || !modelId) return;

    const currentNodes = useCanvasStore.getState().nodes;
    if (currentNodes.some((n) => n.id === insertRequest.elementId)) {
      selectNode(insertRequest.elementId);
      clearInsertRequest();
      return;
    }

    pushHistory();

    const position = cascadePosition(currentNodes.length);
    const existingLayouts = nodesToAbsoluteLayouts(currentNodes);
    const isContainer = isContainerType(
      insertRequest.elementType as ClassElementTypeValue,
    );
    const defaultSize = getDefaultSize(
      insertRequest.elementType as ClassElementTypeValue,
    );

    updateClassDiagramLayout.mutate(
      {
        id: String(diagramId),
        modelId: String(modelId),
        elementLayouts: [
          ...existingLayouts,
          { position, elementId: insertRequest.elementId, size: defaultSize },
        ],
      },
      {
        onSuccess: () => {
          addNode({
            id: insertRequest.elementId,
            type: isContainer ? "package-node" : "class-node",
            position,
            data: buildNodeDataFromInsertRequest({
              name: insertRequest.name,
              elementId: insertRequest.elementId,
              elementType: insertRequest.elementType,
              modelId: String(modelId),
              description: insertRequest.description,
              status: insertRequest.status,
            }),
          });
          selectNode(insertRequest.elementId);
          queryClient.invalidateQueries({
            queryKey: getElementRelationsKey(insertRequest.elementId),
          });
        },
        onError: ({ message }) =>
          toast.error(
            message ||
              (isFa
                ? "خطا در افزودن عنصر به دیاگرام"
                : "Error adding element to diagram"),
          ),
      },
    );

    clearInsertRequest();
  }, [
    canEdit,
    insertRequest,
    diagramId,
    modelId,
    pushHistory,
    updateClassDiagramLayout,
    addNode,
    selectNode,
    clearInsertRequest,
    queryClient,
    isFa,
  ]);

  const getNodeColor = useCallback(
    (node: { data?: { elementType?: string } }) => {
      const type = node?.data?.elementType;
      if (!type) return "#94a3b8";
      return getClassElementTypeInfo(type as ClassElementTypeValue).color;
    },
    [],
  );

  return (
    <>
      <ClassDiagramContextMenu readOnly={!canEdit}>
        <div ref={reactFlowRef} className="flex-1 h-full w-full">
          <ReactFlow
            fitView
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            deleteKeyCode={canEdit ? "delete" : null}
            className="bg-background"
            onDrop={handleDrop}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onDragOver={handleDragOver}
            onNodesChange={onNodesChange}
            onConnect={canEdit ? handleConnect : undefined}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={canEdit ? onNodeDragStop : undefined}
            nodesDraggable={canEdit}
            nodesConnectable={canEdit}
            fitViewOptions={{ padding: 0.15 }}
          >
            <Background
              gap={20}
              size={1}
              variant={BackgroundVariant.Dots}
              className="[&>pattern]:stroke-border"
            />
            <MiniMap
              pannable
              zoomable
              position="bottom-right"
              nodeColor={getNodeColor}
              className="bg-card! border! border-border! rounded-lg overflow-hidden"
            />
            <Controls
              position="bottom-left"
              className="rounded-lg overflow-hidden border! border-border! [&>button]:bg-card! [&>button]:border-border! [&>button]:fill-foreground!"
            />
          </ReactFlow>
        </div>
      </ClassDiagramContextMenu>
      <ConnectionDialog
        open={!!pendingConnection}
        onConfirm={handleConfirm}
        onOpenChange={() => setPendingConnection(null)}
        allowedTypes={pendingConnection?.allowedTypes ?? []}
      />
    </>
  );
}
