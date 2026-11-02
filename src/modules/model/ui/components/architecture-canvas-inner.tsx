"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { type DragEventHandler, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ConnectionPolicy } from "../../domain/policies/connection";
import { getElementPlacementError } from "../actions/element-actions";
import { useConnectElements } from "../clients/connect-elements";
import { useCreateElement } from "../clients/create-element";
import { getElementRelationsKey } from "../clients/get-element-relations";
import { useUpdateDiagramLayout } from "../clients/update-diagram-layout";
import { useUpdateElement } from "../clients/update-element";
import {
  buildArchEdges,
  buildArchNodes,
  cascadePosition,
  nodesToArchLayouts,
} from "../helpers/arch-canvas";
import { getElementTypeInfo, getElementVisual } from "../helpers/element";
import { useCanvasBehaviour } from "../hooks/use-canvas-behaviour";
import { useCanvasStore } from "../stores/canvas";
import { useCanEditActiveLayer, useWorkbenchStore } from "../stores/workbench";
import type { Diagram } from "../types/diagram";
import type { Element, ElementTypeValue } from "../types/element";
import type {
  Relationship,
  RelationshipTypeValue,
} from "../types/relationship";
import { ArchitectureEdge } from "./architecture-edge";
import { ArchitectureNode } from "./architecture-node";
import { ClassDiagramContextMenu } from "./class-diagram-context-menu";
import { ConnectionDialog } from "./connection-dialog";
import { ActorNode } from "./nodes/actor-node";
import { ComponentNode } from "./nodes/component-node";
import { FunctionNode } from "./nodes/function-node";

const NODE_TYPES = {
  "architecture-node": ArchitectureNode,
  "actor-node": ActorNode,
  "function-node": FunctionNode,
  "component-node": ComponentNode,
} as const;

const EDGE_TYPES = {
  "architecture-edge": ArchitectureEdge,
} as const;

type ArchitectureCanvasInnerProps = {
  diagram: Diagram;
  elements: Element[];
  relationships: Relationship[];
};

