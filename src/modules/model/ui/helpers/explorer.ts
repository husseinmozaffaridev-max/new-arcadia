import {
  Activity,
  Box,
  Boxes,
  Folder,
  type LucideIcon,
  Target,
  Users,
} from "lucide-react";
import type { ElementTypeValue } from "../types/element";
import type { LayerValue } from "../types/layer";

export type CategoryFolder = {
  key: string;
  label: string;
  icon: LucideIcon;
  match: (type: ElementTypeValue | string) => boolean;
};

/**
 * Returns typed category folders for the Explorer Tree according to Arcadia MBSE principles:
 * - OA (Operational Analysis): Entities & Actors, Activities, Capabilities. (NO Components!)
 * - SA (System Analysis): System & Actors, Functions, Capabilities. (NO Components!)
 * - LA (Logical Architecture): Actors, Functions, Components, Capabilities.
 * - PA (Physical Architecture): Actors, Functions, Components & Nodes, Capabilities.
 */
export function getCategoryFolders(layer?: LayerValue): CategoryFolder[] {
  const folders: CategoryFolder[] = [
    {
      key: "actors",
      label:
        layer === "OA"
          ? "Entities & Actors"
          : layer === "SA"
            ? "System & Actors"
            : "Actors",
      icon: Users,
      match: (t) =>
        t.endsWith("Actor") ||
        t.endsWith("Entity") ||
        (layer === "SA" && t === "System"),
    },
    {
      key: "functions",
      label: layer === "OA" ? "Activities" : "Functions",
      icon: Activity,
      match: (t) => t.endsWith("Function") || t.endsWith("Activity"),
    },
  ];

  // In OA (Layer 1) and SA (Layer 2), components DO NOT exist in Arcadia/Capella.
  // Internal decomposition into components only starts at Logical Architecture (LA).
  if (layer === "LA") {
    folders.push({
      key: "components",
      label: "Components",
      icon: Boxes,
      match: (t) => t.endsWith("Component"),
    });
  } else if (layer === "PA") {
    folders.push({
      key: "components",
      label: "Components & Nodes",
      icon: Boxes,
      match: (t) => t.endsWith("Component") || t === "PhysicalNode",
    });
  } else if (!layer) {
    folders.push({
      key: "components",
      label: "Components & Nodes",
      icon: Boxes,
      match: (t) =>
        t.endsWith("Component") || t === "System" || t === "PhysicalNode",
    });
  }

  folders.push(
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
  );

  return folders;
}
