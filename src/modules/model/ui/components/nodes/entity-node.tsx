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

type EntityNodeType = Node<ElementNodeData>;

/**
 * EntityNode — سبک دقیق Capella
 * نماد اختصاصی Operational Entity در کاپلا:
 * مستطیل مؤلفه با دو زبانه بیرون‌زده در سمت چپ، حروف «OE» در مرکز و برچسب نام در پایین.
 */
function EntityNodeComponent({ data, selected }: NodeProps<EntityNodeType>) {
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
        "relative flex min-w-32 flex-col items-center gap-1.5 rounded-md border-2 bg-background px-3 py-2.5 select-none",
        selected && "shadow-[0_0_0_2px_hsl(var(--primary))]",
        data.status === "DEPRECATED" && "opacity-60",
      )}
      style={{ borderColor: spec.strokeColor }}
    >
      <span className="absolute -top-4 right-0 left-0 truncate px-1 text-center text-[9px] text-muted-foreground">
        {typeInfo.label}
      </span>

      {/* نماد دقیق Operational Entity در Capella */}
      <svg
        width="34"
        height="28"
        viewBox="0 0 34 28"
        aria-hidden="true"
        role="presentation"
        className="shrink-0"
        style={{ color: spec.strokeColor }}
      >
        {/* بدنه مستطیل اصلی */}
        <rect
          x="6"
          y="2"
          width="26"
          height="24"
          rx="1"
          fill={spec.fillColor}
          stroke="currentColor"
          strokeWidth="1.6"
        />
        {/* زبانه بالایی سمت چپ */}
        <rect
          x="2"
          y="5.5"
          width="6.5"
          height="5"
          rx="0.5"
          fill={spec.fillColor}
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* زبانه پایینی سمت چپ */}
        <rect
          x="2"
          y="15.5"
          width="6.5"
          height="5"
          rx="0.5"
          fill={spec.fillColor}
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* حروف OE نمادین Capella در مرکز */}
        <text
          x="19"
          y="18"
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="currentColor"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5"
        >
          OE
        </text>
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
        minWidth={110}
        minHeight={65}
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

export const EntityNode = memo(EntityNodeComponent);