export function ArchitectureCanvasInner({
  diagram,
  elements,
  relationships,
}: ArchitectureCanvasInnerProps) {
  // RBAC: without `edit<layer>` the canvas is fully static (no drop, no
  // connect, no drag-persist, no delete key, no mutating menu items).
  const canEdit = useCanEditActiveLayer();

  const createElement = useCreateElement();
  const updateElement = useUpdateElement();
  const connectElements = useConnectElements();
  const updateDiagramLayout = useUpdateDiagramLayout();
  const router = useRouter();

  const createRelationship = useCallback(
    (payload: {
      name: string;
      description?: string;
      sourceElementId: string;
      targetElementId: string;
      type: RelationshipTypeValue;
    }) => {
      const { modelId, pushHistory, addEdge } = useCanvasStore.getState();
      if (!modelId) return;

      pushHistory();

      connectElements.mutate(
        {
          modelId,
          name: payload.name,
          description: payload.description,
          relationshipType: payload.type,
          sourceElementId: payload.sourceElementId,
          targetElementId: payload.targetElementId,
        },
        {
          onSuccess: ({ data: relationship }) => {
            addEdge({
              id: relationship.id,
              type: "architecture-edge",
              source: payload.sourceElementId,
              target: payload.targetElementId,
              data: {
                modelId,
                name: relationship.name,
                relationshipId: relationship.id,
                relationshipType: relationship.type,
                description: relationship.description ?? "",
              },
            });
          },
          onError: ({ message }) => {
            toast.error(message || "Error creating relationship");
          },
        },
      );
    },
    [connectElements],
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
    onConfirm: (type, name, description) => {
      if (!pendingConnection) return;
      createRelationship({
        name,
        description,
        type,
        sourceElementId: pendingConnection.sourceNodeId,
        targetElementId: pendingConnection.targetNodeId,
      });
    },
  });

  // Initialize canvas on mount, clean up on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: initCanvas and reset are stable
  useEffect(() => {
    const newNodes = buildArchNodes(
      elements,
      diagram.elementLayouts,
      diagram.modelId,
    );
    const nodeIds = new Set(newNodes.map((n) => n.id));
    const newEdges = buildArchEdges(relationships, nodeIds, diagram.modelId);

    initCanvas(diagram.id, diagram.modelId, newNodes, newEdges);
    return () => reset();
  }, [initCanvas, reset]);

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

      let allowedTypes = ConnectionPolicy.getAllowedTypes(
        sourceType,
        targetType,
      ).map((rt) => rt.value) as RelationshipTypeValue[];

      let effectiveSource = connection.source;
      let effectiveTarget = connection.target;

      if (allowedTypes.length === 0) {
        const reverseAllowed = ConnectionPolicy.getAllowedTypes(
          targetType,
          sourceType,
        ).map((rt) => rt.value) as RelationshipTypeValue[];

        if (reverseAllowed.length > 0) {
          allowedTypes = reverseAllowed;
          effectiveSource = connection.target;
          effectiveTarget = connection.source;
        }
      }

      if (allowedTypes.length === 0) {
        toast.error("Cannot create a connection between these two elements.");
        return;
      }

      if (allowedTypes.length === 1) {
        createRelationship({
          name: allowedTypes[0],
          type: allowedTypes[0],
          sourceElementId: effectiveSource,
          targetElementId: effectiveTarget,
        });
        return;
      }

      setPendingConnection({
        allowedTypes,
        sourceNodeId: effectiveSource,
        targetNodeId: effectiveTarget,
      });
    },
    [setPendingConnection, createRelationship],
  );

  function findContainerAtPosition(
    nodes: Array<{
      id: string;
      position: { x: number; y: number };
      parentId?: string;
      style?: { width?: number | string; height?: number | string };
      measured?: { width?: number; height?: number };
      width?: number;
      height?: number;
      data: { elementType?: string };
    }>,
    pos: { x: number; y: number },
    draggedType: string,
  ): { id: string; absPosition: { x: number; y: number } } | null {
    const isActor =
      draggedType === "OperationalActor" ||
      draggedType === "Actor" ||
      draggedType === "LogicalActor" ||
      draggedType === "PhysicalActor";
    if (isActor) return null;

    const nodesById = new Map(nodes.map((n) => [n.id, n]));
    const getAbs = (node: (typeof nodes)[number]): { x: number; y: number } => {
      let x = node.position.x;
      let y = node.position.y;
      let current = node;
      const visited = new Set<string>();
      while (current.parentId && !visited.has(current.parentId)) {
        visited.add(current.parentId);
        const parent = nodesById.get(current.parentId);
        if (!parent) break;
        x += parent.position.x;
        y += parent.position.y;
        current = parent;
      }
      return { x, y };
    };

    const candidates: Array<{
      id: string;
      absPosition: { x: number; y: number };
      area: number;
    }> = [];

    for (const node of nodes) {
      const elType = node.data?.elementType;
      if (
        !elType ||
        elType === "OperationalActor" ||
        elType === "Actor" ||
        elType === "LogicalActor" ||
        elType === "PhysicalActor"
      ) {
        continue;
      }

      const parseDim = (val: unknown, fallback: number): number => {
        if (typeof val === "number" && !Number.isNaN(val)) return val;
        if (typeof val === "string") {
          const parsed = parseInt(val, 10);
          if (!Number.isNaN(parsed)) return parsed;
        }
        return fallback;
      };

      const width = parseDim(
        node.style?.width ?? node.measured?.width ?? node.width,
        160,
      );
      const height = parseDim(
        node.style?.height ?? node.measured?.height ?? node.height,
        60,
      );

      const abs = getAbs(node);
      if (
        pos.x >= abs.x &&
        pos.x <= abs.x + width &&
        pos.y >= abs.y &&
        pos.y <= abs.y + height
      ) {
        candidates.push({
          id: node.id,
          absPosition: abs,
          area: width * height,
        });
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.area - b.area);
    return { id: candidates[0].id, absPosition: candidates[0].absPosition };
  }

  const handleExplorerDrop = useCallback(
    (rawData: string, position: { x: number; y: number }) => {
      if (!modelId || !diagramId) return;

      try {
        const { elementId, elementType, name, status, description } =
          JSON.parse(rawData);

        const currentNodes = useCanvasStore.getState().nodes;
        if (currentNodes.some((n) => n.id === elementId)) {
          toast.info(`"${name}" is already on this diagram`);
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
          );
          if (placementError) {
            toast.error(placementError);
            return;
          }
        }

        pushHistory();

        const targetContainer = findContainerAtPosition(
          currentNodes as any,
          position,
          elementType,
        );
        const parentId = targetContainer?.id;
        const nodePos = targetContainer
          ? {
              x: Math.max(10, position.x - targetContainer.absPosition.x),
              y: Math.max(10, position.y - targetContainer.absPosition.y),
            }
          : position;

        if (parentId) {
          updateElement.mutate({
            id: elementId,
            name,
            parentId,
          });
        }

        const elementLayouts = nodesToArchLayouts(currentNodes);

        updateDiagramLayout.mutate(
          {
            id: String(diagramId),
            elementLayouts: [
              ...elementLayouts,
              { position, elementId, size: { width: 160, height: 60 } },
            ],
          },
          {
            onSuccess: () => {
              addNode({
                id: elementId,
                type: getNodeTypeForElementType(elementType),
                position: nodePos,
                parentId,
                extent: parentId ? "parent" : undefined,
                data: {
                  name,
                  elementId,
                  elementType,
                  modelId: String(modelId),
                  description: description ?? "",
                  status: status ?? "DRAFT",
                  parentId,
                },
              });
              selectNode(elementId);
              queryClient.invalidateQueries({
                queryKey: getElementRelationsKey(elementId),
              });
              router.refresh();
              toast.success(`Added "${name}" to diagram`);
            },
            onError: ({ message }) =>
              toast.error(message || "Error adding element to diagram"),
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
      updateElement,
      updateDiagramLayout,
      addNode,
      selectNode,
      queryClient,
      router,
    ],
  );

  const handlePaletteDrop = useCallback(
    (elementType: string, position: { x: number; y: number }) => {
      if (!modelId || !diagramId) return;

      pushHistory();

      const elementTypeInfo = getElementTypeInfo(elementType);
      const currentNodes = useCanvasStore.getState().nodes;
      const targetContainer = findContainerAtPosition(
        currentNodes as any,
        position,
        elementType,
      );
      const parentId = targetContainer?.id;
      const nodePos = targetContainer
        ? {
            x: Math.max(10, position.x - targetContainer.absPosition.x),
            y: Math.max(10, position.y - targetContainer.absPosition.y),
          }
        : position;

      createElement.mutate(
        {
          type: elementType as ElementTypeValue,
          layer: elementTypeInfo.layer,
          modelId: String(modelId),
          name: elementTypeInfo.label,
          parentId,
        },
        {
          onSuccess: ({ data: element }) => {
            const currentNodesAfter = useCanvasStore.getState().nodes;
            const elementLayouts = nodesToArchLayouts(currentNodesAfter);

            updateDiagramLayout.mutate(
              {
                id: String(diagramId),
                elementLayouts: [
                  ...elementLayouts,
                  {
                    position,
                    elementId: element.id,
                    size: { width: 160, height: 60 },
                  },
                ],
              },
              {
                onError: ({ message }) => {
                  toast.error(message || "Error adding element");
                },
                onSuccess: () => {
                  addNode({
                    id: element.id,
                    type: getNodeTypeForElementType(element.type),
                    position: nodePos,
                    parentId,
                    extent: parentId ? "parent" : undefined,
                    data: {
                      name: element.name,
                      elementId: element.id,
                      elementType: element.type,
                      modelId: String(modelId),
                      description: element.description,
                      status: element.properties.status,
                      parentId: parentId ?? undefined,
                    },
                  });
                  router.refresh();
                },
              },
            );
          },
          onError: ({ message }) => {
            toast.error(message || "Error adding element");
          },
        },
      );
    },
    [
      modelId,
      diagramId,
      pushHistory,
      createElement,
      updateDiagramLayout,
      addNode,
      router,
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

  // Insert request from explorer (add existing element to diagram)
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
    const existingLayouts = nodesToArchLayouts(currentNodes);

    updateDiagramLayout.mutate(
      {
        id: String(diagramId),
        elementLayouts: [
          ...existingLayouts,
          {
            position,
            elementId: insertRequest.elementId,
            size: { width: 160, height: 60 },
          },
        ],
      },
      {
        onSuccess: () => {
          addNode({
            id: insertRequest.elementId,
            type: getNodeTypeForElementType(insertRequest.elementType),
            position,
            data: {
              name: insertRequest.name,
              elementId: insertRequest.elementId,
              elementType: insertRequest.elementType,
              modelId: String(modelId),
              description: insertRequest.description,
              status: insertRequest.status,
            },
          });
          selectNode(insertRequest.elementId);
          queryClient.invalidateQueries({
            queryKey: getElementRelationsKey(insertRequest.elementId),
          });
        },
        onError: ({ message }) =>
          toast.error(message || "Error adding element to diagram"),
      },
    );

    clearInsertRequest();
  }, [
    canEdit,
    insertRequest,
    diagramId,
    modelId,
    pushHistory,
    updateDiagramLayout,
    addNode,
    selectNode,
    clearInsertRequest,
    queryClient,
  ]);

  const getNodeColor = useCallback(
    (node: { data?: { elementType?: string } }) => {
      const type = node?.data?.elementType;
      if (!type) return "#94a3b8";
      return (
        getElementVisual(type as ElementTypeValue)?.strokeColor || "#94a3b8"
      );
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

function getNodeTypeForElementType(
  type: string,
): "actor-node" | "function-node" | "component-node" | "architecture-node" {
  if (type.endsWith("Actor") || type.endsWith("Entity")) return "actor-node";
  if (type.endsWith("Function") || type.endsWith("Activity"))
    return "function-node";
  if (type.endsWith("Component")) return "component-node";
  return "architecture-node";
}
