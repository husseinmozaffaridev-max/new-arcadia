"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type NodeMouseHandler,
  type OnNodeDrag,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowRightLeft, Waypoints } from "lucide-react";
import type { DragEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/modules/shared/ui/hooks/use-confirm";
import { useCreateFragment } from "../clients/create-fragment";
import { useCreateLifeline } from "../clients/create-lifeline";
import { useCreateMessage } from "../clients/create-message";
import { getFragmentsByScenarioIdKey } from "../clients/get-fragments-by-scenario-id";
import { getLifelinesByScenarioIdKey } from "../clients/get-lifelines-by-scenario-id";
import { getMessagesByScenarioIdKey } from "../clients/get-messages-by-scenario-id";
import { useRemoveFragment } from "../clients/remove-fragment";
import { useRemoveLifeline } from "../clients/remove-lifeline";
import { useRemoveMessage } from "../clients/remove-message";
import { useReorderLifelines } from "../clients/reorder-lifelines";
import { useSetFragmentOperands } from "../clients/set-fragment-operands";
import { useUpdateFragmentPosition } from "../clients/update-fragment-position";
import { useUpdateMessage } from "../clients/update-message";
import {
  computeCanopyHeight,
  executionOrderToY,
  LIFELINE_AXIS_X,
  LIFELINE_HEADER_WIDTH,
  LIFELINE_SPACING,
  mapToLifelineType,
  yToExecutionOrder,
} from "../constants/scenario";
import { computeMessageNumbers } from "../lib/message-numbering";
import { useScenarioSelectionStore } from "../stores/scenario-selection";
import { useCanEditActiveLayer, useWorkbenchStore } from "../stores/workbench";
import { useCanvasStore } from "../stores/canvas";
import type { Diagram } from "../types/diagram";
import { CreateFragmentDialog } from "./create-fragment-dialog";
import { CreateLifelineDialog } from "./create-lifeline-dialog";
import { CreateMessageDialog } from "./create-message-dialog";
import { MessageEdge } from "./edges/message-edge";
import { ExecutionSpecOverlay } from "./execution-spec-overlay";
import { EnvironmentNode } from "./nodes/environment-node";
import {
  FRAGMENT_H_PADDING,
  FRAGMENT_TOP_PAD,
  FragmentNode,
} from "./nodes/fragment-node";
import { LifelineNode } from "./nodes/lifeline-node";
import { ScenarioContextMenu } from "./scenario-context-menu";
import { ScenarioLegend } from "./scenario-legend";

const NODE_TYPES = {
  lifeline: LifelineNode,
  fragment: FragmentNode,
  environment: EnvironmentNode,
};

const EDGE_TYPES = {
  message: MessageEdge,
};

type LifelineData = {
  id: string;
  scenarioId: string;
  name: string;
  representedElementType: string;
  columnIndex: number;
};

type MessageData = {
  id: string;
  name: string;
  kind: string;
  sourceLifelineId: string;
  targetLifelineId: string;
  executionOrder: number;
};

type FragmentData = {
  id: string;
  name: string;
  operator: string;
  guard: string;
  rowIndex: number;
  columnIndex: number;
  spanColumns: number;
};

type FragmentOperandData = {
  id: string;
  fragmentId: string;
  position: number;
  guard: string;
};

type ScenarioCanvasInnerProps = {
  diagram: Pick<Diagram, "id" | "modelId" | "type" | "name">;
  lifelines: LifelineData[];
  messages: MessageData[];
  fragments: FragmentData[];
  fragmentOperands: FragmentOperandData[];
};

function getHandleIdForOrder(order: number): string {
  const index = Math.min(order, 9);
  return `h-${index}`;
}

function ZoomIndicator() {
  const { getViewport } = useReactFlow();
  const viewport = getViewport();
  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <Panel position="bottom-center" className="!mb-0">
      <div className="flex items-center gap-2 rounded-md border bg-background/90 px-2.5 py-1 text-[10px] font-mono text-muted-foreground/70 shadow-sm backdrop-blur-sm">
        <span>{zoomPercent}%</span>
      </div>
    </Panel>
  );
}

