"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/modules/shared/ui/components/ui/input";
import { Label } from "@/modules/shared/ui/components/ui/label";
import { Textarea } from "@/modules/shared/ui/components/ui/textarea";
import { cn } from "@/modules/shared/ui/libs/cn";
import {
  getEdgeVisual,
  getRelationshipTypeInfo,
} from "../helpers/relationship";
import type { RelationshipTypeValue } from "../types/relationship";

interface ConnectionDialogProps {
  open: boolean;
  allowedTypes: RelationshipTypeValue[];
  onConfirm: (
    type: RelationshipTypeValue,
    name: string,
    description: string,
  ) => void;
  onOpenChange: (value: boolean) => void;
}

export function ConnectionDialog({
  open,
  allowedTypes,
  onConfirm,
  onOpenChange,
}: ConnectionDialogProps) {
  const locale = useLocale();
  const isFa = locale === "fa";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [selectedType, setSelectedType] =
    useState<RelationshipTypeValue | null>(allowedTypes[0] ?? null);

  useEffect(() => {
    if (open && allowedTypes.length > 0) {
      setSelectedType(allowedTypes[0]);
    }
  }, [open, allowedTypes]);

  function handleConfirm() {
    if (!selectedType) return;
    onConfirm(selectedType, name, description);
    setName("");
    setDescription("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isFa ? "انتخاب نوع رابطه" : "Select Relationship Type"}
          </DialogTitle>
          <DialogDescription>
            {isFa
              ? "کدام نوع رابطه این دو عنصر را به یکدیگر متصل می‌کند؟"
              : "What type of relationship connects these two elements?"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            {allowedTypes.map((typeValue) => {
              const spec = getEdgeVisual(typeValue);
              const isSelected = selectedType === typeValue;
              const relationshipInfo = getRelationshipTypeInfo(typeValue);
              return (
                <button
                  type="button"
                  key={typeValue}
                  onClick={() => setSelectedType(typeValue)}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors",
                    isFa ? "text-right flex-row-reverse" : "text-left",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-accent",
                  )}
                >
                  <span
                    className="h-1 w-6 rounded-full shrink-0"
                    style={{ backgroundColor: spec.strokeColor }}
                  />
                  <span
                    className={cn(
                      "flex-1",
                      isFa ? "text-right" : "text-left",
                    )}
                  >
                    {isFa ? relationshipInfo.labelFa : relationshipInfo.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rel-name">
              {isFa ? "نام رابطه (اختیاری)" : "Relationship Name (optional)"}
            </Label>
            <Input
              id="rel-name"
              placeholder={isFa ? "مثلاً requestData" : "e.g. requestData"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rel-description">
              {isFa ? "توضیحات (اختیاری)" : "Description (optional)"}
            </Label>
            <Textarea
              id="rel-description"
              value={description}
              placeholder={
                isFa
                  ? "مثلاً مدیریت درخواست‌های داده ورودی"
                  : "e.g. Handles incoming data requests"
              }
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isFa ? "انصراف" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedType}>
            {isFa ? "ایجاد رابطه" : "Create Relationship"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
