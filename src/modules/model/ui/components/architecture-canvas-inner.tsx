"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import {
  type DragEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ConnectionPolicy } from "../../domain/policies/connection";
import { getElementPlacementError } from "../actions/element-actions";
import { useConnectElements } from "../clients/connect-elements";
import { useCreateElement } from "../clients/create-element";
import { getDiagramByIdKey } from "../clients/get-diagram-by-id";
import { getElementRelationsKey } from "../clients/get-element-relations";
import { getRelationshipsByModelIdKey } from "../clients/get-relationships-by-model-id";
import { useUpdateDiagramLayout } from "../clients/update-diagram-layout";
import { useUpdateElement } from "../clients/update-element";
import {
  buildArchEdges,
  buildArchNodes,
  cascadePosition,
  nodesToArchLayouts,
} from "../helpers/arch-canvas";
import {
  canNestOnDiagram,
  getConnectionFailureMessage,
  getDiagramPalette,
  getDiagramVisibleRelationshipTypes,
  isTreeBreakdownDiagram,
  planHierarchyConnection,
} from "../helpers/diagram";
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
import { HierarchyConnectionDialog } from "./hierarchy-connection-dialog";
import { ActorNode } from "./nodes/actor-node";
import { ComponentNode } from "./nodes/component-node";
import { EntityNode } from "./nodes/entity-node";
import { FunctionNode } from "./nodes/function-node";

