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

type FunctionNodeType = Node<ElementNodeData>;

/**
 * FunctionNode — سبک Capella
 * مستطیل گردگوشه با نوار عنوان رنگی و پورت‌های ورودی/خروجی روی اضلاع
 * (برای نمایش dataflow).
 */
function FunctionNodeComponent({
  data,
  selected,
}: NodeProps<FunctionNodeType>) {
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
        "relative min-w-36 overflow-hidden rounded-lg border-2 bg-background select-none",
        selected && "shadow-[0_0_0_2px_hsl(var(--primary))]",
        data.status === "DEPRECATED" && "opacity-60",
      )}
      style={{ borderColor: spec.strokeColor }}
    >
      {/* نوار عنوان رنگی */}
      <div
        className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-white/95"
        style={{ backgroundColor: spec.strokeColor }}
      >
        {typeInfo.label}
      </div>

      <div
        className={cn(
          "px-3 py-2.5 text-center text-[11px] font-medium leading-tight",
          canEdit && "cursor-grab active:cursor-grabbing",
        )}
        style={{ backgroundColor: spec.fillColor, color: spec.strokeColor }}
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

      {/* پورت‌های ورودی (چپ) و خروجی (راست) */}
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        className="size-2.5! rounded-none! border! border-current! bg-background!"
        style={{ top: "60%" }}
      />
      <Handle
        id="out"
        type="source"
        position={Position.Right}
        className="size-2.5! rounded-none! border! border-current! bg-background!"
        style={{ top: "60%" }}
      />
      {/* ── NodeResizer (only visible when selected) ── */}
      <NodeResizer
        isVisible={canEdit && selected}
        minWidth={120}
        minHeight={50}
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
    </div>
  );
}

export const FunctionNode = memo(FunctionNodeComponent);
