import { create } from "zustand";
import {
  isProjectLayer,
  PROJECT_LAYERS,
  type ProjectLayer,
} from "@/modules/project/domain/constants/permissions";
import {
  canEditLayer as canEditLayerPermission,
  canViewLayer as canViewLayerPermission,
} from "@/modules/project/domain/services/permissions";
import type { DiagramTypeValue } from "../types/diagram";
import type { LayerValue } from "../types/layer";

/**
 * یک تب باز در ناحیه ویرایشگر (Editor Area).
 * هر تب نماینده یک دیاگرام باز است.
 */
export interface EditorTab {
  diagramId: string;
  modelId: string;
  name: string;
  type: DiagramTypeValue;
  layer: LayerValue;
}

/** پنل‌های قابل نمایش/مخفی در Workbench */
export interface PanelVisibility {
  explorer: boolean;
  properties: boolean;
  outline: boolean;
  semantic: boolean;
  validation: boolean;
}

interface WorkbenchState {
  projectId: string | null;
  projectName: string | null;

  tabs: EditorTab[];
  activeDiagramId: string | null;

  /**
   * المنت انتخاب‌شده از طریق درخت (Project Explorer).
   * انتخاب روی canvas از طریق useCanvasStore مدیریت می‌شود؛
   * این مقدار برای همگام‌سازی انتخاب درختی با پنل Properties / Semantic است.
   */
  selectedElementId: string | null;

  /** لایه فعلی برای نمایش در Layer Switcher */
  currentLayer: LayerValue;

  /** Overrides for element names so edits in canvas/properties instantly reflect in the tree. */
  elementNameOverrides: Record<string, string>;
  setElementName: (elementId: string, name: string) => void;

  /** Permissions of the requesting user for the loaded project (RBAC). */
  projectPermissions: string[];

  /**
   * RBAC: whether `projectPermissions` reflects the loaded project.
   * Until it does, every permission check fails closed.
   */
  permissionsResolved: boolean;

  panels: PanelVisibility;

  setProject: (projectId: string, projectName: string) => void;
  openTab: (tab: EditorTab) => void;
  closeTab: (diagramId: string) => void;
  setActiveTab: (diagramId: string) => void;
  renameTab: (diagramId: string, name: string) => void;

  selectElement: (elementId: string | null) => void;

  setCurrentLayer: (layer: LayerValue) => void;

  setProjectPermissions: (permissions: string[]) => void;

  /**
   * RBAC: does the loaded project grant `edit<Layer>`?
   * Fails closed while the permissions are unresolved, so no mutating control
   * is ever rendered before the API answer is known. Non-RBAC-governed layers
   * (legacy "EPBS") are always editable.
   */
  canEditLayer: (layer: LayerValue) => boolean;

  /** RBAC: does the loaded project grant `view<Layer>`? (fails closed) */
  canViewLayer: (layer: LayerValue) => boolean;

  /** RBAC: the RBAC-governed layers the user may open, in ARCADIA order. */
  visibleLayers: () => ProjectLayer[];

  togglePanel: (panel: keyof PanelVisibility) => void;
  setPanel: (panel: keyof PanelVisibility, open: boolean) => void;

  /** هنگام تعویض پروژه، کل وضعیت ویرایشگر ریست می‌شود. */
  resetForProject: (projectId: string, projectName: string) => void;
}

const DEFAULT_PANELS: PanelVisibility = {
  explorer: true,
  properties: true,
  outline: false,
  semantic: false,
  validation: false,
};

/**
 * Pure RBAC checks over a resolved permission list. Shared by the store
 * getters and by components that must evaluate several layers at once —
 * hooks cannot be called inside a loop.
 * Fails closed while `permissionsResolved` is false; legacy layers outside
 * the RBAC model (e.g. "EPBS") stay open.
 */
export function isLayerEditable(
  projectPermissions: readonly string[],
  permissionsResolved: boolean,
  layer: LayerValue,
): boolean {
  if (!permissionsResolved) return false;
  if (!isProjectLayer(layer)) return true;
  return canEditLayerPermission(projectPermissions, layer);
}