const NODE_TYPES = {
  "architecture-node": ArchitectureNode,
  "actor-node": ActorNode,
  "entity-node": EntityNode,
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

function isActorType(type?: string): boolean {
  if (!type) return false;
  return type.endsWith("Actor");
}

export function ArchitectureCanvasInner({
  diagram,
  elements,
  relationships,
}: ArchitectureCanvasInnerProps) {
  const locale = useLocale();
  const isFa = locale === "fa";

  // RBAC: without `edit<layer>` the canvas is fully static (no drop, no
  // connect, no drag-persist, no delete key, no mutating menu items).
  const canEdit = useCanEditActiveLayer();

  const createElement = useCreateElement();
  const updateElement = useUpdateElement();
  const connectElements = useConnectElements();
  const updateDiagramLayout = useUpdateDiagramLayout();
  const relationQueryClient = useQueryClient();
  const visibleRelationshipIdsRef = useRef<string[] | null>(
    diagram.visibleRelationshipIds ?? null,
  );
  const [visibleRelationshipIds, setVisibleRelationshipIds] = useState<
    string[] | null
  >(diagram.visibleRelationshipIds ?? null);
  const [pendingHierarchy, setPendingHierarchy] = useState<{
    childId: string;
    parentId: string;
    childName: string;
    parentName: string;
  } | null>(null);

  const saveVisibleRelationships = useCallback(
    (ids: string[]) => {
      if (!diagram.id) return;
      const previous = visibleRelationshipIdsRef.current;
      visibleRelationshipIdsRef.current = ids;
      setVisibleRelationshipIds(ids);
      updateDiagramLayout.mutate(
        { id: diagram.id, visibleRelationshipIds: ids },
        {
          onSuccess: () => {
            relationQueryClient.invalidateQueries({
              queryKey: getDiagramByIdKey(diagram.id),
            });
          },
          onError: ({ message }) => {
            visibleRelationshipIdsRef.current = previous;
            setVisibleRelationshipIds(previous);
            toast.error(
              message ||
                (isFa
                  ? "خطا در ذخیرهٔ روابط نمودار"
                  : "Error saving diagram relationships"),
            );
          },
        },
      );
    },
    [diagram.id, updateDiagramLayout, isFa, relationQueryClient],
  );

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
            relationQueryClient.invalidateQueries({
              queryKey: getRelationshipsByModelIdKey(modelId),
            });
            const current =
              visibleRelationshipIdsRef.current ??
              useCanvasStore
                .getState()
                .edges.filter(
                  (edge) =>
                    !(
                      edge.data &&
                      "hierarchy" in edge.data &&
                      edge.data.hierarchy
                    ),
                )
                .map((edge) => edge.id);
            saveVisibleRelationships([
              ...new Set([...current, relationship.id]),
            ]);
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
            toast.error(
              message ||
                (isFa ? "خطا در ایجاد رابطه" : "Error creating relationship"),
            );
          },
        },
      );
    },
    [connectElements, isFa, saveVisibleRelationships, relationQueryClient],
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
      diagram.type,
    );
    const nodeIds = new Set(newNodes.map((n) => n.id));
    const newEdges = buildArchEdges(
      relationships,
      nodeIds,
      diagram.modelId,
      diagram.type,
      elements,
      diagram.visibleRelationshipIds,
    );

    initCanvas(diagram.id, diagram.modelId, newNodes, newEdges);
    return () => reset();
  }, [initCanvas, reset, diagram.type]);

  const toggleRelationshipVisibility = useCallback(
    (relationshipId: string, checked: boolean) => {
      const currentIds =
        visibleRelationshipIdsRef.current ??
        useCanvasStore
          .getState()
          .edges.filter(
            (edge) =>
              !(edge.data && "hierarchy" in edge.data && edge.data.hierarchy),
          )
          .map((edge) => edge.id);
      const nextIds = checked
        ? [...new Set([...currentIds, relationshipId])]
        : currentIds.filter((id) => id !== relationshipId);
      saveVisibleRelationships(nextIds);
      const currentNodes = useCanvasStore.getState().nodes;
      const nodeIds = new Set(currentNodes.map((node) => node.id));
      const existingEdges = useCanvasStore.getState().edges;
      const knownRelationships = [...relationships];
      for (const edge of existingEdges) {
        if (
          !edge.data ||
          ("hierarchy" in edge.data && edge.data.hierarchy) ||
          knownRelationships.some((rel) => rel.id === edge.id)
        )
          continue;
        knownRelationships.push({
          id: edge.id,
          name: edge.data.name,
          description: edge.data.description,
          type: edge.data.relationshipType,
          sourceElementId: edge.source,
          targetElementId: edge.target,
        } as Relationship);
      }
      useCanvasStore
        .getState()
        .setEdges(
          buildArchEdges(
            knownRelationships,
            nodeIds,
            diagram.modelId,
            diagram.type,
            elements,
            nextIds,
          ),
        );
    },
    [
      saveVisibleRelationships,
      relationships,
      diagram.modelId,
      diagram.type,
      elements,
    ],
  );

  const confirmHierarchy = useCallback(() => {
    if (!pendingHierarchy || !modelId) return;
    const { childId, parentId, childName } = pendingHierarchy;
    const childNode = useCanvasStore
      .getState()
      .nodes.find((node) => node.id === childId);
    if (!childNode) return;

    updateElement.mutate(
      {
        id: childId,
        name: childNode.data.name,
        description: childNode.data.description ?? "",
        parentId,
      },
      {
        onSuccess: () => {
          const store = useCanvasStore.getState();
          store.updateNodeData(childId, { parentId });
          const current = useCanvasStore.getState();
          const nodeIds = new Set(current.nodes.map((node) => node.id));
          const hierarchyElements = current.nodes.map((node) => ({
            id: node.id,
            parentId: node.data.parentId,
          }));
          const hierarchyEdges = buildArchEdges(
            [],
            nodeIds,
            modelId,
            diagram.type,
            hierarchyElements,
            [],
          );
          current.setEdges([
            ...current.edges.filter(
              (edge) =>
                !(edge.data && "hierarchy" in edge.data && edge.data.hierarchy),
            ),
            ...hierarchyEdges,
          ]);
          queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
          setPendingHierarchy(null);
          toast.success(
            isFa
              ? `«${childName}» به ساختار شکست اضافه شد.`
              : `Added "${childName}" to the breakdown.`,
          );
        },
        onError: ({ message }) =>
          toast.error(
            message ||
              (isFa
                ? "خطا در تغییر ساختار فعالیت"
                : "Could not update the hierarchy"),
          ),
      },
    );
  }, [
    pendingHierarchy,
    modelId,
    updateElement,
    diagram.type,
    queryClient,
    isFa,
  ]);

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

      const activeTab = useWorkbenchStore
        .getState()
        .tabs.find((t) => t.diagramId === diagramId);
      const diagramType = activeTab?.type ?? diagram.type;
      const diagramPalette = getDiagramPalette(diagramType);

      if (isTreeBreakdownDiagram(diagramType)) {
        const parentIds = new Map(
          elements.map((element) => [element.id, element.parentId]),
        );
        for (const node of currentNodes) {
          parentIds.set(node.id, node.data.parentId ?? null);
        }
        const plan = planHierarchyConnection(
          { id: sourceNode.id, type: sourceType },
          { id: targetNode.id, type: targetType },
          diagramType,
          [...parentIds].map(([id, parentId]) => ({ id, parentId })),
        );
        if (plan === "valid") {
          setPendingHierarchy({
            childId: sourceNode.id,
            parentId: targetNode.id,
            childName: sourceNode.data.name,
            parentName: targetNode.data.name,
          });
        } else if (plan === "already-parent") {
          toast.info(
            isFa
              ? "این عنصر از قبل زیرمجموعهٔ عنصر مقصد است."
              : "This element is already a child of the target.",
          );
        } else if (plan === "cycle" || plan === "self") {
          toast.error(
            isFa
              ? "ساختار شکست نمی‌تواند دور یا اتصال به خود داشته باشد."
              : "A breakdown cannot contain a cycle or self-link.",
          );
        } else {
          toast.error(
            getConnectionFailureMessage(
              sourceType,
              targetType,
              diagramType,
              isFa,
            ),
          );
        }
        return;
      }

      let allowedTypes = ConnectionPolicy.getAllowedTypes(
        sourceType,
        targetType,
      ).map((rt) => rt.value) as RelationshipTypeValue[];

      // Filter by active diagram's allowed relationship types
      allowedTypes = allowedTypes.filter((rt) =>
        diagramPalette.relationshipTypes.includes(rt),
      );

      let effectiveSource = connection.source;
      let effectiveTarget = connection.target;

      if (allowedTypes.length === 0) {
        let reverseAllowed = ConnectionPolicy.getAllowedTypes(
          targetType,
          sourceType,
        ).map((rt) => rt.value) as RelationshipTypeValue[];

        reverseAllowed = reverseAllowed.filter((rt) =>
          diagramPalette.relationshipTypes.includes(rt),
        );

        if (reverseAllowed.length > 0) {
          allowedTypes = reverseAllowed;
          effectiveSource = connection.target;
          effectiveTarget = connection.source;
        }
      }

      if (allowedTypes.length === 0) {
        toast.error(
          getConnectionFailureMessage(
            sourceType,
            targetType,
            diagramType,
            isFa,
          ),
        );
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
    [
      setPendingConnection,
      createRelationship,
      diagramId,
      diagram.type,
      isFa,
      elements,
    ],
  );

  const findContainerAtPosition = useCallback(
    (
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
      diagramType?: string,
    ): { id: string; absPosition: { x: number; y: number } } | null => {
      const nodesById = new Map(nodes.map((n) => [n.id, n]));
      const getAbs = (
        node: (typeof nodes)[number],
      ): { x: number; y: number } => {
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
        if (!elType) continue;

        if (diagramType) {
          if (!canNestOnDiagram(draggedType, elType, diagramType)) {
            continue;
          }
        } else {
          if (isActorType(elType)) continue;
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
    },
    [],
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
        const diagramType = activeTab?.type ?? diagram.type;
        const placementError = getElementPlacementError(
          name,
          elementType,
          diagramType,
          locale,
        );
        if (placementError) {
          toast.error(placementError);
          return;
        }

        pushHistory();

        const targetContainer = findContainerAtPosition(
          currentNodes,
          position,
          elementType,
          diagramType,
        );
        const parentId = targetContainer?.id;
        const nodePos = targetContainer
          ? {
              x: Math.max(10, position.x - targetContainer.absPosition.x),
              y: Math.max(10, position.y - targetContainer.absPosition.y),
            }
          : position;

        const elementLayouts = nodesToArchLayouts(currentNodes);
        const savePlacement = () =>
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

        if (parentId) {
          updateElement.mutate(
            { id: elementId, name, description: description ?? "", parentId },
            {
              onSuccess: () => savePlacement(),
              onError: ({ message }) =>
                toast.error(
                  message ||
                    (isFa
                      ? "خطا در دربرگیری عنصر"
                      : "Error containing element"),
                ),
            },
          );
        } else {
          savePlacement();
        }
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
      locale,
      isFa,
      diagram.type,
      findContainerAtPosition,
    ],
  );

  const handlePaletteDrop = useCallback(
    (elementType: string, position: { x: number; y: number }) => {
      if (!modelId || !diagramId) return;

      pushHistory();

      const activeTab = useWorkbenchStore
        .getState()
        .tabs.find((t) => t.diagramId === diagramId);
      const diagramType = activeTab?.type ?? diagram.type;

      const elementTypeInfo = getElementTypeInfo(elementType);
      const currentNodes = useCanvasStore.getState().nodes;
      const targetContainer = findContainerAtPosition(
        currentNodes,
        position,
        elementType,
        diagramType,
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
            // Immediate optimistic-style node placement on canvas
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
            selectNode(element.id);

            // Save layout in background
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
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: ["workbench-data"],
                  });
                },
                onError: ({ message }) => {
                  toast.error(
                    message ||
                      (isFa ? "خطا در ذخیره چیدمان" : "Error saving layout"),
                  );
                },
              },
            );
          },
          onError: ({ message }) => {
            toast.error(
              message || (isFa ? "خطا در افزودن عنصر" : "Error adding element"),
            );
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
      queryClient,
      isFa,
      diagram.type,
      selectNode,
      findContainerAtPosition,
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

    const activeTab = useWorkbenchStore
      .getState()
      .tabs.find((t) => t.diagramId === diagramId);
    const diagramType = activeTab?.type ?? diagram.type;
    const placementError = getElementPlacementError(
      insertRequest.name,
      insertRequest.elementType,
      diagramType,
      locale,
    );
    if (placementError) {
      toast.error(placementError);
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
    updateDiagramLayout,
    addNode,
    selectNode,
    clearInsertRequest,
    queryClient,
    locale,
    isFa,
    diagram.type,
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
            {canEdit && (
              <Panel position="top-right" className="nodrag nopan">
                <details className="w-64 rounded-md border bg-card shadow-sm text-xs">
                  <summary className="cursor-pointer px-3 py-2 font-medium">
                    {isFa ? "روابط این نمودار" : "Diagram relationships"}
                  </summary>
                  <div className="max-h-64 overflow-y-auto border-t p-2">
                    {relationships
                      .filter(
                        (rel) =>
                          nodes.some(
                            (node) => node.id === rel.sourceElementId,
                          ) &&
                          nodes.some(
                            (node) => node.id === rel.targetElementId,
                          ) &&
                          getDiagramVisibleRelationshipTypes(
                            diagram.type,
                          ).includes(rel.type),
                      )
                      .map((rel) => (
                        <label
                          key={rel.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={
                              visibleRelationshipIds === null ||
                              visibleRelationshipIds.includes(rel.id)
                            }
                            onChange={(event) =>
                              toggleRelationshipVisibility(
                                rel.id,
                                event.target.checked,
                              )
                            }
                          />
                          <span className="truncate" title={rel.name}>
                            {rel.name || rel.type}
                          </span>
                        </label>
                      ))}
                    {!relationships.some(
                      (rel) =>
                        nodes.some((node) => node.id === rel.sourceElementId) &&
                        nodes.some((node) => node.id === rel.targetElementId),
                    ) && (
                      <p className="px-1 py-2 text-muted-foreground">
                        {isFa
                          ? "برای نمایش روابط، عناصر مرتبط را به نمودار اضافه کنید."
                          : "Add related elements to show relationships."}
                      </p>
                    )}
                  </div>
                </details>
              </Panel>
            )}
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
      <HierarchyConnectionDialog
        open={!!pendingHierarchy}
        childName={pendingHierarchy?.childName ?? ""}
        parentName={pendingHierarchy?.parentName ?? ""}
        saving={updateElement.isPending}
        onConfirm={confirmHierarchy}
        onOpenChange={(open) => {
          if (!open) setPendingHierarchy(null);
        }}
      />
    </>
  );
}

function getNodeTypeForElementType(
  type: string,
):
  | "actor-node"
  | "entity-node"
  | "function-node"
  | "component-node"
  | "architecture-node" {
  if (type.endsWith("Actor")) return "actor-node";
  if (type.endsWith("Entity")) return "entity-node";
  if (type.endsWith("Function") || type.endsWith("Activity"))
    return "function-node";
  if (type.endsWith("Component")) return "component-node";
  return "architecture-node";
}
