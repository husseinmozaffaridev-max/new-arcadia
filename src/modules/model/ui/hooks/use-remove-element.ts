import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { getClassDiagramByIdKey } from "../clients/get-class-diagram-by-id";
import { getDiagramByIdKey } from "../clients/get-diagram-by-id";
import { useRemoveClassElement } from "../clients/remove-class-element";
import { useRemoveElement } from "../clients/remove-element";
import { useUpdateClassDiagramLayout } from "../clients/update-class-diagram-layout";
import { useUpdateDiagramLayout } from "../clients/update-diagram-layout";
import { isContainerType } from "../helpers/class-diagram";
import { type CanvasNode, useCanvasStore } from "../stores/canvas";

export type DeleteElementMode = "diagram" | "model";

export function useRemoveElementSync() {
  const router = useRouter();
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const updateClassDiagramLayout = useUpdateClassDiagramLayout();
  const updateDiagramLayout = useUpdateDiagramLayout();
  const removeElementServer = useRemoveElement();
  const removeClassElementServer = useRemoveClassElement();
  const queryClient = useQueryClient();

  const remove = useCallback(
    (nodeId: string, mode: DeleteElementMode = "model") => {
      pushHistory();

      const { nodes, edges, diagramId, modelId } = useCanvasStore.getState();
      const node = nodes.find((n) => n.id === nodeId);
      if (!diagramId || !modelId) return;

      // Item 10: "روابط هم حذف می‌شود" — remove connected edges from canvas in both modes
      setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId));

      const isClassNode =
        node?.type === "class-node" || node?.type === "package-node";

      if (isClassNode) {
        const diagramQuery = queryClient.getQueryData(
          getClassDiagramByIdKey(diagramId),
        ) as any;
        const currentLayouts = diagramQuery?.elementLayouts ?? [];

        // Promote children to root if removing a container
        const isRemovingContainer = isContainerType(
          node?.data.elementType as any,
        );
        if (isRemovingContainer) {
          const children = nodes.filter((n) => n.parentId === nodeId);
          const nodesById = new Map(nodes.map((n) => [n.id, n]));

          for (const child of children) {
            // Calculate absolute position
            let absX = child.position.x;
            let absY = child.position.y;
            let current = child;
            const visited = new Set<string>([child.id]);

            while (current.parentId && current.parentId !== nodeId) {
              if (visited.has(current.parentId)) break;
              visited.add(current.parentId);
              const parent = nodesById.get(current.parentId);
              if (!parent) break;
              absX += parent.position.x;
              absY += parent.position.y;
              current = parent;
            }

            absX += node!.position.x;
            absY += node!.position.y;

            updateNode(child.id, {
              parentId: undefined,
              extent: undefined,
              position: { x: absX, y: absY },
            });
          }
        }

        // Build layout list: exclude removed node, include promoted children
        const filteredLayouts = currentLayouts
          .filter((l: any) => l.elementId !== nodeId)
          .map((l: any) => ({
            elementId: l.elementId,
            position: l.position,
            size: l.size,
          }));

        // Add promoted children layouts
        if (isRemovingContainer) {
          const promotedChildren = nodes.filter((n) => n.parentId === nodeId);
          const nodesById = new Map(nodes.map((n) => [n.id, n]));

          for (const child of promotedChildren) {
            let absX = child.position.x;
            let absY = child.position.y;
            let current = child;
            const visited = new Set<string>([child.id]);

            while (current.parentId && current.parentId !== nodeId) {
              if (visited.has(current.parentId)) break;
              visited.add(current.parentId);
              const parent = nodesById.get(current.parentId);
              if (!parent) break;
              absX += parent.position.x;
              absY += parent.position.y;
              current = parent;
            }

            absX += node!.position.x;
            absY += node!.position.y;

            filteredLayouts.push({
              elementId: child.id,
              position: { x: absX, y: absY },
              size: { width: child.width ?? 160, height: child.height ?? 60 },
            });
          }
        }

        removeNode(nodeId);

        if (mode === "model") {
          removeClassElementServer.mutate(
            { id: nodeId, modelId },
            {
              onSuccess: () => {
                router.refresh();
                toast.success("Element deleted from model");
              },
            },
          );
        } else {
          toast.success("Element removed from diagram");
        }

        updateClassDiagramLayout.mutate(
          { id: diagramId, modelId, elementLayouts: filteredLayouts },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: getClassDiagramByIdKey(diagramId),
              });
            },
            onError: ({ message }) => {
              toast.error(message || "Error removing element from diagram");
            },
          },
        );
      } else {
        const diagramQuery = queryClient.getQueryData(
          getDiagramByIdKey(diagramId),
        ) as any;
        const currentLayouts = diagramQuery?.elementLayouts ?? [];
        const filteredLayouts = currentLayouts
          .filter((l: any) => l.elementId !== nodeId)
          .map((l: any) => ({
            elementId: l.elementId,
            position: l.position,
            size: l.size,
          }));

        removeNode(nodeId);

        if (mode === "model") {
          removeElementServer.mutate(nodeId, {
            onSuccess: () => {
              router.refresh();
              toast.success("Element deleted from model");
            },
          });
        } else {
          toast.success("Element removed from diagram");
        }

        updateDiagramLayout.mutate(
          { id: diagramId, elementLayouts: filteredLayouts },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: getDiagramByIdKey(diagramId),
              });
            },
            onError: ({ message }) => {
              toast.error(message || "Error removing element from diagram");
            },
          },
        );
      }
    },
    [
      pushHistory,
      setEdges,
      updateClassDiagramLayout,
      updateDiagramLayout,
      removeElementServer,
      removeClassElementServer,
      removeNode,
      updateNode,
      queryClient,
      router,
    ],
  );

  return {
    removeElement: remove,
    removeElementFromDiagram: (nodeId: string) => remove(nodeId, "diagram"),
    deleteElementFromModel: (nodeId: string) => remove(nodeId, "model"),
    isPending:
      updateClassDiagramLayout.isPending ||
      updateDiagramLayout.isPending ||
      removeElementServer.isPending ||
      removeClassElementServer.isPending,
  };
}
