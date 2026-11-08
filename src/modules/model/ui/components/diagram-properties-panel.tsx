"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowUp,
  Check,
  CheckCircle2,
  GitMerge,
  Loader2,
  MousePointerClick,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { Badge } from "@/modules/shared/ui/components/ui/badge";
import { Button } from "@/modules/shared/ui/components/ui/button";
import { Input } from "@/modules/shared/ui/components/ui/input";
import { Label } from "@/modules/shared/ui/components/ui/label";
import { Separator } from "@/modules/shared/ui/components/ui/separator";
import { Textarea } from "@/modules/shared/ui/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/modules/shared/ui/components/ui/tooltip";
import { getElementRelationsKey } from "../clients/get-element-relations";
import {
  getTraceLinksByElementIdKey,
  useGetTraceLinksByElementId,
} from "../clients/get-trace-links-by-element-id";
import { useRemoveTraceLink } from "../clients/remove-trace-link";
import { useUpdateElement } from "../clients/update-element";
import { useUpdateRelationship } from "../clients/update-relationship";
import { useUpdateTraceLink } from "../clients/update-trace-link";
import { getElementTypeInfo } from "../helpers/element";
import { getLayerInfo } from "../helpers/layer";
import {
  getEdgeVisual,
  getRelationshipTypeInfo,
} from "../helpers/relationship";
import { getTraceLinkTypeInfo, getTraceVisual } from "../helpers/trace-link";
import {
  type CanvasEdge,
  type CanvasNode,
  type ElementNodeData,
  useCanvasStore,
} from "../stores/canvas";
import {
  isLayerEditable,
  useCanEditActiveLayer,
  useWorkbenchStore,
} from "../stores/workbench";
import type { ElementTypeValue } from "../types/element";
import type { LayerValue } from "../types/layer";
import type { RelationshipTypeValue } from "../types/relationship";
import { CreateTraceLinkDialog } from "./create-trace-link-dialog";
import { ElementShape } from "./element-shape";

type DiagramPropertiesPanelProps = {
  projectId: string;
};

