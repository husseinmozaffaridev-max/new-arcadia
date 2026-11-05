"use client";

import {
  Activity,
  Box,
  Boxes,
  ChevronDown,
  ChevronRight,
  FilePlus2,
  Folder,
  GitBranchPlus,
  GitMerge,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Pencil,
  Plus,
  Target,
  Trash2,
  Users,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/modules/shared/ui/components/ui/context-menu";
import { cn } from "@/modules/shared/ui/libs/cn";
import {
  getDiagramPlacements,
  getNewElementActions,
} from "../../actions/element-actions";
import { CLASS_ELEMENT_TYPES } from "../../constants/class-diagram";
import { getElementTypeIcon } from "../../constants/element-icons";
import { LAYER_HEX_COLORS, OFFERED_LAYERS } from "../../constants/layer";
import { getElementTypesForLayer, getElementVisual } from "../../helpers/element";
import {
  getLayerInfo,
  getNextOfferedLayer,
  getNextOfferedLayerLabel,
} from "../../helpers/layer";
import { isLayerEditable, useWorkbenchStore } from "../../stores/workbench";
import type {
  ClassElementData,
  ClassElementTypeValue,
} from "../../types/class-diagram";
import type { Diagram } from "../../types/diagram";
import type {
  Element,
  ElementStatus,
  ElementTypeValue,
} from "../../types/element";
import type { LayerValue } from "../../types/layer";
import type { Model } from "../../types/model";
import { ScenarioDiagramChildren } from "./scenario-diagram-children";

// ─── Element tree builder ───────────────────────────────────────────────────

type ElementTreeNode = {
  id: string;
  name: string;
  type: ElementTypeValue | string;
  status: ElementStatus;
  description?: string;
  children: ElementTreeNode[];
  /** Present when this is a class diagram element */
  modelId?: string;
};

function buildElementTree(elements: Element[]): ElementTreeNode[] {
  const map = new Map<string, ElementTreeNode>();
  const roots: ElementTreeNode[] = [];

  for (const el of elements) {
    map.set(el.id, {
      id: el.id,
      name: el.name,
      type: el.type,
      status: el.status,
      description: el.description,
      modelId: el.modelId,
      children: [],
    });
  }

  for (const el of elements) {
    const node = map.get(el.id)!;
    if (el.status === "DEPRECATED") continue;
    if (el.parentId && map.has(el.parentId)) {
      const parentNode = map.get(el.parentId)!;
      // In Arcadia/Capella, actors cannot be decomposed or contain child elements.
      if (
        typeof parentNode.type === "string" &&
        parentNode.type.endsWith("Actor")
      ) {
        roots.push(node);
      } else {
        parentNode.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots.sort((a, b) => a.name.localeCompare(b.name));
}

function buildClassElementTree(
  elements: ClassElementData[],
): ElementTreeNode[] {
  const map = new Map<string, ElementTreeNode>();
  const roots: ElementTreeNode[] = [];

  for (const el of elements) {
    map.set(el.id, {
      id: el.id,
      name: el.name,
      type: el.elementType,
      status: el.status,
      modelId: el.modelId,
      children: [],
    });
  }

  for (const el of elements) {
    const node = map.get(el.id)!;
    if (el.status === "DEPRECATED") continue;
    if (el.parentId && map.has(el.parentId)) {
      const parentNode = map.get(el.parentId)!;
      // In Arcadia/Capella, actors cannot be decomposed or contain child elements.
      if (
        typeof parentNode.type === "string" &&
        parentNode.type.endsWith("Actor")
      ) {
        roots.push(node);
      } else {
        parentNode.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots.sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Handlers contract ──────────────────────────────────────────────────────

export type ExplorerHandlers = {
  onOpenDiagram: (model: Model, diagram: Diagram) => void;
  onSelectElement: (elementId: string) => void;
  onNewDiagram: (model: Model) => void;
  onNewElement: (model: Model, type: ElementTypeValue) => void;
  onNewClassElement: (model: Model, type: ClassElementTypeValue) => void;
  onEditDiagram: (model: Model, diagram: Diagram) => void;
  onDeleteElement: (element: ElementTreeNode) => void;
  onDeleteDiagram: (diagram: Diagram) => void;
  onTransition: (model: Model) => void;
  onAddElementToDiagram: (element: ElementTreeNode, diagram: Diagram) => void;
  diagrams?: Diagram[];
};

type ModelDataItem = {
  model: Model;
  elements: Element[];
  diagrams: Diagram[];
  archElements: Element[];
  classElements: ClassElementData[];
  archDiagrams: Diagram[];
  scenarioDiagrams: Diagram[];
  classDiagrams: Diagram[];
};

type ExplorerTreeProps = {
  modelData: ModelDataItem[];
  handlers: ExplorerHandlers;
  existingLayers: Set<LayerValue>;
  /** RBAC: layers the user may create a model in (empty state CTAs). */
  editableLayers: LayerValue[];
  onNewModel: (layer: LayerValue) => void;
};

// ─── Typed folders (Capella-style) ──────────────────────────────────────────

type CategoryFolder = {
  key: string;
  label: string;
  icon: LucideIcon;
  match: (type: ElementTypeValue | string) => boolean;
};

function getCategoryFolders(layer?: LayerValue): CategoryFolder[] {
  return [
    {
      key: "actors",
      label: layer === "OA" ? "Entities & Actors" : "Actors & Entities",
      icon: Users,
      match: (t) => t.endsWith("Actor") || t.endsWith("Entity"),
    },
    {
      key: "functions",
      label: layer === "OA" ? "Activities" : "Functions",
      icon: Activity,
      match: (t) => t.endsWith("Function") || t.endsWith("Activity"),
    },
    {
      key: "components",
      label: "Components & Nodes",
      icon: Boxes,
      match: (t) =>
        t.endsWith("Component") || t === "System" || t === "PhysicalNode",
    },
    {
      key: "capabilities",
      label: "Capabilities",
      icon: Target,
      match: (t) => t.endsWith("Capability"),
    },
    {
      key: "class-elements",
      label: "Class Diagram Elements",
      icon: Box,
      match: (t) =>
        [
          "CLASS",
          "INTERFACE",
          "ENUM",
          "DATA_TYPE",
          "PRIMITIVE",
          "COLLECTION",
          "UNION",
          "PACKAGE",
          "GROUP",
        ].includes(t),
    },
    // catch-all — Mission, OperationalProcess, FunctionPort, …
    { key: "other", label: "Other", icon: Folder, match: () => true },
  ];
}

/** ریشه‌های درخت را به پوشه‌های نوع‌محور (Capella-style) دسته‌بندی می‌کند. */
function categorizeRoots(
  roots: ElementTreeNode[],
  layer?: LayerValue,
): Array<CategoryFolder & { nodes: ElementTreeNode[] }> {
  const folders = getCategoryFolders(layer);
  const buckets = folders.map((f) => ({
    ...f,
    nodes: [] as ElementTreeNode[],
  }));
  for (const node of roots) {
    const bucket =
      buckets.find((b) => b.match(node.type)) ?? buckets[buckets.length - 1];
    bucket.nodes.push(node);
  }
  return buckets.filter((b) => b.nodes.length > 0);
}

function FolderSection({
  folder,
  handlers,
  canEdit,
}: {
  folder: CategoryFolder & { nodes: ElementTreeNode[] };
  handlers: ExplorerHandlers;
  /** RBAC: may the user mutate this model's layer? */
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(true);
  const Icon = folder.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 rounded-sm px-2 py-1 text-[10px] text-muted-foreground text-left transition-colors hover:bg-muted"
        style={{ paddingLeft: "26px" }}
      >
        {open ? (
          <ChevronDown className="size-2.5 shrink-0" />
        ) : (
          <ChevronRight className="size-2.5 shrink-0" />
        )}
        <Icon className="size-3 shrink-0" />
        <span>
          {folder.label} ({folder.nodes.length})
        </span>
      </button>
      {open &&
        folder.nodes.map((node) => (
          <ElementTreeItem
            key={node.id}
            node={node}
            depth={2}
            handlers={handlers}
            canEdit={canEdit}
          />
        ))}
    </div>
  );
}

// ─── Element tree item ──────────────────────────────────────────────────────

function ElementTreeItem({
  node,
  depth,
  handlers,
  canEdit,
}: {
  node: ElementTreeNode;
  depth: number;
  handlers: ExplorerHandlers;
  /** RBAC: may the user mutate this element's model layer? */
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const selectedElementId = useWorkbenchStore((s) => s.selectedElementId);
  const displayName =
    useWorkbenchStore((s) => s.elementNameOverrides[node.id]) ?? node.name;

  const ElementIcon = getElementTypeIcon(node.type);
  const visual = getElementVisual(node.type);
  const isSelected = selectedElementId === node.id;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/explorer-element",
      JSON.stringify({
        elementId: node.id,
        elementType: node.type,
        name: displayName,
        status: node.status,
        description: node.description ?? "",
      }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const row = (
    <button
      type="button"
      draggable={canEdit}
      onDragStart={canEdit ? handleDragStart : undefined}
      onClick={() => {
        handlers.onSelectElement(node.id);
        if (hasChildren) setOpen((v) => !v);
      }}
      className={cn(
        "flex w-full items-center gap-1 rounded-sm px-2 py-1 text-xs text-left transition-colors hover:bg-muted",
        canEdit && "cursor-grab active:cursor-grabbing",
        isSelected && "bg-primary/10 text-primary",
      )}
      style={{ paddingLeft: `${12 + depth * 14}px` }}
    >
      <span className="shrink-0 size-3.5 flex items-center justify-center">
        {hasChildren ? (
          open ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )
        ) : (
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ backgroundColor: visual.strokeColor }}
          />
        )}
      </span>
      <ElementIcon
        className="size-3.5 shrink-0"
        style={{ color: visual.strokeColor }}
      />
      <span className="truncate flex-1 text-left">{displayName}</span>
    </button>
  );

  return (
    <div>
      {/* RBAC: every menu item is a mutation — no menu for read-only users. */}
      {canEdit ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>{displayName}</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Plus className="size-3.5" />
                Add to Diagram
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {getDiagramPlacements(handlers.diagrams ?? [], node.type).map(
                  ({ diagram, allowed }) => (
                    <ContextMenuItem
                      key={diagram.id}
                      disabled={!allowed}
                      onSelect={() =>
                        handlers.onAddElementToDiagram(node, diagram)
                      }
                    >
                      <LayoutDashboard className="size-3.5" />
                      <span className="flex-1">{diagram.name}</span>
                      {!allowed && (
                        <span className="text-[9px] text-muted-foreground">
                          {diagram.type}
                        </span>
                      )}
                    </ContextMenuItem>
                  ),
                )}
                {(!handlers.diagrams || handlers.diagrams.length === 0) && (
                  <ContextMenuItem disabled>
                    <span className="text-muted-foreground">
                      No diagrams in this layer
                    </span>
                  </ContextMenuItem>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => handlers.onDeleteElement(node)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        row
      )}

      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <ElementTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              handlers={handlers}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Diagram tree item ──────────────────────────────────────────────────────

const SCENARIO_DIAGRAM_TYPES = [
  "OIS",
  "OAS",
  "SS",
  "SAS",
  "LS",
  "LAS",
  "PS",
  "PAS",
];

function DiagramTreeItem({
  model,
  diagram,
  handlers,
}: {
  model: Model;
  diagram: Diagram;
  handlers: ExplorerHandlers;
}) {
  const activeDiagramId = useWorkbenchStore((s) => s.activeDiagramId);
  const isActive = activeDiagramId === diagram.id;
  const isScenario = SCENARIO_DIAGRAM_TYPES.includes(diagram.type);
  const [isExpanded, setIsExpanded] = useState(false);

  const projectPermissions = useWorkbenchStore((s) => s.projectPermissions);
  const permissionsResolved = useWorkbenchStore((s) => s.permissionsResolved);
  // RBAC: rename/delete require `edit<layer>`; opening is always allowed.
  const canEdit = isLayerEditable(
    projectPermissions,
    permissionsResolved,
    model.layer,
  );

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            onClick={() => isScenario && setIsExpanded(!isExpanded)}
            onDoubleClick={() => handlers.onOpenDiagram(model, diagram)}
            className={cn(
              "flex w-full items-center gap-1 rounded-sm px-2 py-1 text-xs text-left transition-colors hover:bg-muted",
              isActive && "bg-muted font-medium text-primary",
            )}
            style={{ paddingLeft: "26px" }}
          >
            {isScenario ? (
              <span className="shrink-0 size-3.5 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="size-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3 text-muted-foreground" />
                )}
              </span>
            ) : null}
            <LayoutDashboard className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate flex-1 text-left">{diagram.name}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">
              {diagram.type}
            </span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>{diagram.name}</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={() => handlers.onOpenDiagram(model, diagram)}
          >
            <LayoutDashboard className="size-3.5" />
            Open
          </ContextMenuItem>
          {canEdit && (
            <>
              <ContextMenuItem
                onSelect={() => handlers.onEditDiagram(model, diagram)}
              >
                <Pencil className="size-3.5" />
                Rename / Edit…
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                onSelect={() => handlers.onDeleteDiagram(diagram)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Expandable scenario children */}
      {isScenario && isExpanded && (
        <ScenarioDiagramChildren diagramId={diagram.id} />
      )}
    </div>
  );
}

// ─── Model node ─────────────────────────────────────────────────────────────

function ModelNode({
  data,
  handlers,
}: {
  data: ModelDataItem;
  handlers: ExplorerHandlers;
}) {
  const {
    model,
    archElements,
    classElements,
    archDiagrams,
    scenarioDiagrams,
    classDiagrams,
  } = data;
  const [isOpen, setIsOpen] = useState(true);
  const [openDiagrams, setOpenDiagrams] = useState(true);
  const [openClassDiagrams, setOpenClassDiagrams] = useState(true);
  const [openScenarioDiagrams, setOpenScenarioDiagrams] = useState(true);

  const projectPermissions = useWorkbenchStore((s) => s.projectPermissions);
  const permissionsResolved = useWorkbenchStore((s) => s.permissionsResolved);

  const layerInfo = getLayerInfo(model.layer);
  const color = LAYER_HEX_COLORS[model.layer];
  const archTree = buildElementTree(archElements);
  const classTree = buildClassElementTree(classElements);
  const allRoots = [...archTree, ...classTree];
  const folders = categorizeRoots(allRoots, model.layer);
  const elementTypes = getElementTypesForLayer(model.layer);
  const newElementActions = getNewElementActions(model.layer);
  const nextLayer = getNextOfferedLayer(model.layer);
  const nextLayerLabel = getNextOfferedLayerLabel(model.layer);
  const projectId = useWorkbenchStore((s) => s.projectId);

  // RBAC: creating/editing in this layer needs `edit<layer>`.
  const canEdit = isLayerEditable(
    projectPermissions,
    permissionsResolved,
    model.layer,
  );
  // RBAC: a transition mutates both the source and the target layer.
  const canTransition =
    nextLayer !== null &&
    canEdit &&
    isLayerEditable(projectPermissions, permissionsResolved, nextLayer);

  const row = (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium text-left transition-colors hover:bg-muted"
    >
      <span className="shrink-0 size-4 flex items-center justify-center">
        {isOpen ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
      </span>
      <span
        className="size-2 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="truncate flex-1 text-left">{layerInfo.label}</span>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {model.layer}
      </span>
    </button>
  );

  return (
    <div className="mb-0.5" data-layer={model.layer}>
      {/* RBAC: every menu item mutates — read-only users get the plain row. */}
      {canEdit ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>{layerInfo.label}</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => handlers.onNewDiagram(model)}>
              <FilePlus2 className="size-3.5" />
              New Diagram…
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Plus className="size-3.5" />
                New Element
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {newElementActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <ContextMenuItem
                      key={action.value}
                      onSelect={() => handlers.onNewElement(model, action.value)}
                    >
                      <Icon
                        className="size-3.5 shrink-0"
                        style={{ color: action.strokeColor }}
                      />
                      {action.label}
                    </ContextMenuItem>
                  );
                })}
                {CLASS_ELEMENT_TYPES.map((ct) => (
                  <ContextMenuItem
                    key={ct.value}
                    onSelect={() =>
                      handlers.onNewClassElement(model, ct.value)
                    }
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-sm border"
                      style={{
                        borderColor: ct.color,
                        backgroundColor: `${ct.color}20`,
                      }}
                    />
                    {ct.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            {canTransition && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => handlers.onTransition(model)}>
                  <GitBranchPlus className="size-3.5" />
                  Transition to {nextLayerLabel}…
                </ContextMenuItem>
              </>
            )}
            {projectId && (
              <ContextMenuItem asChild>
                <Link href={`/dashboard/project/${projectId}/traces`}>
                  <GitMerge className="size-3.5" />
                  Traceability Matrix
                </Link>
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        row
      )}

      {isOpen && (
        <div className="ml-2">
          {folders.map((folder) => (
            <FolderSection
              key={folder.key}
              folder={folder}
              handlers={handlers}
              canEdit={canEdit}
            />
          ))}

          {/* Architecture Diagrams */}
          {archDiagrams.length > 0 && (
            <div className="mt-0.5">
              <button
                type="button"
                onClick={() => setOpenDiagrams(!openDiagrams)}
                className="flex w-full items-center gap-1 rounded-sm px-2 py-1 text-[10px] text-muted-foreground text-left transition-colors hover:bg-muted"
                style={{ paddingLeft: "26px" }}
              >
                {openDiagrams ? (
                  <ChevronDown className="size-2.5 shrink-0" />
                ) : (
                  <ChevronRight className="size-2.5 shrink-0" />
                )}
                <LayoutDashboard className="size-3 shrink-0" />
                <span>Diagrams ({archDiagrams.length})</span>
              </button>
              {openDiagrams &&
                archDiagrams.map((diagram) => (
                  <DiagramTreeItem
                    key={diagram.id}
                    model={model}
                    diagram={diagram}
                    handlers={handlers}
                  />
                ))}
            </div>
          )}

          {/* Scenario Diagrams (OIS, SS, LS, PS) */}
          {scenarioDiagrams.length > 0 && (
            <div className="mt-0.5">
              <button
                type="button"
                onClick={() => setOpenScenarioDiagrams(!openScenarioDiagrams)}
                className="flex w-full items-center gap-1 rounded-sm px-2 py-1 text-[10px] text-muted-foreground text-left transition-colors hover:bg-muted"
                style={{ paddingLeft: "26px" }}
              >
                {openScenarioDiagrams ? (
                  <ChevronDown className="size-2.5 shrink-0" />
                ) : (
                  <ChevronRight className="size-2.5 shrink-0" />
                )}
                <Waypoints className="size-3 shrink-0" />
                <span>Scenario Diagrams ({scenarioDiagrams.length})</span>
              </button>
              {openScenarioDiagrams &&
                scenarioDiagrams.map((diagram) => (
                  <DiagramTreeItem
                    key={diagram.id}
                    model={model}
                    diagram={diagram}
                    handlers={handlers}
                  />
                ))}
            </div>
          )}

          {/* Class Diagrams (CDB) */}
          {classDiagrams.length > 0 && (
            <div className="mt-0.5">
              <button
                type="button"
                onClick={() => setOpenClassDiagrams(!openClassDiagrams)}
                className="flex w-full items-center gap-1 rounded-sm px-2 py-1 text-[10px] text-muted-foreground text-left transition-colors hover:bg-muted"
                style={{ paddingLeft: "26px" }}
              >
                {openClassDiagrams ? (
                  <ChevronDown className="size-2.5 shrink-0" />
                ) : (
                  <ChevronRight className="size-2.5 shrink-0" />
                )}
                <Box className="size-3 shrink-0" />
                <span>Class Diagrams ({classDiagrams.length})</span>
              </button>
              {openClassDiagrams &&
                classDiagrams.map((diagram) => (
                  <DiagramTreeItem
                    key={diagram.id}
                    model={model}
                    diagram={diagram}
                    handlers={handlers}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tree root ──────────────────────────────────────────────────────────────

export function ExplorerTree({
  modelData,
  handlers,
  existingLayers,
  editableLayers,
  onNewModel,
}: ExplorerTreeProps) {
  const sorted = [...modelData].sort(
    (a, b) =>
      getLayerInfo(a.model.layer).order - getLayerInfo(b.model.layer).order,
  );

  // RBAC: the empty-state CTAs create models — only editable layers shown.
  const creatableLayers = OFFERED_LAYERS.filter((layer) =>
    editableLayers.includes(layer.value),
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <Layers className="size-8 text-muted-foreground/30" />
        <div className="space-y-1">
          <p className="text-sm font-medium">No models yet</p>
          <p className="text-xs text-muted-foreground">
            {creatableLayers.length > 0
              ? "Create an analysis layer to start adding diagrams and elements."
              : "Your role does not include permission to create models."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-1.5 pt-1">
          {creatableLayers.map((layer) => (
            <button
              key={layer.value}
              type="button"
              disabled={existingLayers.has(layer.value)}
              onClick={() => onNewModel(layer.value)}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted disabled:opacity-50"
            >
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: LAYER_HEX_COLORS[layer.value] }}
              />
              <span className="flex-1">{layer.label}</span>
              <Plus className="size-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-1">
      {sorted.map((data) => (
        <ModelNode key={data.model.id} data={data} handlers={handlers} />
      ))}
    </div>
  );
}

export type { ElementTreeNode };