export function ScenarioCanvasInner({
  diagram,
  lifelines,
  messages,
  fragments,
  fragmentOperands,
}: ScenarioCanvasInnerProps) {
  // RBAC: without `edit<layer>` the canvas is fully static.
  const canEdit = useCanEditActiveLayer();

  const queryClient = useQueryClient();
  const reorderLifelines = useReorderLifelines();
  const removeLifeline = useRemoveLifeline();
  const removeMessage = useRemoveMessage();
  const updateMessage = useUpdateMessage();
  const removeFragment = useRemoveFragment();
  const updateFragmentPosition = useUpdateFragmentPosition(diagram.id);
  const setFragmentOperands = useSetFragmentOperands();
  const confirm = useConfirm();
  const createLifeline = useCreateLifeline(diagram.id);
  const createMessage = useCreateMessage(diagram.id);
  const createFragment = useCreateFragment(diagram.id);

  const [lifelineDialogOpen, setLifelineDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [fragmentDialogOpen, setFragmentDialogOpen] = useState(false);

  const setSelectedLifeline = useScenarioSelectionStore(
    (s) => s.setSelectedLifeline,
  );
  const setSelectedMessage = useScenarioSelectionStore(
    (s) => s.setSelectedMessage,
  );
  const clearSelection = useScenarioSelectionStore((s) => s.clearSelection);
  const selectedLifeline = useScenarioSelectionStore((s) => s.selectedLifeline);
  const selectedMessage = useScenarioSelectionStore((s) => s.selectedMessage);
  const selectedFragment = useScenarioSelectionStore((s) => s.selectedFragment);

  const sortedLifelines = useMemo(() => {
    return [...lifelines].sort((a, b) => a.columnIndex - b.columnIndex);
  }, [lifelines]);

  const maxExecutionOrder = useMemo(() => {
    if (messages.length === 0) return 0;
    return Math.max(...messages.map((m) => m.executionOrder));
  }, [messages]);

  const canopyHeight = useMemo(
    () => computeCanopyHeight(maxExecutionOrder),
    [maxExecutionOrder],
  );

  // Compute creation/destruction info per lifeline from messages
  const lifelineLifecycles = useMemo(() => {
    const map = new Map<string, { createdBy?: number; destroyedBy?: number }>();
    for (const msg of messages) {
      if (msg.kind === "CREATE") {
        map.set(msg.targetLifelineId, {
          ...map.get(msg.targetLifelineId),
          createdBy: msg.executionOrder,
        });
      }
      if (msg.kind === "DELETE") {
        map.set(msg.targetLifelineId, {
          ...map.get(msg.targetLifelineId),
          destroyedBy: msg.executionOrder,
        });
      }
    }
    return map;
  }, [messages]);

  const fragmentOperandsByFragment = useMemo(() => {
    const map = new Map<string, FragmentOperandData[]>();
    for (const operand of fragmentOperands) {
      const list = map.get(operand.fragmentId) ?? [];
      list.push(operand);
      map.set(operand.fragmentId, list);
    }
    return map;
  }, [fragmentOperands]);

  const handleFragmentPositionCommit = useCallback(
    (
      fragmentId: string,
      rowIndex: number,
      columnIndex: number,
      spanColumns: number,
    ) => {
      updateFragmentPosition.mutate({
        id: fragmentId,
        rowIndex: Math.max(0, rowIndex),
        columnIndex: Math.max(0, columnIndex),
        spanColumns: Math.max(1, spanColumns),
      });
    },
    [updateFragmentPosition],
  );

  const handleFragmentOperandsCommit = useCallback(
    (fragmentId: string, operands: { position: number; guard: string }[]) => {
      setFragmentOperands.mutate(
        { fragmentId, operands },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["get-fragment-operands-by-fragment-ids", diagram.id],
            });
          },
          onError: ({ message }) => {
            toast.error(message || "Error updating fragment branches");
          },
        },
      );
    },
    [setFragmentOperands, queryClient, diagram.id],
  );

  const initialNodes = useMemo(() => {
    const lifelineNodes = sortedLifelines.map((lifeline, index) => {
      const lifecycle = lifelineLifecycles.get(lifeline.id);
      const createdByOrder = lifecycle?.createdBy;
      const destroyedByOrder = lifecycle?.destroyedBy;

      // If created by a message, offset the lifeline header to that message's Y pos
      const yOffset =
        createdByOrder !== undefined ? executionOrderToY(createdByOrder) : 0;

      return {
        id: `lifeline-${lifeline.id}`,
        type: "lifeline" as const,
        position: {
          x:
            LIFELINE_AXIS_X +
            index * LIFELINE_SPACING -
            LIFELINE_HEADER_WIDTH / 2,
          y: yOffset,
        },
        data: {
          name: lifeline.name,
          representedElementType: lifeline.representedElementType,
          columnIndex: index,
          scenarioId: lifeline.scenarioId,
          lifelineId: lifeline.id,
          canopyHeight: canopyHeight - yOffset,
          createdByExecutionOrder: createdByOrder,
          destroyedByExecutionOrder: destroyedByOrder,
        },
      };
    });

    const fragmentNodes = fragments.map((fragment) => {
      // Vertical extent: top = rowIndex, bottom = last contained message row
      // (a fragment wraps its content; nested fragments start a new span).
      const nextRowBelow = fragments
        .filter((f) => f.rowIndex > fragment.rowIndex)
        .reduce<number | null>(
          (min, f) => (min === null ? f.rowIndex : Math.min(min, f.rowIndex)),
          null,
        );
      const upperBound = nextRowBelow ?? maxExecutionOrder + 1;
      const containedOrders = messages
        .filter(
          (msg) =>
            msg.executionOrder >= fragment.rowIndex &&
            msg.executionOrder < upperBound,
        )
        .map((msg) => msg.executionOrder);
      const bottomOrder = containedOrders.length
        ? Math.max(...containedOrders) + 1
        : fragment.rowIndex + 1;

      // Horizontal extent: persisted columnIndex + spanColumns.
      const span = Math.max(
        1,
        Math.min(
          fragment.spanColumns,
          sortedLifelines.length - fragment.columnIndex,
        ),
      );
      const padding = FRAGMENT_H_PADDING;
      const x1 =
        LIFELINE_AXIS_X +
        fragment.columnIndex * LIFELINE_SPACING -
        LIFELINE_HEADER_WIDTH / 2 -
        padding;
      const x2 =
        LIFELINE_AXIS_X +
        (fragment.columnIndex + span - 1) * LIFELINE_SPACING +
        LIFELINE_HEADER_WIDTH / 2 +
        padding;
      const width = x2 - x1;

      const yStart = executionOrderToY(fragment.rowIndex) - FRAGMENT_TOP_PAD;
      const yEnd = executionOrderToY(bottomOrder);
      const height = yEnd - yStart;

      const fragmentOperands = fragmentOperandsByFragment
        .get(fragment.id)
        ?.slice()
        .sort((a, b) => a.position - b.position)
        .map((op) => ({ id: op.id, position: op.position, guard: op.guard }));

      return {
        id: `fragment-${fragment.id}`,
        type: "fragment" as const,
        position: {
          x: x1,
          y: yStart,
        },
        data: {
          name: fragment.name,
          operator: fragment.operator,
          guard: fragment.guard,
          fragmentId: fragment.id,
          scenarioId: diagram.id,
          rowIndex: fragment.rowIndex,
          columnIndex: fragment.columnIndex,
          spanColumns: span,
          operands: fragmentOperands ?? [],
          onPositionCommit: handleFragmentPositionCommit,
          onOperandsCommit: handleFragmentOperandsCommit,
        },
        style: {
          zIndex: -1,
          width: Math.max(width, 120),
          height: Math.max(height, 80),
        },
      };
    });

    return [...lifelineNodes, ...fragmentNodes];
  }, [
    sortedLifelines,
    fragments,
    canopyHeight,
    lifelineLifecycles.get,
    messages,
    fragmentOperandsByFragment,
    maxExecutionOrder,
    handleFragmentPositionCommit,
    handleFragmentOperandsCommit,
    diagram.id,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Sync nodes from props to ReactFlow state when data changes
  const prevNodeSignatureRef = useRef<string>("");
  const isDraggingRef = useRef(false);

  useEffect(() => {
    // Don't sync during drag operations - let React Flow handle positions
    if (isDraggingRef.current) return;

    const currentSignature = [
      ...sortedLifelines.map(
        (l) => `${l.id}:${l.name}:${l.columnIndex}:${l.representedElementType}`,
      ),
      `|`,
      ...fragments.map(
        (f) =>
          `${f.id}:${f.name}:${f.operator}:${f.guard}:${f.rowIndex}:${f.columnIndex}:${f.spanColumns}`,
      ),
    ].join(",");

    if (currentSignature !== prevNodeSignatureRef.current) {
      prevNodeSignatureRef.current = currentSignature;
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes, sortedLifelines, fragments]);

  const messageNumbers = useMemo(
    () => computeMessageNumbers(messages, fragments),
    [messages, fragments],
  );

  const handleMessageMoveToOrder = useCallback(
    (messageId: string, newOrder: number) => {
      const dragged = messages.find((m) => m.id === messageId);
      if (!dragged) return;
      const clamped = Math.max(0, newOrder);
      if (clamped === dragged.executionOrder) return;

      const occupant = messages.find(
        (m) => m.executionOrder === clamped && m.id !== messageId,
      );

      const invalidate = () =>
        queryClient.invalidateQueries({
          queryKey: getMessagesByScenarioIdKey(diagram.id),
        });

      if (occupant) {
        // Swap the two rows so they never overlap.
        updateMessage.mutate(
          { id: messageId, executionOrder: clamped },
          {
            onSuccess: () => {
              updateMessage.mutate(
                { id: occupant.id, executionOrder: dragged.executionOrder },
                {
                  onSuccess: invalidate,
                  onError: ({ message }) => {
                    toast.error(message || "Error swapping messages");
                    invalidate();
                  },
                },
              );
            },
            onError: ({ message }) => {
              toast.error(message || "Error moving message");
              invalidate();
            },
          },
        );
        return;
      }

      updateMessage.mutate(
        { id: messageId, executionOrder: clamped },
        {
          onSuccess: invalidate,
          onError: ({ message }) => {
            toast.error(message || "Error moving message");
            invalidate();
          },
        },
      );
    },
    [messages, updateMessage, queryClient, diagram.id],
  );

  const initialEdges = useMemo(() => {
    return messages.map((message) => ({
      id: `message-${message.id}`,
      type: "message" as const,
      source: `lifeline-${message.sourceLifelineId}`,
      target: `lifeline-${message.targetLifelineId}`,
      sourceHandle: getHandleIdForOrder(message.executionOrder),
      targetHandle: getHandleIdForOrder(message.executionOrder),
      data: {
        name: message.name,
        kind: message.kind,
        executionOrder: message.executionOrder,
        messageId: message.id,
        scenarioId: diagram.id,
        numberLabel: messageNumbers.get(message.id),
        onMoveToOrder: handleMessageMoveToOrder,
      },
    }));
  }, [messages, diagram.id, messageNumbers, handleMessageMoveToOrder]);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const prevEdgeSignatureRef = useRef<string>("");
  useEffect(() => {
    const currentSignature = messages
      .map(
        (m) =>
          `${m.id}:${m.name}:${m.kind}:${m.executionOrder}:${m.sourceLifelineId}:${m.targetLifelineId}`,
      )
      .join(",");

    if (currentSignature !== prevEdgeSignatureRef.current) {
      prevEdgeSignatureRef.current = currentSignature;
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges, messages]);

  const maxFragmentRow = useMemo(() => {
    if (fragments.length === 0) return 0;
    return Math.max(...fragments.map((f) => f.rowIndex)) + 1;
  }, [fragments]);

  const handleDeleteSelected = useCallback(async () => {
    const selection = useScenarioSelectionStore.getState();
    const selected =
      selection.selectedLifeline ??
      selection.selectedMessage ??
      selection.selectedFragment;
    if (!selected) return;

    const ok = await confirm({
      tone: "danger",
      title: "Delete sequence item",
      description: `Delete "${selected.name}"? This action cannot be undone.`,
      confirmText: "Delete",
    });
    if (!ok) return;

    const invalidate = (queryKey: readonly unknown[]) => {
      queryClient.invalidateQueries({ queryKey });
    };

    if (selection.selectedLifeline) {
      removeLifeline.mutate(
        { id: selection.selectedLifeline.lifelineId },
        {
          onSuccess: () => {
            selection.clearSelection();
            invalidate(getLifelinesByScenarioIdKey(diagram.id));
            invalidate(getMessagesByScenarioIdKey(diagram.id));
            toast.success("Lifeline deleted");
          },
          onError: ({ message }) =>
            toast.error(message || "Error deleting lifeline"),
        },
      );
    } else if (selection.selectedMessage) {
      removeMessage.mutate(
        { id: selection.selectedMessage.messageId },
        {
          onSuccess: () => {
            selection.clearSelection();
            invalidate(getMessagesByScenarioIdKey(diagram.id));
            toast.success("Message deleted");
          },
          onError: ({ message }) =>
            toast.error(message || "Error deleting message"),
        },
      );
    } else if (selection.selectedFragment) {
      removeFragment.mutate(
        { id: selection.selectedFragment.id },
        {
          onSuccess: () => {
            selection.clearSelection();
            invalidate(getFragmentsByScenarioIdKey(diagram.id));
            toast.success("Fragment deleted");
          },
          onError: ({ message }) =>
            toast.error(message || "Error deleting fragment"),
        },
      );
    }
  }, [
    confirm,
    diagram.id,
    queryClient,
    removeLifeline,
    removeMessage,
    removeFragment,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (isInput) return;
        e.preventDefault();
        handleDeleteSelected();
      }

      // Escape — clear selection
      if (e.key === "Escape") {
        clearSelection();
      }

      // Ctrl/Cmd + A — select all messages
      if (isMod && e.key === "a") {
        if (isInput) return;
        e.preventDefault();
        const allMessageIds = messages.map((m) => m.id);
        useScenarioSelectionStore
          .getState()
          .selectMultipleMessages(allMessageIds);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelected, clearSelection, messages]);

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!canEdit) return;

      // Item 16: Drag & drop from left model explorer tree into Scenario canvas
      const explorerRaw = event.dataTransfer.getData(
        "application/explorer-element",
      );
      if (explorerRaw) {
        try {
          const { elementId, elementType, name } = JSON.parse(explorerRaw);

          const lifelineType = mapToLifelineType(elementType);
          if (!lifelineType) {
            toast.error(
              `عنصر «${name || elementType}» نمی‌تواند به عنوان خط حیات (Lifeline) در نمودار سناریو قرار گیرد. تنها بازیگران، مؤلفه‌ها و توابع مجاز هستند.`,
            );
            return;
          }

          createLifeline.mutate(
            {
              name: name || `New ${lifelineType.toLowerCase()}`,
              representedElementType: lifelineType,
              representedElementId:
                lifelineType === "CLASS_ELEMENT" ? elementId : undefined,
              representedElementExternalId:
                lifelineType !== "CLASS_ELEMENT" ? elementId : undefined,
              columnIndex: sortedLifelines.length,
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: getLifelinesByScenarioIdKey(diagram.id),
                });
                toast.success(`Lifeline "${name}" added to scenario`);
              },
              onError: ({ message }) =>
                toast.error(message || "Error adding lifeline"),
            },
          );
          return;
        } catch {
          // ignore parse error and proceed to palette check
        }
      }

      const raw = event.dataTransfer.getData("application/scenario-palette");
      if (!raw) return;

      try {
        const payload = JSON.parse(raw) as {
          type: "lifeline" | "message" | "fragment";
          lifelineType?: string;
          messageType?: string;
          operator?: string;
        };

        if (payload.type === "lifeline" && payload.lifelineType) {
          createLifeline.mutate(
            {
              name: `New ${payload.lifelineType.toLowerCase()}`,
              representedElementType: payload.lifelineType,
              columnIndex: sortedLifelines.length,
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: getLifelinesByScenarioIdKey(diagram.id),
                });
                toast.success("Lifeline added");
              },
              onError: ({ message }) => toast.error(message),
            },
          );
        } else if (payload.type === "fragment" && payload.operator) {
          createFragment.mutate(
            {
              name: `${payload.operator.toUpperCase()} fragment`,
              operator: payload.operator,
              rowIndex: maxFragmentRow,
              columnIndex: 0,
              spanColumns: Math.max(sortedLifelines.length, 1),
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: getFragmentsByScenarioIdKey(diagram.id),
                });
                toast.success("Fragment added");
              },
              onError: ({ message }) => toast.error(message),
            },
          );
        } else if (
          payload.type === "message" &&
          payload.messageType &&
          sortedLifelines.length >= 2
        ) {
          createMessage.mutate(
            {
              name: `${payload.messageType.toLowerCase()} message`,
              kind: payload.messageType,
              sourceLifelineId: sortedLifelines[0].id,
              targetLifelineId: sortedLifelines[1].id,
              executionOrder: maxExecutionOrder + 1,
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: getMessagesByScenarioIdKey(diagram.id),
                });
                toast.success("Message added");
              },
              onError: ({ message }) => toast.error(message),
            },
          );
        } else if (payload.type === "message") {
          toast.error("Add at least two lifelines before creating a message");
        }
      } catch {
        toast.error("Invalid scenario palette item");
      }
    },
    [
      canEdit,
      createLifeline,
      createMessage,
      createFragment,
      sortedLifelines,
      maxFragmentRow,
      maxExecutionOrder,
      queryClient,
      diagram.id,
    ],
  );

  // Support "Add to Diagram" action from Project Explorer context menu
  const insertRequest = useCanvasStore((s) => s.insertRequest);
  useEffect(() => {
    if (!canEdit) return;
    if (!insertRequest) return;

    const activeTab = useWorkbenchStore
      .getState()
      .tabs.find((t) => t.diagramId === diagram.id);
    if (!activeTab || activeTab.diagramId !== diagram.id) return;

    const lifelineType = mapToLifelineType(insertRequest.elementType);
    if (!lifelineType) {
      toast.error(
        `عنصر «${insertRequest.name}» نمی‌تواند به عنوان خط حیات در نمودار سناریو قرار گیرد. تنها بازیگران، مؤلفه‌ها و توابع مجاز هستند.`,
      );
      useCanvasStore.getState().clearInsertRequest();
      return;
    }

    createLifeline.mutate(
      {
        name: insertRequest.name,
        representedElementType: lifelineType,
        representedElementId:
          lifelineType === "CLASS_ELEMENT"
            ? insertRequest.elementId
            : undefined,
        representedElementExternalId:
          lifelineType !== "CLASS_ELEMENT"
            ? insertRequest.elementId
            : undefined,
        columnIndex: sortedLifelines.length,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getLifelinesByScenarioIdKey(diagram.id),
          });
          toast.success(`Lifeline "${insertRequest.name}" added to scenario`);
          useCanvasStore.getState().clearInsertRequest();
        },
        onError: ({ message }) => {
          toast.error(message || "Error adding lifeline");
          useCanvasStore.getState().clearInsertRequest();
        },
      },
    );
  }, [
    canEdit,
    insertRequest,
    diagram.id,
    sortedLifelines.length,
    createLifeline,
    queryClient,
  ]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.id.startsWith("lifeline-")) {
        const lifelineId = node.id.replace("lifeline-", "");
        const lifeline = sortedLifelines.find((l) => l.id === lifelineId);
        if (!lifeline) return;
        setSelectedLifeline({
          id: lifeline.id,
          name: lifeline.name,
          representedElementType: lifeline.representedElementType,
          lifelineId: lifeline.id,
        });
      } else if (node.id.startsWith("fragment-")) {
        const fragmentId = node.id.replace("fragment-", "");
        const fragment = fragments.find((f) => f.id === fragmentId);
        if (!fragment) return;
        useScenarioSelectionStore.getState().setSelectedFragment({
          id: fragment.id,
          name: fragment.name,
          operator: fragment.operator,
          guard: fragment.guard,
        });
      }
    },
    [sortedLifelines, fragments, setSelectedLifeline],
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: { id: string }) => {
      if (!edge.id.startsWith("message-")) return;
      const messageId = edge.id.replace("message-", "");
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      // Shift+click for multi-selection
      if (event.shiftKey) {
        useScenarioSelectionStore.getState().toggleMessageSelection(messageId);
        return;
      }

      setSelectedMessage({
        id: message.id,
        name: message.name,
        kind: message.kind,
        sourceLifelineId: message.sourceLifelineId,
        targetLifelineId: message.targetLifelineId,
        executionOrder: message.executionOrder,
        messageId: message.id,
      });
    },
    [messages, setSelectedMessage],
  );

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      isDraggingRef.current = false;

      if (node.id.startsWith("fragment-")) {
        const fragmentId = node.id.replace("fragment-", "");
        const fragment = fragments.find((f) => f.id === fragmentId);
        if (!fragment) return;

        const newColumnIndex = Math.round(
          (node.position.x +
            LIFELINE_HEADER_WIDTH / 2 +
            FRAGMENT_H_PADDING -
            LIFELINE_AXIS_X) /
            LIFELINE_SPACING,
        );
        const clampedColumn = Math.max(0, newColumnIndex);
        const newRowIndex = Math.max(
          0,
          yToExecutionOrder(node.position.y + FRAGMENT_TOP_PAD),
        );

        if (
          clampedColumn !== fragment.columnIndex ||
          newRowIndex !== fragment.rowIndex
        ) {
          updateFragmentPosition.mutate({
            id: fragmentId,
            rowIndex: newRowIndex,
            columnIndex: clampedColumn,
            spanColumns: fragment.spanColumns,
          });
        }
        return;
      }

      if (!node.id.startsWith("lifeline-")) return;

      const draggedLifelineId = node.id.replace("lifeline-", "");
      const newX = node.position.x + LIFELINE_HEADER_WIDTH / 2;
      const newColumnIndex = Math.round(
        (newX - LIFELINE_AXIS_X) / LIFELINE_SPACING,
      );
      const clampedIndex = Math.max(
        0,
        Math.min(newColumnIndex, sortedLifelines.length - 1),
      );

      const currentOrder = sortedLifelines.map((l) => l.id);
      const draggedIdx = currentOrder.indexOf(draggedLifelineId);
      if (draggedIdx === -1 || draggedIdx === clampedIndex) return;

      const newOrder = [...currentOrder];
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(clampedIndex, 0, draggedLifelineId);

      const hasChanged =
        newOrder.length !== currentOrder.length ||
        newOrder.some((id, i) => id !== currentOrder[i]);
      if (!hasChanged) return;

      reorderLifelines.mutate(
        { scenarioId: diagram.id, lifelineIds: newOrder },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getLifelinesByScenarioIdKey(diagram.id),
            });
          },
          onError: ({ message }) => {
            toast.error(message || "Error reordering lifelines");
            queryClient.invalidateQueries({
              queryKey: getLifelinesByScenarioIdKey(diagram.id),
            });
          },
        },
      );
    },
    [
      sortedLifelines,
      reorderLifelines,
      diagram.id,
      queryClient,
      fragments,
      updateFragmentPosition,
    ],
  );

  const handleNodeDragStart: OnNodeDrag = useCallback((_event, node) => {
    if (node.id.startsWith("lifeline-")) {
      isDraggingRef.current = true;
    }
  }, []);

  const handleNodeDrag: OnNodeDrag = useCallback(
    (_event, node) => {
      if (node.id.startsWith("lifeline-")) {
        // Constrain lifeline to horizontal-only movement
        const original = initialNodes.find((n) => n.id === node.id);
        if (original) {
          node.position.y = original.position.y;
        }
      }
    },
    [initialNodes],
  );

  const hasSelection =
    selectedLifeline !== null ||
    selectedMessage !== null ||
    selectedFragment !== null;
  const selectedType = selectedLifeline
    ? "lifeline"
    : selectedMessage
      ? "message"
      : selectedFragment
        ? "fragment"
        : undefined;

  // Move message up/down in execution order
  const handleMoveUp = useCallback(() => {
    const selection = useScenarioSelectionStore.getState();
    if (!selection.selectedMessage) return;
    const currentOrder = selection.selectedMessage.executionOrder;
    if (currentOrder <= 0) return;
    updateMessage.mutate(
      {
        id: selection.selectedMessage.messageId,
        executionOrder: currentOrder - 1,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getMessagesByScenarioIdKey(diagram.id),
          });
        },
      },
    );
  }, [diagram.id, queryClient, updateMessage]);

  const handleMoveDown = useCallback(() => {
    const selection = useScenarioSelectionStore.getState();
    if (!selection.selectedMessage) return;
    const currentOrder = selection.selectedMessage.executionOrder;
    if (currentOrder >= maxExecutionOrder) return;
    updateMessage.mutate(
      {
        id: selection.selectedMessage.messageId,
        executionOrder: currentOrder + 1,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getMessagesByScenarioIdKey(diagram.id),
          });
        },
      },
    );
  }, [diagram.id, queryClient, updateMessage, maxExecutionOrder]);

  // Move lifeline left/right
  const handleMoveLifelineLeft = useCallback(() => {
    const selection = useScenarioSelectionStore.getState();
    if (!selection.selectedLifeline) return;
    const idx = sortedLifelines.findIndex(
      (l) => l.id === selection.selectedLifeline?.lifelineId,
    );
    if (idx <= 0) return;
    const newOrder = sortedLifelines.map((l) => l.id);
    newOrder.splice(idx, 1);
    newOrder.splice(idx - 1, 0, selection.selectedLifeline.lifelineId);
    reorderLifelines.mutate(
      { scenarioId: diagram.id, lifelineIds: newOrder },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getLifelinesByScenarioIdKey(diagram.id),
          });
        },
      },
    );
  }, [sortedLifelines, diagram.id, queryClient, reorderLifelines]);

  const handleMoveLifelineRight = useCallback(() => {
    const selection = useScenarioSelectionStore.getState();
    if (!selection.selectedLifeline) return;
    const idx = sortedLifelines.findIndex(
      (l) => l.id === selection.selectedLifeline?.lifelineId,
    );
    if (idx === -1 || idx >= sortedLifelines.length - 1) return;
    const newOrder = sortedLifelines.map((l) => l.id);
    newOrder.splice(idx, 1);
    newOrder.splice(idx + 1, 0, selection.selectedLifeline.lifelineId);
    reorderLifelines.mutate(
      { scenarioId: diagram.id, lifelineIds: newOrder },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getLifelinesByScenarioIdKey(diagram.id),
          });
        },
      },
    );
  }, [sortedLifelines, diagram.id, queryClient, reorderLifelines]);

  // Context menu move handlers
  const contextMoveUp =
    selectedType === "message"
      ? handleMoveUp
      : selectedType === "lifeline"
        ? handleMoveLifelineLeft
        : undefined;
  const contextMoveDown =
    selectedType === "message"
      ? handleMoveDown
      : selectedType === "lifeline"
        ? handleMoveLifelineRight
        : undefined;

  // Add a branch (operand) to the selected fragment at the midpoint of its span
  const selectedFragmentForBranch =
    selectedType === "fragment"
      ? fragments.find((f) => f.id === selectedFragment?.id)
      : undefined;
  const canAddBranch =
    !!selectedFragmentForBranch &&
    (selectedFragmentForBranch.operator === "alt" ||
      selectedFragmentForBranch.operator === "par");

  const handleAddBranch = useCallback(() => {
    const fragment = selectedFragmentForBranch;
    if (!fragment) return;

    const existing = fragmentOperandsByFragment.get(fragment.id) ?? [];
    const nextRowBelow = fragments
      .filter((f) => f.rowIndex > fragment.rowIndex)
      .reduce<number | null>(
        (min, f) => (min === null ? f.rowIndex : Math.min(min, f.rowIndex)),
        null,
      );
    const upperBound = nextRowBelow ?? maxExecutionOrder + 1;
    const containedOrders = messages
      .filter(
        (msg) =>
          msg.executionOrder >= fragment.rowIndex &&
          msg.executionOrder < upperBound,
      )
      .map((msg) => msg.executionOrder);
    const bottomOrder = containedOrders.length
      ? Math.max(...containedOrders)
      : fragment.rowIndex + 1;

    // New branch starts after the last existing branch position.
    const lastPosition = existing.reduce(
      (max, op) => Math.max(max, op.position),
      fragment.rowIndex,
    );
    const newPosition = Math.min(
      Math.max(lastPosition + 1, fragment.rowIndex + 1),
      Math.max(bottomOrder, fragment.rowIndex + 1),
    );

    const firstGuard = existing.find(
      (op) => op.position === fragment.rowIndex,
    )?.guard;
    const branchOperands: { position: number; guard: string }[] = [
      { position: fragment.rowIndex, guard: firstGuard ?? fragment.guard },
      ...existing
        .filter((op) => op.position !== fragment.rowIndex)
        .map((op) => ({ position: op.position, guard: op.guard })),
      { position: newPosition, guard: "" },
    ];

    setFragmentOperands.mutate(
      { fragmentId: fragment.id, operands: branchOperands },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["get-fragment-operands-by-fragment-ids", diagram.id],
          });
        },
        onError: ({ message }) => {
          toast.error(message || "Error adding branch");
        },
      },
    );
  }, [
    selectedFragmentForBranch,
    fragmentOperandsByFragment,
    fragments,
    maxExecutionOrder,
    messages,
    setFragmentOperands,
    queryClient,
    diagram.id,
  ]);

  const canMoveUp =
    selectedType === "message"
      ? (selectedMessage?.executionOrder ?? 0) > 0
      : selectedType === "lifeline"
        ? sortedLifelines.findIndex(
            (l) => l.id === selectedLifeline?.lifelineId,
          ) > 0
        : false;
  const canMoveDown =
    selectedType === "message"
      ? (selectedMessage?.executionOrder ?? 0) < maxExecutionOrder
      : selectedType === "lifeline"
        ? sortedLifelines.findIndex(
            (l) => l.id === selectedLifeline?.lifelineId,
          ) <
          sortedLifelines.length - 1
        : false;

  const handleAddEnvironment = useCallback(() => {
    const envWidth =
      sortedLifelines.length > 0
        ? (sortedLifelines.length - 1) * LIFELINE_SPACING + 280
        : 600;
    const envHeight = canopyHeight;

    const envNode = {
      id: `environment-${Date.now()}`,
      type: "environment" as const,
      position: { x: 60, y: -20 },
      data: {
        width: envWidth,
        height: envHeight,
        label: "Environment",
      },
      style: { zIndex: -2 },
    };

    setNodes((nds) => [...nds, envNode] as typeof nds);
  }, [sortedLifelines, canopyHeight, setNodes]);

  return (
    <div className="flex h-full min-h-0 w-full">
      <ScenarioContextMenu
        readOnly={!canEdit}
        onAddLifeline={() => setLifelineDialogOpen(true)}
        onAddMessage={() => setMessageDialogOpen(true)}
        onAddFragment={() => setFragmentDialogOpen(true)}
        onAddEnvironment={handleAddEnvironment}
        onDeleteSelected={handleDeleteSelected}
        onRenameSelected={() => {
          if (selectedType === "lifeline" || selectedType === "message") {
            useScenarioSelectionStore.getState().setRenaming(true);
          }
        }}
        onMoveUp={contextMoveUp}
        onMoveDown={contextMoveDown}
        onAddBranch={handleAddBranch}
        hasSelection={hasSelection}
        selectedType={selectedType}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        canAddBranch={canAddBranch}
      >
        <div
          className="flex-1 h-full w-full"
          onDragOver={handleDragOver}
          onDrop={canEdit ? handleDrop : undefined}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-background"
            minZoom={0.1}
            maxZoom={2.5}
            defaultEdgeOptions={{
              type: "message",
            }}
            onPaneClick={handlePaneClick}
            onNodeClick={handleNodeClick}
            onNodeDragStart={canEdit ? handleNodeDragStart : undefined}
            onNodeDrag={canEdit ? handleNodeDrag : undefined}
            onNodeDragStop={canEdit ? handleNodeDragStop : undefined}
            onEdgeClick={handleEdgeClick}
            onDragOver={handleDragOver}
            onDrop={canEdit ? handleDrop : undefined}
            nodesDraggable={canEdit}
            nodesConnectable={false}
            snapToGrid
            snapGrid={[20, 20]}
          >
            <Background
              gap={20}
              size={1}
              variant={BackgroundVariant.Dots}
              color="currentColor"
              className="[&>pattern]:stroke-border/40"
            />
            <ExecutionSpecOverlay
              lifelines={sortedLifelines}
              messages={messages}
            />
            <MiniMap
              pannable
              zoomable
              position="bottom-right"
              className="bg-card! border! border-border! rounded-lg overflow-hidden shadow-sm"
              maskColor="rgba(0,0,0,0.05)"
            />
            <Controls
              position="bottom-left"
              className="rounded-lg overflow-hidden border! border-border! shadow-sm [&>button]:bg-card! [&>button]:border-border! [&>button]:fill-foreground! [&>button]:hover:bg-muted!"
              showInteractive={false}
            />
            <ScenarioLegend />
            <ZoomIndicator />

            {/* Empty state: no participants yet */}
            {sortedLifelines.length === 0 && (
              <Panel position="top-center" className="!mt-[35vh]">
                <div className="flex flex-col items-center gap-4 text-muted-foreground/50 select-none pointer-events-none">
                  <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center">
                    <Waypoints className="size-7 opacity-50" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-muted-foreground/70">
                      No participants yet
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground/50 max-w-[280px]">
                      Drag an element from the model explorer, from the palette, or right-click to add a
                      participant to this scenario
                    </p>
                  </div>
                </div>
              </Panel>
            )}

            {/* Empty state: participants exist but no interactions yet */}
            {sortedLifelines.length > 0 &&
              messages.length === 0 &&
              fragments.length === 0 && (
                <Panel position="top-center" className="!mt-[120px]">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground/40 select-none">
                    <ArrowRightLeft className="size-7 opacity-40" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground/60">
                        No interactions yet
                      </p>
                      <p className="text-[10px] mt-0.5 text-muted-foreground/40">
                        Drag a message from the palette or right-click to create
                        one
                      </p>
                    </div>
                  </div>
                </Panel>
              )}
          </ReactFlow>

          <CreateLifelineDialog
            open={lifelineDialogOpen}
            onOpenChange={setLifelineDialogOpen}
            scenarioId={diagram.id}
            existingLifelineCount={sortedLifelines.length}
          />

          <CreateMessageDialog
            open={messageDialogOpen}
            onOpenChange={setMessageDialogOpen}
            scenarioId={diagram.id}
            lifelines={sortedLifelines}
            nextExecutionOrder={maxExecutionOrder + 1}
          />

          <CreateFragmentDialog
            open={fragmentDialogOpen}
            onOpenChange={setFragmentDialogOpen}
            scenarioId={diagram.id}
            maxRowIndex={maxFragmentRow}
            lifelineCount={sortedLifelines.length}
          />
        </div>
      </ScenarioContextMenu>
    </div>
  );
}