export function DiagramPropertiesPanel({
  projectId,
}: DiagramPropertiesPanelProps) {
  const setPanel = useWorkbenchStore((s) => s.setPanel);

  const node = useCanvasStore(
    useShallow((state) =>
      state.nodes.find((node) => node.id === state.selectedNodeId),
    ),
  );

  const edge = useCanvasStore(
    useShallow((state) =>
      state.edges.find((edge) => edge.id === state.selectedEdgeId),
    ),
  );

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-card">
      <div className="sticky top-0 z-10 flex h-8 shrink-0 items-center justify-between border-b bg-muted/30 px-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Properties
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          onClick={() => setPanel("properties", false)}
          aria-label="Close Properties"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {node && (
          <>
            <NodeProperties projectId={projectId} node={node} />
            <TraceLinksList elementId={node?.data.elementId} />
          </>
        )}
        {edge && <EdgeProperties edge={edge} />}

        {!node && !edge && (
          <div className="flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
            <MousePointerClick className="size-8 opacity-30" />
            <p className="text-xs leading-relaxed max-w-45">
              Select an element or relationship on the canvas
              <br />
              to view its details
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

type NodeProperties = {
  projectId: string;
  node: CanvasNode;
};

const ELEMENT_STATUS_LABELS = {
  DRAFT: "Draft",
  VALIDATED: "Validated",
  DEPRECATED: "Deprecated",
} as const;

const ELEMENT_STATUS_VARIANTS = {
  DRAFT: "secondary",
  VALIDATED: "default",
  DEPRECATED: "destructive",
} as const;

function NodeProperties({ projectId, node }: NodeProperties) {
  const [name, setName] = useState(node?.data.name);
  const [traceDialogOpen, setTraceDialogOpen] = useState(false);
  const [description, setDescription] = useState(node?.data.description);

  const queryClient = useQueryClient();
  const updateElement = useUpdateElement();
  const canEdit = useCanEditActiveLayer();

  const elementType = useMemo(
    () => getElementTypeInfo(node.data.elementType),
    [node.data.elementType],
  );

  useEffect(() => {
    setName(node.data.name);
    setDescription(node.data.description);
  }, [node.data]);

  const updateNodeData = useCanvasStore((state) => state.updateNodeData);

  const updateElementStatus = useCallback(
    (status: ElementNodeData["status"]) => {
      updateElement.mutate(
        {
          name: node.data.name,
          id: node.data.elementId,
          properties: { status },
        },
        {
          onError({ message }) {
            toast.error(message || "Error updating element status");
          },
        },
      );
    },
    [node.data, updateElement],
  );

  const handleSave = useCallback(() => {
    updateElement.mutate(
      {
        name,
        description,
        id: node.data.elementId,
      },
      {
        onSuccess: ({ data }) => {
          updateNodeData(data.id, {
            ...node.data,
            name: data.name,
            description: data.description,
          });
          useWorkbenchStore.getState().setElementName(data.id, data.name);
          // Keep the Semantic Browser and Workbench in sync with the edited element.
          queryClient.invalidateQueries({
            queryKey: getElementRelationsKey(data.id),
          });
          queryClient.invalidateQueries({
            queryKey: ["workbench-data"],
          });
        },
        onError: ({ message }) => {
          toast.error(message || "Error saving changes");
        },
      },
    );
  }, [
    updateElement,
    name,
    description,
    updateNodeData,
    node.data,
    queryClient,
  ]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <ElementShape label={elementType.label} type={elementType.value} />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Badge
            className="text-xs px-1.5 py-0"
            variant={ELEMENT_STATUS_VARIANTS[node.data.status]}
          >
            {ELEMENT_STATUS_LABELS[node.data.status]}
          </Badge>
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" htmlFor="name">
            Name
          </Label>
          {canEdit ? (
            <Input
              value={name}
              onBlur={handleSave}
              className="h-8 text-sm"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{node.data.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description" className="text-xs">
            Description
          </Label>
          {canEdit ? (
            <Textarea
              rows={3}
              value={description}
              onBlur={handleSave}
              placeholder="Element description..."
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {node.data.description || "—"}
            </p>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Quick Actions</p>
          <div className="flex flex-col gap-1">
            {canEdit && node.data.status !== "VALIDATED" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={updateElement.isPending}
                className="justify-start gap-2 h-7 text-xs"
                onClick={() => updateElementStatus("VALIDATED")}
              >
                {updateElement.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                )}
                Validate
              </Button>
            )}
            {canEdit && node.data.status !== "DRAFT" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={updateElement.isPending}
                className="justify-start gap-2 h-7 text-xs"
                onClick={() => updateElementStatus("DRAFT")}
              >
                <RotateCcw className="size-3.5 text-muted-foreground" />
                Revert to Draft
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="justify-start gap-2 h-7 text-xs"
                onClick={() => setTraceDialogOpen(true)}
              >
                <GitMerge className="size-3.5 text-primary" />
                Add Trace Link
              </Button>
            )}
            {canEdit && node.data.status !== "DEPRECATED" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={updateElement.isPending}
                onClick={() => updateElementStatus("DEPRECATED")}
                className="justify-start gap-2 h-7 text-xs text-destructive hover:text-destructive"
              >
                <Archive className="size-3.5" />
                Deprecate
              </Button>
            )}
          </div>
        </div>

        <Separator />
      </div>
      <CreateTraceLinkDialog
        open={traceDialogOpen}
        onOpenChange={setTraceDialogOpen}
        projectId={projectId}
        sourceElementId={node.data.elementId}
        sourceElementType={node.data.elementType as ElementTypeValue}
        sourceLayerType={getElementTypeInfo(node.data.elementType).layer}
      />
    </>
  );
}

function Loading() {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground transition-opacity duration-200 opacity-100">
      <Loader2 className="size-3 animate-spin" />
      Saving...
    </span>
  );
}

type EdgePropertiesProps = {
  edge: CanvasEdge;
};

export function EdgeProperties({ edge }: EdgePropertiesProps) {
  const [name, setName] = useState(edge?.data?.name ?? "");
  const [description, setDescription] = useState(edge?.data?.description ?? "");

  const selectNode = useCanvasStore((state) => state.selectNode);

  const updateRelationship = useUpdateRelationship();
  const canEdit = useCanEditActiveLayer();

  const updateEdgeData = useCanvasStore((state) => state.updateEdgeData);

  const sourceNode = useCanvasStore((state) =>
    state.nodes.find((n) => n.id === edge.source),
  );

  const targetNode = useCanvasStore((state) =>
    state.nodes.find((n) => n.id === edge.target),
  );

  useEffect(() => {
    if (edge) {
      setName(edge?.data?.name ?? "");
      setDescription(edge?.data?.description ?? "");
    }
  }, [edge]);

  const handleSave = useCallback(() => {
    if (!edge || !edge?.data) return;

    updateRelationship.mutate(
      {
        modelId: edge.data.modelId,
        id: edge.id,
        name: name?.trim() || undefined,
        description: description?.trim() || undefined,
      },
      {
        onSuccess: () => {
          updateEdgeData(edge.id, {
            name,
            description,
          });
        },
        onError: ({ message }) => {
          toast.error(message || "Error saving relationship");
        },
      },
    );
  }, [edge, name, description, updateRelationship, updateEdgeData]);

  const spec = getEdgeVisual(
    edge.data?.relationshipType as RelationshipTypeValue,
  );

  const relInfo = getRelationshipTypeInfo(
    edge.data?.relationshipType as RelationshipTypeValue,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1.5 text-xs">
        {sourceNode ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"link"}
                onClick={() => selectNode(sourceNode.id)}
              >
                {sourceNode.data.name}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Source element</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">Unknown source</span>
        )}

        <ArrowUp className="h-3 w-3 shrink-0 text-muted-foreground" />

        <Badge
          variant="outline"
          className="px-1.5 py-0 text-[10px] gap-1 shrink-0"
        >
          <span
            className="h-1.5 w-3 rounded-full"
            style={{ backgroundColor: spec.strokeColor }}
          />
          {relInfo.label}
        </Badge>

        <ArrowUp className="h-3 w-3 shrink-0 text-muted-foreground" />

        {targetNode ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"link"}
                onClick={() => selectNode(targetNode.id)}
              >
                {targetNode.data.name}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Target element</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">Unknown target</span>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs" htmlFor="edge-name">
          Name
        </Label>
        {canEdit ? (
          <Input
            id="edge-name"
            value={name}
            onBlur={handleSave}
            className="h-8 text-sm flex-1"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        ) : (
          <p id="edge-name" className="text-sm text-muted-foreground">
            {edge.data?.name || "—"}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs" htmlFor="edge-desc">
          Description
        </Label>
        {canEdit ? (
          <Textarea
            rows={3}
            id="edge-desc"
            value={description}
            onBlur={handleSave}
            className="text-sm flex-1"
            onChange={(e) => setDescription(e.target.value)}
          />
        ) : (
          <p id="edge-desc" className="text-sm text-muted-foreground">
            {edge.data?.description || "—"}
          </p>
        )}
      </div>
      {updateRelationship.isPending && <Loading />}
    </div>
  );
}

export type TraceLinksListProps = {
  elementId: string;
};

type TraceLinkRowData = {
  id: string;
  type: string;
  sourceElementId: string;
  targetElementId: string;
  sourceLayer: LayerValue;
  targetLayer: LayerValue;
  description?: string;
};

type TraceLinkRowProps = {
  trace: TraceLinkRowData;
  elementId: string;
  canUpdate: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: (payload: {
    id: string;
    sourceElementId: string;
    targetElementId: string;
  }) => void;
};

function TraceLinkRow({
  trace,
  elementId,
  canUpdate,
  canDelete,
  isDeleting,
  onDelete,
}: TraceLinkRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(trace.description ?? "");
  const queryClient = useQueryClient();
  const updateTraceLink = useUpdateTraceLink();

  const isSource = trace.sourceElementId === elementId;
  const traceSpec = getTraceVisual(trace.type);
  const traceInfo = getTraceLinkTypeInfo(trace.type);
  const otherLayer = getLayerInfo(
    isSource ? trace.targetLayer : trace.sourceLayer,
  );

  const invalidateTraceQueries = () => {
    queryClient.invalidateQueries({
      queryKey: getTraceLinksByElementIdKey(trace.sourceElementId),
    });
    queryClient.invalidateQueries({
      queryKey: getTraceLinksByElementIdKey(trace.targetElementId),
    });
  };

  const handleSave = () => {
    updateTraceLink.mutate(
      { id: trace.id, description: draft.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          invalidateTraceQueries();
        },
        onError: ({ message }) => {
          toast.error(message || "Error updating trace link");
        },
      },
    );
  };

  return (
    <div className="rounded-md border border-border bg-muted/40 px-2 py-1.5">
      <div className="flex items-start gap-1.5">
        <span
          className="mt-0.5 size-2 shrink-0 rounded-full"
          style={{ backgroundColor: traceSpec.strokeColor }}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium">{traceInfo.label}</p>
          <p className="text-[10px] text-muted-foreground">
            {isSource ? "Traces to" : "Traced by"} {otherLayer.label}
          </p>
          {!editing && trace.description && (
            <p className="text-[10px] text-muted-foreground">
              {trace.description}
            </p>
          )}
        </div>

        {!editing && (canUpdate || canDelete) && (
          <div className="flex shrink-0 items-center gap-0.5">
            {canUpdate && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setDraft(trace.description ?? "");
                  setEditing(true);
                }}
                className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Edit trace note"
              >
                <Pencil className="size-3" />
              </Button>
            )}
            {canDelete && (
              <Button
                size="icon"
                variant="ghost"
                loading={isDeleting}
                onClick={() =>
                  onDelete({
                    id: trace.id,
                    sourceElementId: trace.sourceElementId,
                    targetElementId: trace.targetElementId,
                  })
                }
                className="size-5 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete trace link"
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-1.5 space-y-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Trace note (optional)"
            className="resize-none text-xs"
          />
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => setEditing(false)}
              disabled={updateTraceLink.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-6 px-2 text-xs"
              loading={updateTraceLink.isPending}
              onClick={handleSave}
            >
              <Check className="size-3" />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const TraceLinksList = ({ elementId }: TraceLinksListProps) => {
  const { data: traceLinks, isLoading: isGetTraceLinksLoading } =
    useGetTraceLinksByElementId(elementId);

  const queryClient = useQueryClient();

  const removeTraceLink = useRemoveTraceLink();

  // RBAC: a trace link spans two layers - editing its note, or deleting the
  // link itself, needs edit rights on both the source and the target layer.
  const projectPermissions = useWorkbenchStore((s) => s.projectPermissions);
  const permissionsResolved = useWorkbenchStore((s) => s.permissionsResolved);

  const canEditTrace = useCallback(
    (trace: TraceLinkRowData) =>
      isLayerEditable(
        projectPermissions,
        permissionsResolved,
        trace.sourceLayer,
      ) &&
      isLayerEditable(
        projectPermissions,
        permissionsResolved,
        trace.targetLayer,
      ),
    [projectPermissions, permissionsResolved],
  );

  const handleDelete = useCallback(
    (payload: {
      id: string;
      sourceElementId: string;
      targetElementId: string;
    }) => {
      removeTraceLink.mutate(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getTraceLinksByElementIdKey(payload.sourceElementId),
          });

          queryClient.invalidateQueries({
            queryKey: getTraceLinksByElementIdKey(payload.targetElementId),
          });
        },
        onError: ({ message }) => {
          toast.error(message || "Error deleting trace link");
        },
      });
    },
    [removeTraceLink, queryClient],
  );

  if (isGetTraceLinksLoading) {
    return (
      <div className="flex justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Trace Links</p>

      {!traceLinks?.length ? (
        <p className="text-xs text-muted-foreground">
          No traces yet. Add a trace link to connect this element across layers.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {traceLinks.map((trace) => (
            <TraceLinkRow
              key={trace.id}
              trace={trace}
              elementId={elementId}
              canUpdate={canEditTrace(trace)}
              canDelete={canEditTrace(trace)}
              isDeleting={removeTraceLink.isPending}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
