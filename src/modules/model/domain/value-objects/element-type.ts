import { ValueObject } from "@/modules/shared/domain/value-object";
import { Layer } from "./layer";

// ─── Type unions per layer ────────────────────────────────────────────────────

type OAElementValue =
  | "Mission"
  | "OperationalEntity"
  | "OperationalActor"
  | "OperationalActivity"
  | "OperationalCapability"
  | "OperationalProcess";

type SAElementValue =
  | "System"
  | "SystemActor"
  | "SystemMission"
  | "SystemFunction"
  | "SystemCapability"
  | "SystemComponent"
  | "FunctionPort";

type LAElementValue =
  | "LogicalComponent"
  | "LogicalActor"
  | "LogicalFunction"
  | "LogicalCapability";

type PAElementValue =
  | "PhysicalComponent"
  | "PhysicalNode"
  | "PhysicalFunction"
  | "PhysicalActor";

type EPBSElementValue =
  | "EPBSArchitecture"
  | "ConfigurationItem"
  | "ConfigurationItemPart"
  | "ConfigurationItemInterface";

export type ElementTypeValue =
  | OAElementValue
  | SAElementValue
  | LAElementValue
  | PAElementValue
  | EPBSElementValue;

// ─── META ─────────────────────────────────────────────────────────────────────

export type ElementTypeCategory =
  | "mission"
  | "actor"
  | "entity"
  | "system"
  | "component"
  | "function"
  | "capability"
  | "process"
  | "port"
  | "node"
  | "configuration-item"
  | "architecture";

interface ElementTypeMeta {
  label: string;
  labelFa: string;
  layer: Layer;
  category: ElementTypeCategory;
}

const META: Record<ElementTypeValue, ElementTypeMeta> = {
  // OA
  Mission: {
    label: "Mission",
    labelFa: "مأموریت",
    layer: Layer.OA,
    category: "mission",
  },
  OperationalEntity: {
    label: "Operational Entity",
    labelFa: "موجودیت عملیاتی",
    layer: Layer.OA,
    category: "entity",
  },
  OperationalActor: {
    label: "Operational Actor",
    labelFa: "بازیگر عملیاتی",
    layer: Layer.OA,
    category: "actor",
  },
  OperationalActivity: {
    label: "Operational Activity",
    labelFa: "فعالیت عملیاتی",
    layer: Layer.OA,
    category: "function",
  },
  OperationalCapability: {
    label: "Operational Capability",
    labelFa: "قابلیت عملیاتی",
    layer: Layer.OA,
    category: "capability",
  },
  OperationalProcess: {
    label: "Operational Process",
    labelFa: "فرایند عملیاتی",
    layer: Layer.OA,
    category: "process",
  },
  // SA
  System: {
    label: "System",
    labelFa: "سیستم",
    layer: Layer.SA,
    category: "system",
  },
  SystemActor: {
    label: "System Actor",
    labelFa: "بازیگر سیستم",
    layer: Layer.SA,
    category: "actor",
  },
  SystemMission: {
    label: "System Mission",
    labelFa: "مأموریت سیستم",
    layer: Layer.SA,
    category: "mission",
  },
  SystemFunction: {
    label: "System Function",
    labelFa: "تابع سیستم",
    layer: Layer.SA,
    category: "function",
  },
  SystemCapability: {
    label: "System Capability",
    labelFa: "قابلیت سیستم",
    layer: Layer.SA,
    category: "capability",
  },
  SystemComponent: {
    label: "System Component",
    labelFa: "مؤلفه سیستم",
    layer: Layer.SA,
    category: "component",
  },
  FunctionPort: {
    label: "Function Port",
    labelFa: "پورت تابع",
    layer: Layer.SA,
    category: "port",
  },
  // LA
  LogicalComponent: {
    label: "Logical Component",
    labelFa: "مؤلفه منطقی",
    layer: Layer.LA,
    category: "component",
  },
  LogicalActor: {
    label: "Logical Actor",
    labelFa: "بازیگر منطقی",
    layer: Layer.LA,
    category: "actor",
  },
  LogicalFunction: {
    label: "Logical Function",
    labelFa: "تابع منطقی",
    layer: Layer.LA,
    category: "function",
  },
  LogicalCapability: {
    label: "Logical Capability Realization",
    labelFa: "تحقق قابلیت منطقی",
    layer: Layer.LA,
    category: "capability",
  },
  // PA
  PhysicalComponent: {
    label: "Physical Component",
    labelFa: "مؤلفه فیزیکی",
    layer: Layer.PA,
    category: "component",
  },
  PhysicalNode: {
    label: "Physical Node",
    labelFa: "گره فیزیکی",
    layer: Layer.PA,
    category: "node",
  },
  PhysicalFunction: {
    label: "Physical Function",
    labelFa: "تابع فیزیکی",
    layer: Layer.PA,
    category: "function",
  },
  PhysicalActor: {
    label: "Physical Actor",
    labelFa: "بازیگر فیزیکی",
    layer: Layer.PA,
    category: "actor",
  },
  // EPBS
  EPBSArchitecture: {
    label: "EPBS Architecture",
    labelFa: "معماری محصول نهایی",
    layer: Layer.EPBS,
    category: "architecture",
  },
  ConfigurationItem: {
    label: "Configuration Item",
    labelFa: "مورد پیکربندی",
    layer: Layer.EPBS,
    category: "configuration-item",
  },
  ConfigurationItemPart: {
    label: "Configuration Item Part",
    labelFa: "بخش مورد پیکربندی",
    layer: Layer.EPBS,
    category: "configuration-item",
  },
  ConfigurationItemInterface: {
    label: "Configuration Item Interface",
    labelFa: "رابط مورد پیکربندی",
    layer: Layer.EPBS,
    category: "configuration-item",
  },
};

