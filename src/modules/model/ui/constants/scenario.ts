export const LIFELINE_SPACING = 200;
export const HEADER_HEIGHT = 60;
export const ROW_HEIGHT = 80;
export const CANVAS_PADDING = 100;
export const LIFELINE_HEADER_WIDTH = 160;
export const LIFELINE_AXIS_X = 100;
export const HANDLE_COUNT = 15;
export const EXECUTION_SPEC_WIDTH = 10;
export const EXECUTION_SPEC_NESTED_OFFSET = 3;

export function executionOrderToY(executionOrder: number): number {
  return HEADER_HEIGHT + (executionOrder + 1) * ROW_HEIGHT;
}

export function yToExecutionOrder(y: number): number {
  return Math.max(0, Math.round((y - HEADER_HEIGHT) / ROW_HEIGHT - 1));
}

export function computeCanopyHeight(maxExecutionOrder: number): number {
  return HEADER_HEIGHT + (maxExecutionOrder + 3) * ROW_HEIGHT + CANVAS_PADDING;
}

export const LIFELINE_TYPE_CONFIG: Record<
  string,
  {
    stereotype: string;
    headerBg: string;
    headerBorder: string;
    lineColor: string;
    iconBg: string;
  }
> = {
  ACTOR: {
    stereotype: "Actor",
    headerBg: "bg-amber-100/70 dark:bg-amber-400/10",
    headerBorder: "border-amber-300/80 dark:border-amber-400/25",
    lineColor: "var(--ll-actor)",
    iconBg: "bg-amber-200/60 dark:bg-amber-400/15",
  },
  FUNCTION: {
    stereotype: "Function",
    headerBg: "bg-blue-100/70 dark:bg-blue-400/10",
    headerBorder: "border-blue-300/80 dark:border-blue-400/25",
    lineColor: "var(--ll-function)",
    iconBg: "bg-blue-200/60 dark:bg-blue-400/15",
  },
  COMPONENT: {
    stereotype: "Component",
    headerBg: "bg-emerald-100/70 dark:bg-emerald-400/10",
    headerBorder: "border-emerald-300/80 dark:border-emerald-400/25",
    lineColor: "var(--ll-component)",
    iconBg: "bg-emerald-200/60 dark:bg-emerald-400/15",
  },
  CLASS_ELEMENT: {
    stereotype: "Class",
    headerBg: "bg-purple-100/70 dark:bg-purple-400/10",
    headerBorder: "border-purple-300/80 dark:border-purple-400/25",
    lineColor: "var(--ll-class)",
    iconBg: "bg-purple-200/60 dark:bg-purple-400/15",
  },
  EXTERNAL: {
    stereotype: "External",
    headerBg: "bg-slate-100/70 dark:bg-slate-400/10",
    headerBorder: "border-slate-300/80 dark:border-slate-400/25",
    lineColor: "var(--ll-external)",
    iconBg: "bg-slate-200/60 dark:bg-slate-400/15",
  },
};

export const DEFAULT_LIFELINE_CONFIG = LIFELINE_TYPE_CONFIG.COMPONENT;

export const MESSAGE_CONFIG: Record<
  string,
  {
    symbol: string;
    color: string;
    dashed: boolean;
    strokeWidth: number;
    openArrow: boolean;
  }
> = {
  CALL: {
    symbol: "\u2192",
    color: "var(--canvas-ink)",
    dashed: false,
    strokeWidth: 1.5,
    openArrow: false,
  },
  CREATE: {
    symbol: "\u2192",
    color: "var(--canvas-ink)",
    dashed: false,
    strokeWidth: 1.5,
    openArrow: false,
  },
  DELETE: {
    symbol: "\u2192",
    color: "var(--canvas-ink)",
    dashed: false,
    strokeWidth: 1.5,
    openArrow: false,
  },
  RETURN: {
    symbol: "\u2190",
    color: "var(--canvas-ink-muted)",
    dashed: true,
    strokeWidth: 1.5,
    openArrow: true,
  },
  REPLY: {
    symbol: "\u2190",
    color: "var(--canvas-ink-muted)",
    dashed: true,
    strokeWidth: 1.5,
    openArrow: true,
  },
  FOUND: {
    symbol: "\u2192",
    color: "var(--canvas-ink)",
    dashed: false,
    strokeWidth: 1.5,
    openArrow: false,
  },
  LOST: {
    symbol: "\u2192",
    color: "var(--canvas-ink)",
    dashed: false,
    strokeWidth: 1.5,
    openArrow: false,
  },
};

/**
 * Fragment operator themes — derived from a single base hue per operator via
 * color-mix so tints, text, and tag backgrounds adapt to light/dark themes
 * without per-theme hex tables. `text` mixes toward the theme foreground so
 * labels stay readable on both surfaces.
 */
function operatorTheme(base: string) {
  return {
    borderColor: base,
    bg: `color-mix(in oklab, ${base} 6%, transparent)`,
    textColor: `color-mix(in oklab, ${base} 62%, var(--foreground))`,
    tagBg: `color-mix(in oklab, ${base} 16%, var(--canvas-surface))`,
    tagText: `color-mix(in oklab, ${base} 45%, var(--foreground))`,
  };
}

export const OPERATOR_COLORS: Record<
  string,
  {
    borderColor: string;
    bg: string;
    textColor: string;
    tagBg: string;
    tagText: string;
  }
> = {
  alt: operatorTheme("#3b82f6"),
  opt: operatorTheme("#22c55e"),
  loop: operatorTheme("#f97316"),
  break: operatorTheme("#ef4444"),
  par: operatorTheme("#a855f7"),
  critical: operatorTheme("#eab308"),
  assert: operatorTheme("#06b6d4"),
  neg: operatorTheme("#ec4899"),
  ignore: operatorTheme("#9ca3af"),
  consider: operatorTheme("#9ca3af"),
  strict: operatorTheme("#6366f1"),
  seq: operatorTheme("#14b8a6"),
};

/**
 * Maps a model or class element type to a valid scenario lifeline type.
 * Returns null for element types that cannot participate as lifelines
 * (e.g. Capabilities, Missions, Ports).
 */
export function mapToLifelineType(elementType: string): string | null {
  switch (elementType) {
    case "OperationalActor":
    case "Actor":
    case "SystemActor":
    case "LogicalActor":
    case "PhysicalActor":
      return "ACTOR";
    case "OperationalActivity":
    case "SystemFunction":
    case "LogicalFunction":
    case "PhysicalFunction":
      return "FUNCTION";
    case "OperationalEntity":
    case "System":
    case "SystemComponent":
    case "LogicalComponent":
    case "PhysicalComponent":
    case "PhysicalNode":
      return "COMPONENT";
    case "ClassElement":
    case "Class":
      return "CLASS_ELEMENT";
    default:
      return null;
  }
}