/** Pure view counterpart of {@link isLayerEditable}. */
export function isLayerVisible(
  projectPermissions: readonly string[],
  permissionsResolved: boolean,
  layer: LayerValue,
): boolean {
  if (!permissionsResolved) return false;
  if (!isProjectLayer(layer)) return true;
  return canViewLayerPermission(projectPermissions, layer);
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  projectId: null,
  projectName: null,
  tabs: [],
  activeDiagramId: null,
  selectedElementId: null,
  currentLayer: "OA",
  elementNameOverrides: {},
  setElementName: (elementId, name) =>
    set((s) => ({
      elementNameOverrides: { ...s.elementNameOverrides, [elementId]: name },
    })),
  projectPermissions: [],
  permissionsResolved: false,
  panels: { ...DEFAULT_PANELS },

  setProject: (projectId, projectName) => set({ projectId, projectName }),

  openTab: (tab) =>
    set((s) => {
      const exists = s.tabs.some((t) => t.diagramId === tab.diagramId);
      return {
        tabs: exists ? s.tabs : [...s.tabs, tab],
        activeDiagramId: tab.diagramId,
        currentLayer: tab.layer,
      };
    }),

  closeTab: (diagramId) =>
    set((s) => {
      const index = s.tabs.findIndex((t) => t.diagramId === diagramId);
      if (index === -1) return {};

      const tabs = s.tabs.filter((t) => t.diagramId !== diagramId);

      let activeDiagramId = s.activeDiagramId;
      let currentLayer = s.currentLayer;
      if (s.activeDiagramId === diagramId) {
        const next = tabs[index] ?? tabs[index - 1] ?? null;
        activeDiagramId = next?.diagramId ?? null;
        if (next) currentLayer = next.layer;
      }

      return { tabs, activeDiagramId, currentLayer };
    }),

  setActiveTab: (diagramId) =>
    set((s) => {
      const tab = s.tabs.find((t) => t.diagramId === diagramId);
      return {
        activeDiagramId: diagramId,
        currentLayer: tab?.layer ?? s.currentLayer,
      };
    }),

  renameTab: (diagramId, name) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.diagramId === diagramId ? { ...t, name } : t)),
    })),

  selectElement: (selectedElementId) => set({ selectedElementId }),

  setCurrentLayer: (currentLayer) => set({ currentLayer }),

  setProjectPermissions: (projectPermissions) =>
    set({ projectPermissions, permissionsResolved: true }),

  canEditLayer: (layer) =>
    isLayerEditable(get().projectPermissions, get().permissionsResolved, layer),

  canViewLayer: (layer) =>
    isLayerVisible(get().projectPermissions, get().permissionsResolved, layer),

  visibleLayers: () => {
    const { projectPermissions, permissionsResolved } = get();
    if (!permissionsResolved) return [];
    return PROJECT_LAYERS.filter((layer) =>
      isLayerVisible(projectPermissions, permissionsResolved, layer),
    );
  },

  togglePanel: (panel) =>
    set((s) => ({ panels: { ...s.panels, [panel]: !s.panels[panel] } })),

  setPanel: (panel, open) =>
    set((s) => ({ panels: { ...s.panels, [panel]: open } })),

  resetForProject: (projectId, projectName) =>
    set({
      projectId,
      projectName,
      tabs: [],
      activeDiagramId: null,
      selectedElementId: null,
      currentLayer: "OA",
      elementNameOverrides: {},
      projectPermissions: [],
      permissionsResolved: false,
      panels: { ...DEFAULT_PANELS },
    }),
}));

// ─── RBAC hooks ──────────────────────────────────────────────────────────────

/** RBAC: `edit<layer>` for a specific layer (fails closed until resolved). */
export function useCanEditLayer(layer: LayerValue): boolean {
  return useWorkbenchStore((s) => s.canEditLayer(layer));
}

/** RBAC: `view<layer>` for a specific layer (fails closed until resolved). */
export function useCanViewLayer(layer: LayerValue): boolean {
  return useWorkbenchStore((s) => s.canViewLayer(layer));
}

/** RBAC: `edit<layer>` for the layer selected in the Layer Switcher. */
export function useCanEditCurrentLayer(): boolean {
  return useWorkbenchStore((s) => s.canEditLayer(s.currentLayer));
}

/** RBAC: `view<layer>` for the layer selected in the Layer Switcher. */
export function useCanViewCurrentLayer(): boolean {
  return useWorkbenchStore((s) => s.canViewLayer(s.currentLayer));
}

/** RBAC: true when the user may edit at least one RBAC-governed layer. */
export function useCanEditAnyLayer(): boolean {
  return useWorkbenchStore((s) =>
    PROJECT_LAYERS.some((layer) => s.canEditLayer(layer)),
  );
}

/**
 * RBAC: `edit<layer>` for the diagram open in the active editor tab (falls
 * back to the layer switcher's current layer). Used by canvases, nodes and
 * context menus that have no explicit layer prop.
 */
export function useCanEditActiveLayer(): boolean {
  return useWorkbenchStore((s) => {
    const tab = s.tabs.find((t) => t.diagramId === s.activeDiagramId);
    return s.canEditLayer(tab?.layer ?? s.currentLayer);
  });
}

/** RBAC: false until the loaded project's permissions are known. */
export function usePermissionsResolved(): boolean {
  return useWorkbenchStore((s) => s.permissionsResolved);
}
