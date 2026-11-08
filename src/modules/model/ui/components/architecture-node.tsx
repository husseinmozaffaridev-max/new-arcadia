import {
  Handle,
  type Node,
  type NodeProps,
  NodeResizer,
  Position,
} from "@xyflow/react";
import {
  type DragEventHandler,
  memo,
  useCallback,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { cn } from "@/modules/shared/ui/libs/cn";
import { useUpdateElement } from "../clients/update-element";
import { getElementTypeInfo, getElementVisual } from "../helpers/element";
import type { ElementNodeData } from "../stores/canvas";
import { useCanvasStore } from "../stores/canvas";
import { useCanEditActiveLayer, useWorkbenchStore } from "../stores/workbench";

const STATUS_RING: Record<string, string> = {
  DRAFT: "ring-1 ring-gray-400/50",
  VALIDATED: "ring-2 ring-green-500/70",
  DEPRECATED: "ring-2 ring-red-400/70 opacity-60",
};

type ArchitectureNodeData = Node<ElementNodeData>;

function ArchitectureNodeComponent({
  data,
  selected,
}: NodeProps<ArchitectureNodeData>) {
  const canEdit = useCanEditActiveLayer();
  const elementType = getElementTypeInfo(data.elementType);
  const spec = getElementVisual(elementType.value);

  const isEllipse = spec.shape === "ellipse";
  const isRounded = spec.shape === "rounded-rectangle";

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(data.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const updateElement = useUpdateElement();

  const handleDoubleClickName = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditName(data.name);
      setIsEditingName(true);
      setTimeout(() => inputRef.current?.select(), 10);
    },
    [data.name],
  );

  const handleSaveName = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== data.name) {
      updateElement.mutate(
        { id: data.elementId, name: trimmed },
        {
          onSuccess: () => {
            updateNodeData(data.elementId, { ...data, name: trimmed });
            useWorkbenchStore
              .getState()
              .setElementName(data.elementId, trimmed);
          },
          onError: ({ message }) =>
            toast.error(message || "Failed to rename element"),
        },
      );
    }
    setIsEditingName(false);
  }, [editName, data, updateNodeData, updateElement]);

  const handleDragStart: DragEventHandler = useCallback(
    (e) => {
      e.dataTransfer.setData(
        "application/canvas-node",
        JSON.stringify({
          elementId: data.elementId,
          elementType: data.elementType,
          name: data.name,
        }),
      );
      e.dataTransfer.effectAllowed = "copy";
    },
    [data],
  );

  return (
    <div
      draggable={canEdit}
      onDragStart={canEdit ? handleDragStart : undefined}
      className={cn(
        "relative flex items-center justify-center min-w-35 min-h-13 px-3 py-2",
        "border-2 text-[11px] font-medium leading-tight text-center select-none",
        "transition-shadow duration-150",
        canEdit && "cursor-grab active:cursor-grabbing",
        isEllipse ? "rounded-full" : isRounded ? "rounded-xl" : "rounded-sm",
        selected && "shadow-[0_0_0_2px_hsl(var(--primary))]",
        STATUS_RING[data.status] ?? "",
      )}
      style={{
        backgroundColor: spec.fillColor,
        borderColor: spec.strokeColor,
        color: spec.strokeColor,
      }}
    >
      {data.status === "VALIDATED" && (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
      )}
      {data.status === "DEPRECATED" && (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-400 border-2 border-background" />
      )}

      <span className="absolute -top-4 right-0 left-0 text-center text-[9px] text-muted-foreground truncate px-1">
        {elementType.label}
      </span>

      <div
        className={cn("line-clamp-2 wrap-break-word", canEdit && "cursor-text")}
        onDoubleClick={canEdit ? handleDoubleClickName : undefined}
      >
        {isEditingName ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName();
              if (e.key === "Escape") setIsEditingName(false);
            }}
            className="w-full bg-transparent text-center text-[11px] font-medium outline-none border-b border-current"
            style={{ color: spec.strokeColor }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span>{data.name}</span>
        )}
      </div>

      {/* ── NodeResizer (only visible when selected) ── */}
      <NodeResizer
        isVisible={canEdit && selected}
        minWidth={140}
        minHeight={60}
        lineClassName="border-primary/50"
        handleClassName="bg-primary"
      />

      <Handle
        type="target"
        position={Position.Top}
        className="size-2! border! border-current! bg-background!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="size-2! border! border-current! bg-background!"
      />
      {/* ── NodeResizer (only visible when selected) ── */}
      <NodeResizer
        isVisible={canEdit && selected}
        minWidth={140}
        minHeight={60}
        lineClassName="border-primary/50"
        handleClassName="bg-primary"
      />

      <Handle
        type="target"
        position={Position.Right}
        className="size-2! border! border-current! bg-background!"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="size-2! border! border-current! bg-background!"
      />
    </div>
  );
}

export const ArchitectureNode = memo(ArchitectureNodeComponent);