const LAYER_MAP: Record<ElementTypeValue, Layer> = Object.fromEntries(
  (Object.keys(META) as ElementTypeValue[]).map((k) => [k, META[k].layer]),
) as Record<ElementTypeValue, Layer>;

const ALL_VALUES = Object.keys(META) as ElementTypeValue[];

// ─── Value Object ─────────────────────────────────────────────────────────────

interface ElementTypeProps {
  value: ElementTypeValue;
}

export class ElementType extends ValueObject<ElementTypeProps> {
  protected validate(props: ElementTypeProps): void {
    if (!ALL_VALUES.includes(props.value))
      throw new Error(`Element type is invalid: ${props.value}`);
  }

  static from(value: string): ElementType {
    if (!ALL_VALUES.includes(value as ElementTypeValue))
      throw new Error(`Element type is invalid: ${value}`);
    return new ElementType({ value: value as ElementTypeValue });
  }

  static allForLayer(layer: Layer): ElementType[] {
    return ALL_VALUES.filter((v) => LAYER_MAP[v].equals(layer)).map(
      (v) => new ElementType({ value: v }),
    );
  }

  static all(): ElementType[] {
    return ALL_VALUES.map((v) => new ElementType({ value: v }));
  }

  static tryFrom(value: string): ElementType | null {
    return ALL_VALUES.includes(value as ElementTypeValue)
      ? new ElementType({ value: value as ElementTypeValue })
      : null;
  }

  get value(): ElementTypeValue {
    return this.props.value;
  }
  get layer(): Layer {
    return LAYER_MAP[this.props.value];
  }
  get label(): string {
    return META[this.props.value].label;
  }
  get labelFa(): string {
    return META[this.props.value].labelFa;
  }
  get category(): ElementTypeCategory {
    return META[this.props.value].category;
  }

  isMission(): boolean {
    return this.category === "mission";
  }
  isActor(): boolean {
    return this.category === "actor";
  }
  isEntity(): boolean {
    return this.category === "entity";
  }
  isSystem(): boolean {
    return this.category === "system";
  }
  isComponent(): boolean {
    return this.category === "component";
  }
  isFunction(): boolean {
    return this.category === "function";
  }
  isCapability(): boolean {
    return this.category === "capability";
  }
  isProcess(): boolean {
    return this.category === "process";
  }
  isPort(): boolean {
    return this.category === "port";
  }
  isNode(): boolean {
    return this.category === "node";
  }
  isEpbsArchitecture(): boolean {
    return this.category === "architecture";
  }
  isConfigurationItem(): boolean {
    return this.props.value === "ConfigurationItem";
  }
  isConfigurationItemPart(): boolean {
    return this.props.value === "ConfigurationItemPart";
  }
  isConfigurationItemInterface(): boolean {
    return this.props.value === "ConfigurationItemInterface";
  }

  toString(): string {
    return this.props.value;
  }
}
