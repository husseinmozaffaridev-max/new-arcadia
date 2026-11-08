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
import {
  useCanEditActiveLayer,
  useWorkbenchStore,
} from "../../stores/workbench";

type ComponentNodeType = Node<ElementNodeData>;

/**
 * ComponentNode — سبک Capella/UML
 * مستطیل اصلی با دو مستطیل کوچک هم‌پوشان روی ضلع چپ (نماد component).
 */
function ComponentNodeComponent({
  data,
  selected,
}: NodeProps<ComponentNodeType>) {
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
      className={cn(
        "relative flex min-h-14 min-w-40 items-center justify-center border-2 px-5 py-2.5 text-center select-none",
        selected && "shadow-[0_0_0_2px_hsl(var(--primary))]",
        data.status === "DEPRECATED" && "opacity-60",
      )}
      style={{
        backgroundColor: spec.fillColor,
        borderColor: spec.strokeColor,
        color: spec.strokeColor,
      }}
    >
      <span className="absolute -top-4 right-0 left-0 truncate px-1 text-center text-[9px] text-muted-foreground">
        {typeInfo.label}
      </span>

      {/* دو مستطیل هم‌پوشان نماد مؤلفه */}
      <div className="absolute -left-1.5 top-2.5 flex flex-col gap-1">
        <span
          className="h-2 w-3 border bg-background"
          style={{ borderColor: spec.strokeColor }}
        />
        <span
          className="h-2 w-3 border bg-background"
          style={{ borderColor: spec.strokeColor }}
        />
      </div>

      <div
        className={cn(
          "ps-2 text-[11px] font-medium leading-tight wrap-break-word",
          canEdit && "cursor-grab active:cursor-grabbing",
        )}
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
          <span className="line-clamp-2 wrap-break-word">{data.name}</span>
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

export const ComponentNode = memo(ComponentNodeComponent);
