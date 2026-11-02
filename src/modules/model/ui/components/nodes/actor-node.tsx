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
import { useUpdateElement } from "../../clients/update-element";
import { getElementTypeInfo, getElementVisual } from "../../helpers/element";
import type { ElementNodeData } from "../../stores/canvas";
import { useCanvasStore } from "../../stores/canvas";
import { useCanEditActiveLayer, useWorkbenchStore } from "../../stores/workbench";

type ActorNodeType = Node<ElementNodeData>;

/**
 * ActorNode — سبک Capella
 * فیگور انسانی (دایره سر + بدن) در بالا و برچسب نام در پایین.
 */
function ActorNodeComponent({ data, selected }: NodeProps<ActorNodeType>) {
  const typeInfo = getElementTypeInfo(data.elementType);
  const spec = getElementVisual(data.elementType);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(data.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const updateElement = useUpdateElement();
  const canEdit = useCanEditActiveLayer();

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
            useWorkbenchStore.getState().setElementName(data.elementId, trimmed);
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
      className={cn(
        "relative flex min-w-28 flex-col items-center gap-1 rounded-md border-2 bg-background px-3 py-2 select-none",
        selected && "shadow-[0_0_0_2px_hsl(var(--primary))]",
        data.status === "DEPRECATED" && "opacity-60",
      )}
      style={{ borderColor: spec.strokeColor }}
    >
      <span className="absolute -top-4 right-0 left-0 truncate px-1 text-center text-[9px] text-muted-foreground">
        {typeInfo.label}
      </span>

      {/* فیگور انسانی ساده */}
      <svg
        width="22"
        height="26"
        viewBox="0 0 22 26"
        aria-hidden="true"
        role="presentation"
        style={{ color: spec.strokeColor }}
      >
        <circle
          cx="11"
          cy="5"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <line
          x1="11"
          y1="9"
          x2="11"
          y2="17"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <line
          x1="4"
          y1="12"
          x2="18"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <line
          x1="11"
          y1="17"
          x2="5"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <line
          x1="11"
          y1="17"
          x2="17"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>

      <div
        className={cn(
          "line-clamp-2 text-center text-[11px] font-medium leading-tight",
          canEdit && "cursor-grab active:cursor-grabbing",
        )}
        style={{ color: spec.strokeColor }}
        draggable={canEdit}
        onDragStart={canEdit ? handleDragStart : undefined}
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
        minWidth={100}
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
        minWidth={100}
        minHeight={60}
        lineClassName="border-primary/50"
        handleClassName="bg-primary"
      />

      <Handle
        type="target"
        position={Position.Left}
        className="size-2! border! border-current! bg-background!"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="size-2! border! border-current! bg-background!"
      />
    </div>
  );
}

export const ActorNode = memo(ActorNodeComponent);
