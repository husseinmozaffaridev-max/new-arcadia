"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUpdateClassDiagramLayout } from "../clients/update-class-diagram-layout";
import { useUpdateDiagramLayout } from "../clients/update-diagram-layout";
import { nodesToArchLayouts } from "../helpers/arch-canvas";
import { nodesToAbsoluteLayouts } from "../helpers/class-diagram";
import { useCanvasStore } from "../stores/canvas";
import { useModelStore } from "../stores/model";

const DEBOUNCE_MS = 2000;
const MAX_PENDING = 5;

/**
 * useSaveManager
 *
 * After every canvas change:
 * - increments pendingChanges
 * - if ≥ MAX_PENDING or 2s of silence → sends layout to API
 *
 * On unmount (e.g. switching editor tabs) any pending change is flushed
 * immediately so layout edits are never lost.
 *
 * Automatically selects the correct layout update mutation based on
 * whether the current diagram is a class diagram (CDB) or architecture diagram.
 */
export function useSaveManager() {
  const updateDiagramLayout = useUpdateDiagramLayout();
  const updateClassDiagramLayout = useUpdateClassDiagramLayout();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChanges = useModelStore((s) => s.pendingChanges);

  const flush = useCallback(async () => {
    const currentDiagramId = useCanvasStore.getState().diagramId;
    const currentModelId = useCanvasStore.getState().modelId;
    const currentNodes = useCanvasStore.getState().nodes;
    if (!currentDiagramId) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    useModelStore.getState().setSaveStatus("saving");

    // Determine which mutation to use based on node type
    const isClassDiagram =
      currentNodes.length > 0 &&
      (currentNodes[0]?.type === "class-node" ||
        currentNodes[0]?.type === "package-node");

    const layouts = isClassDiagram
      ? nodesToAbsoluteLayouts(currentNodes)
      : nodesToArchLayouts(currentNodes as any);

    if (isClassDiagram) {
      updateClassDiagramLayout.mutate(
        {
          id: currentDiagramId,
          modelId: currentModelId!,
          elementLayouts: layouts,
        },
        {
          onSuccess: () => {
            useModelStore.getState().resetPending();
            useModelStore.getState().setSaveStatus("saved");
          },
          onError: ({ message }) => {
            useModelStore.getState().setSaveStatus("error");
            toast.error(message || "Error saving diagram");
          },
        },
      );
    } else {
      updateDiagramLayout.mutate(
        {
          id: currentDiagramId,
          elementLayouts: layouts,
        },
        {
          onSuccess: () => {
            useModelStore.getState().resetPending();
            useModelStore.getState().setSaveStatus("saved");
          },
          onError: ({ message }) => {
            useModelStore.getState().setSaveStatus("error");
            toast.error(message || "Error saving diagram");
          },
        },
      );
    }
  }, [updateDiagramLayout, updateClassDiagramLayout]);

  // نگه‌داشتن آخرین نسخه‌ی flush برای فراخوانی هنگام unmount
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const notifyChange = useCallback(() => {
    useModelStore.getState().incrementPending();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);
  }, [flush]);

  useEffect(() => {
    if (pendingChanges >= MAX_PENDING) {
      flush();
    }
  }, [pendingChanges, flush]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // در صورت وجود تغییر معلق هنگام unmount، فوراً ذخیره کن
        flushRef.current();
      }
    };
  }, []);

  return { notifyChange, flush };
}
