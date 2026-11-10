import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Activity,
  Box,
  Boxes,
  Folder,
  FunctionSquare,
  HardDrive,
  LayoutDashboard,
  Link,
  Monitor,
  Package,
  Plug,
  Target,
  User,
  Workflow,
} from "lucide-react";
import React, { forwardRef } from "react";
import type { ClassElementTypeValue } from "../types/class-diagram";
import type { ElementTypeValue } from "../types/element";

/**
 * نماد اختصاصی Operational Entity مشابه Capella (جعبه کامپوننت با دو زبانه و حروف OE)
 */
export const OperationalEntityIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 16, className, style, ...props }, ref) =>
    React.createElement(
      "svg",
      {
        ref,
        width: size,
        height: size,
        viewBox: "0 0 16 16",
        fill: "none",
        stroke: "currentColor",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
        style,
        "aria-hidden": true,
        ...props,
      },
      React.createElement("rect", {
        x: 3.5,
        y: 1.5,
        width: 11,
        height: 13,
        rx: 1,
        strokeWidth: 1.2,
        fill: "currentColor",
        fillOpacity: 0.15,
      }),
      React.createElement("rect", {
        x: 1,
        y: 3.5,
        width: 4,
        height: 2.5,
        rx: 0.5,
        strokeWidth: 1,
        fill: "currentColor",
        fillOpacity: 0.25,
      }),
      React.createElement("rect", {
        x: 1,
        y: 8.5,
        width: 4,
        height: 2.5,
        rx: 0.5,
        strokeWidth: 1,
        fill: "currentColor",
        fillOpacity: 0.25,
      }),
      React.createElement(
        "text",
        {
          x: 9,
          y: 9.8,
          textAnchor: "middle",
          fontSize: 5,
          fontWeight: "bold",
          fill: "currentColor",
          stroke: "none",
          letterSpacing: "-0.3",
          fontFamily: "system-ui, sans-serif",
        },
        "OE",
      ),
    ),
);
OperationalEntityIcon.displayName = "OperationalEntityIcon";

/**
 * Icon for every element type the domain knows about.
 * Keyed by the domain `ElementTypeValue`, so TypeScript rejects a missing entry.
 */
const DOMAIN_ICONS: Record<ElementTypeValue, LucideIcon> = {
  // ── OA ──
  Mission: Monitor,
  OperationalEntity: OperationalEntityIcon as unknown as LucideIcon,
  OperationalActor: User,
  OperationalActivity: Activity,
  OperationalCapability: Target,
  OperationalProcess: Workflow,

  // ── SA ──
  System: Monitor,
  SystemActor: User,
  SystemMission: Monitor,
  SystemFunction: FunctionSquare,
  SystemCapability: Target,
  SystemComponent: Box,
  FunctionPort: Plug,

  // ── LA ──
  LogicalComponent: Box,
  LogicalActor: User,
  LogicalFunction: FunctionSquare,
  LogicalCapability: Target,

  // ── PA ──
  PhysicalComponent: HardDrive,
  PhysicalNode: HardDrive,
  PhysicalFunction: FunctionSquare,
  PhysicalActor: User,

  // ── EPBS ──
  EPBSArchitecture: LayoutDashboard,
  ConfigurationItem: Package,
  ConfigurationItemPart: Package,
  ConfigurationItemInterface: Plug,
};

const CLASS_ICONS: Record<ClassElementTypeValue, LucideIcon> = {
  CLASS: Box,
  INTERFACE: Link,
  ENUM: Boxes,
  DATA_TYPE: Boxes,
  PRIMITIVE: Boxes,
  COLLECTION: Boxes,
  UNION: Boxes,
  PACKAGE: Folder,
};

/** Values persisted before the type unions were introduced. */
const LEGACY_ICONS: Record<string, LucideIcon> = {
  GROUP: Folder,
};

export function getElementTypeIcon(type: string): LucideIcon {
  if (type in DOMAIN_ICONS) return DOMAIN_ICONS[type as ElementTypeValue];
  if (type in CLASS_ICONS) return CLASS_ICONS[type as ClassElementTypeValue];
  return LEGACY_ICONS[type] ?? Monitor;
}
