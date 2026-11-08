"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeMouseHandler,
  type NodeMouseHandler,
  type OnEdgesChange,
  type OnNodeDrag,
  type OnNodesChange,
} from "@xyflow/react";
import { type DragEventHandler, useCallback, useEffect, useRef } from "react";
import {
  type CanvasEdge,
  type CanvasNode,
  useCanvasStore,
} from "../stores/canvas";
import { useWorkbenchStore } from "../stores/workbench";
import type { RelationshipTypeValue } from "../types/relationship";
import { useRemoveElementSync } from "./use-remove-element";
import { useRemoveRelationshipSync } from "./use-remove-relationship";
import { useSaveManager } from "./use-save-manager";

export type UseCanvasBehaviourProps = {
  onConfirm: (
    type: RelationshipTypeValue,
    name: string,
    description: string,
  ) => void;
};

/**
 * Shared canvas behaviour for both architecture and class diagrams.
 * Provides store access, ReactFlow event handlers, keyboard shortcuts,
 * auto-select from explorer, and drag-over handling.
 */
export function useCanvasBehaviour({ onConfirm }: UseCanvasBehaviourProps) {
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const { notifyChange } = useSaveManager();

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    selectEdge,
    selectNode,
    pushHistory,
    redo,
    undo,
    addNode,
    diagramId,
    modelId,
    reset,
    addEdge,
    initCanvas,
    updateNodePosition,
    setPendingConnection,
    selectedEdgeId,
    selectedNodeId,
    pendingConnection,
    clearInsertRequest,
  } = useCanvasStore();

  const { removeElement, removeElementFromDiagram, deleteElementFromModel } =
    useRemoveElementSync();
  const { removeRelationship } = useRemoveRelationshipSync();
  const queryClient = useQueryClient();

  // Auto-select element when selectedElementId changes (from explorer navigation)
  const selectedElementId = useWorkbenchStore((s) => s.selectedElementId);
  useEffect(() => {
    if (selectedElementId) {
      const currentNodes = useCanvasStore.getState().nodes;
      const node = currentNodes.find((n) => n.id === selectedElementId);
      if (node) {
        selectNode(selectedElementId);
      }
    }
  }, [selectedElementId, selectNode]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const currentNodes = useCanvasStore.getState().nodes;
      setNodes(applyNodeChanges(changes, currentNodes) as CanvasNode[]);

      const hasDimensionChange = changes.some(
        (c) =>
          c.type === "dimensions" && !(c as { resizing?: boolean }).resizing,
      );
      if (hasDimensionChange) {
        notifyChange();
      }
    },
    [setNodes, notifyChange],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const currentEdges = useCanvasStore.getState().edges;
      setEdges(applyEdgeChanges(changes, currentEdges) as CanvasEdge[]);
    },
    [setEdges],
  );

  const onNodeClick: NodeMouseHandler<CanvasNode> = useCallback(
    (_, node) => {
      selectNode(node.id);
      useWorkbenchStore.getState().selectElement(node.id);
    },
    [selectNode],
  );

  const onEdgeClick: EdgeMouseHandler<CanvasEdge> = useCallback(
    (_, edge) => {
      selectEdge(edge.id);
    },
    [selectEdge],
  );

  const onNodeDragStop: OnNodeDrag<CanvasNode> = useCallback(
    (_, node) => {
      pushHistory();
      updateNodePosition(node.id, node.position);
      notifyChange();
    },
    [updateNodePosition, pushHistory, notifyChange],
  );

  const handleDragOver: DragEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [],
  );

  const handleConfirm = useCallback(
    (type: RelationshipTypeValue, name: string, description: string) => {
      if (!pendingConnection) return;
      onConfirm(type, name, description);
    },
    [pendingConnection, onConfirm],
  );

  // Keyboard shortcuts: undo / redo / delete
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
        return;
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        e.target === document.body
      ) {
        if (selectedNodeId) {
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            deleteElementFromModel(selectedNodeId);
          } else {
            removeElementFromDiagram(selectedNodeId);
          }
        } else if (selectedEdgeId) {
          removeRelationship(selectedEdgeId);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    removeElementFromDiagram,
    deleteElementFromModel,
    removeRelationship,
    undo,
    redo,
    selectedNodeId,
    selectedEdgeId,
  ]);

  return {
    reactFlowRef,
    nodes,
    edges,
    diagramId,
    modelId,
    pendingConnection,
    selectNode,
    pushHistory,
    addNode,
    addEdge,
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
    removeElement,
    removeElementFromDiagram,
    deleteElementFromModel,
    removeRelationship,
  };
}
