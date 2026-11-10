"use client";

import { useLocale } from "next-intl";
import { Button } from "@/modules/shared/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shared/ui/components/ui/dialog";

type HierarchyConnectionDialogProps = {
  childName: string;
  parentName: string;
  open: boolean;
  saving: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function HierarchyConnectionDialog({
  childName,
  parentName,
  open,
  saving,
  onConfirm,
  onOpenChange,
}: HierarchyConnectionDialogProps) {
  const isFa = useLocale() === "fa";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isFa ? "افزودن زیرمجموعه" : "Add to breakdown"}
          </DialogTitle>
          <DialogDescription>
            {isFa
              ? `«${childName}» زیرمجموعهٔ «${parentName}» شود؟ این اتصال ساختار مدل را تغییر می‌دهد.`
              : `Make "${childName}" a child of "${parentName}"? This changes the model hierarchy.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {isFa ? "انصراف" : "Cancel"}
          </Button>
          <Button onClick={onConfirm} disabled={saving}>
            {isFa ? "افزودن" : "Add child"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
