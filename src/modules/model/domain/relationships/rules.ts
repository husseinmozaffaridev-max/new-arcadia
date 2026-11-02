import type { ElementTypeValue } from "../value-objects/element-type";
import { Layer, type LayerValue } from "../value-objects/layer";
import type { RelationshipTypeValue, TraceLinkTypeValue } from "./definitions";

// ─── Rule shapes ─────────────────────────────────────────────────────────────

export interface ConnectionRule {
  relationshipType: RelationshipTypeValue;
  allowedSources: ElementTypeValue[];
  allowedTargets: ElementTypeValue[];
  layer: Layer;
  descriptionFa: string;
}

export interface TraceRule {
  type: TraceLinkTypeValue;
  sourceTypes: ElementTypeValue[];
  sourceLayer: Layer;
  targetTypes: ElementTypeValue[];
  targetLayer: Layer;
  descriptionFa: string;
}

// ─── Connection rules (same layer) ───────────────────────────────────────────

export const CONNECTION_RULES: ConnectionRule[] = [
  // ─── OA ────────────────────────────────────────────────────────────────────
  {
    relationshipType: "OperationalExchange",
    layer: Layer.OA,
    allowedSources: ["OperationalActivity"],
    allowedTargets: ["OperationalActivity"],
    descriptionFa: "تبادل عملیاتی فقط بین فعالیت‌های عملیاتی مجاز است",
  },
  {
    relationshipType: "InvolvementLink",
    layer: Layer.OA,
    allowedSources: [
      "OperationalEntity",
      "OperationalActor",
      "OperationalActivity",
    ],
    allowedTargets: ["OperationalCapability"],
    descriptionFa: "پیوند مشارکت بین موجودیت/بازیگر/فعالیت و قابلیت عملیاتی",
  },
  {
    relationshipType: "Composition",
    layer: Layer.OA,
    allowedSources: [
      "OperationalEntity",
      "OperationalActivity",
      "OperationalCapability",
    ],
    allowedTargets: [
      "OperationalEntity",
      "OperationalActivity",
      "OperationalCapability",
    ],
    descriptionFa: "ترکیب (والد-فرزندی) بین موجودیت‌ها/فعالیت‌ها/قابلیت‌ها",
  },
  {
    relationshipType: "Generalization",
    layer: Layer.OA,
    allowedSources: ["OperationalEntity", "OperationalActor"],
    allowedTargets: ["OperationalEntity", "OperationalActor"],
    descriptionFa: "تعمیم بین موجودیت‌ها/بازیگرهای عملیاتی",
  },
  {
    relationshipType: "Allocation",
    layer: Layer.OA,
    allowedSources: ["OperationalActivity"],
    allowedTargets: ["OperationalEntity", "OperationalActor"],
    descriptionFa: "فعالیت عملیاتی به موجودیت/بازیگر عملیاتی تخصیص می‌یابد",
  },
  // ─── SA ────────────────────────────────────────────────────────────────────
  {
    relationshipType: "FunctionalExchange",
    layer: Layer.SA,
    allowedSources: ["SystemFunction"],
    allowedTargets: ["SystemFunction"],
    descriptionFa: "تبادل تابعی فقط بین توابع سیستم",
  },
  {
    relationshipType: "SystemExchange",
    layer: Layer.SA,
    allowedSources: ["System", "SystemActor"],
    allowedTargets: ["System", "SystemActor"],
    descriptionFa: "تبادل سیستمی بین سیستم و بازیگران خارجی",
  },
  {
    relationshipType: "ComponentExchange",
    layer: Layer.SA,
    allowedSources: ["SystemComponent"],
    allowedTargets: ["SystemComponent"],
    descriptionFa: "تبادل مؤلفه بین مؤلفه‌های سیستم",
  },
  {
    relationshipType: "Composition",
    layer: Layer.SA,
    allowedSources: [
      "System",
      "SystemComponent",
      "SystemFunction",
      "SystemCapability",
    ],
    allowedTargets: ["SystemComponent", "SystemFunction", "SystemCapability"],
    descriptionFa: "ترکیب (والد-فرزندی) بین سیستم/مؤلفه‌ها/توابع/قابلیت‌ها",
  },
  {
    relationshipType: "Generalization",
    layer: Layer.SA,
    allowedSources: ["SystemComponent", "SystemActor"],
    allowedTargets: ["SystemComponent", "SystemActor"],
    descriptionFa: "تعمیم بین مؤلفه‌ها/بازیگرهای سیستم",
  },
  // ─── Allocation (function → component, same layer) ─────────────────────────
  {
    relationshipType: "Allocation",
    layer: Layer.SA,
    allowedSources: ["SystemFunction"],
    allowedTargets: ["System", "SystemComponent", "SystemActor"],
    descriptionFa: "تابع سیستم به سیستم/مؤلفه/بازیگر سیستم تخصیص می‌یابد",
  },
  // ─── LA ────────────────────────────────────────────────────────────────────
  {
    relationshipType: "LogicalExchange",
    layer: Layer.LA,
    allowedSources: ["LogicalFunction"],
    allowedTargets: ["LogicalFunction"],
    descriptionFa: "تبادل منطقی بین توابع منطقی",
  },
  {
    relationshipType: "ComponentExchange",
    layer: Layer.LA,
    allowedSources: ["LogicalComponent", "LogicalActor"],
    allowedTargets: ["LogicalComponent", "LogicalActor"],
    descriptionFa: "تبادل مؤلفه بین مؤلفه‌های منطقی",
  },
  {
    relationshipType: "ProvidedInterface",
    layer: Layer.LA,
    allowedSources: ["LogicalComponent"],
    allowedTargets: ["LogicalComponent"],
    descriptionFa: "رابط ارائه‌شده توسط مؤلفه منطقی",
  },
  {
    relationshipType: "RequiredInterface",
    layer: Layer.LA,
    allowedSources: ["LogicalComponent"],
    allowedTargets: ["LogicalComponent"],
    descriptionFa: "رابط مورد نیاز مؤلفه منطقی",
  },
  {
    relationshipType: "Composition",
    layer: Layer.LA,
    allowedSources: ["LogicalComponent", "LogicalFunction"],
    allowedTargets: ["LogicalComponent", "LogicalFunction"],
    descriptionFa: "ترکیب بین مؤلفه‌ها/توابع منطقی",
  },
  {
    relationshipType: "Allocation",
    layer: Layer.LA,
    allowedSources: ["LogicalFunction"],
    allowedTargets: ["LogicalComponent", "LogicalActor"],
    descriptionFa: "تابع منطقی به مؤلفه/بازیگر منطقی تخصیص می‌یابد",
  },
  {
    relationshipType: "Generalization",
    layer: Layer.LA,
    allowedSources: ["LogicalComponent", "LogicalActor"],
    allowedTargets: ["LogicalComponent", "LogicalActor"],
    descriptionFa: "تعمیم بین مؤلفه‌ها/بازیگرهای منطقی",
  },
  // ─── PA ────────────────────────────────────────────────────────────────────
  {
    relationshipType: "PhysicalExchange",
    layer: Layer.PA,
    allowedSources: ["PhysicalFunction"],
    allowedTargets: ["PhysicalFunction"],
    descriptionFa: "تبادل فیزیکی بین توابع فیزیکی",
  },
  {
    relationshipType: "PhysicalLink",
    layer: Layer.PA,
    allowedSources: ["PhysicalNode"],
    allowedTargets: ["PhysicalNode"],
    descriptionFa: "پیوند فیزیکی فقط بین گره‌های فیزیکی",
  },
  {
    relationshipType: "DeploymentLink",
    layer: Layer.PA,
    allowedSources: ["PhysicalComponent"],
    allowedTargets: ["PhysicalNode"],
    descriptionFa: "مؤلفه فیزیکی روی گره فیزیکی مستقر می‌شود",
  },
  {
    relationshipType: "Composition",
    layer: Layer.PA,
    allowedSources: ["PhysicalComponent", "PhysicalNode", "PhysicalFunction"],
    allowedTargets: ["PhysicalComponent", "PhysicalNode", "PhysicalFunction"],
    descriptionFa: "ترکیب بین مؤلفه‌ها/گره‌ها/توابع فیزیکی",
  },
  {
    relationshipType: "Allocation",
    layer: Layer.PA,
    allowedSources: ["PhysicalFunction"],
    allowedTargets: ["PhysicalComponent", "PhysicalActor"],
    descriptionFa: "تابع فیزیکی به مؤلفه/بازیگر فیزیکی تخصیص می‌یابد",
  },
  {
    relationshipType: "Generalization",
    layer: Layer.PA,
    allowedSources: ["PhysicalComponent", "PhysicalNode", "PhysicalActor"],
    allowedTargets: ["PhysicalComponent", "PhysicalNode", "PhysicalActor"],
    descriptionFa: "تعمیم بین مؤلفه‌ها/گره‌ها/بازیگرهای فیزیکی",
  },
  // ─── EPBS ──────────────────────────────────────────────────────────────────
  {
    relationshipType: "Composition",
    layer: Layer.EPBS,
    allowedSources: ["ConfigurationItem"],
    allowedTargets: ["ConfigurationItem", "ConfigurationItemPart"],
    descriptionFa: "ترکیب بین مورد پیکربندی و بخش‌های آن",
  },
  {
    relationshipType: "Composition",
    layer: Layer.EPBS,
    allowedSources: ["ConfigurationItemPart"],
    allowedTargets: ["ConfigurationItemPart"],
    descriptionFa: "ترکیب بین بخش‌های مورد پیکربندی",
  },
  {
    relationshipType: "ProvidedInterface",
    layer: Layer.EPBS,
    allowedSources: ["ConfigurationItemInterface"],
    allowedTargets: ["ConfigurationItemInterface"],
    descriptionFa: "رابط ارائه‌شده توسط رابط مورد پیکربندی",
  },
  {
    relationshipType: "RequiredInterface",
    layer: Layer.EPBS,
    allowedSources: ["ConfigurationItemInterface"],
    allowedTargets: ["ConfigurationItemInterface"],
    descriptionFa: "رابط مورد نیاز رابط مورد پیکربندی",
  },
  {
    relationshipType: "Generalization",
    layer: Layer.EPBS,
    allowedSources: ["ConfigurationItem", "ConfigurationItemPart"],
    allowedTargets: ["ConfigurationItem", "ConfigurationItemPart"],
    descriptionFa: "تعمیم بین موارد پیکربندی",
  },
];

// ─── Trace rules (cross- and intra-layer) ────────────────────────────────────

export const TRACE_RULES: TraceRule[] = [
  // ─── SA realizes OA ────────────────────────────────────────────────────────
  {
    type: "Realization",
    sourceLayer: Layer.SA,
    sourceTypes: ["SystemFunction"],
    targetLayer: Layer.OA,
    targetTypes: ["OperationalActivity"],
    descriptionFa: "تابع سیستم، فعالیت عملیاتی را محقق می‌کند",
  },
  {
    type: "Realization",
    sourceLayer: Layer.SA,
    sourceTypes: ["SystemActor"],
    targetLayer: Layer.OA,
    targetTypes: ["OperationalEntity", "OperationalActor"],
    descriptionFa: "بازیگر سیستم، موجودیت عملیاتی را محقق می‌کند",
  },
  {
    type: "Realization",
    sourceLayer: Layer.SA,
    sourceTypes: ["SystemCapability"],
    targetLayer: Layer.OA,
    targetTypes: ["OperationalCapability"],
    descriptionFa: "قابلیت سیستم، قابلیت عملیاتی را محقق می‌کند",
  },
  // ─── LA realizes SA ────────────────────────────────────────────────────────
  {
    type: "Realization",
    sourceLayer: Layer.LA,
    sourceTypes: ["LogicalFunction"],
    targetLayer: Layer.SA,
    targetTypes: ["SystemFunction"],
    descriptionFa: "تابع منطقی، تابع سیستم را محقق می‌کند",
  },
  {
    type: "Realization",
    sourceLayer: Layer.LA,
    sourceTypes: ["LogicalComponent"],
    targetLayer: Layer.SA,
    targetTypes: ["SystemComponent"],
    descriptionFa: "مؤلفه منطقی، مؤلفه سیستم را محقق می‌کند",
  },
  {
    type: "Realization",
    sourceLayer: Layer.LA,
    sourceTypes: ["LogicalActor"],
    targetLayer: Layer.SA,
    targetTypes: ["SystemActor"],
    descriptionFa: "بازیگر منطقی، بازیگر سیستم را محقق می‌کند",
  },
  // ─── PA realizes LA ────────────────────────────────────────────────────────
  {
    type: "Realization",
    sourceLayer: Layer.PA,
    sourceTypes: ["PhysicalComponent"],
    targetLayer: Layer.LA,
    targetTypes: ["LogicalComponent"],
    descriptionFa: "مؤلفه فیزیکی، مؤلفه منطقی را محقق می‌کند",
  },
  {
    type: "Realization",
    sourceLayer: Layer.PA,
    sourceTypes: ["PhysicalFunction"],
    targetLayer: Layer.LA,
    targetTypes: ["LogicalFunction"],
    descriptionFa: "تابع فیزیکی، تابع منطقی را محقق می‌کند",
  },
  {
    type: "Realization",
    sourceLayer: Layer.PA,
    sourceTypes: ["PhysicalActor"],
    targetLayer: Layer.LA,
    targetTypes: ["LogicalActor"],
    descriptionFa: "بازیگر فیزیکی، بازیگر منطقی را محقق می‌کند",
  },
  // ─── EPBS realizes PA ─────────────────────────────────────────────────────
  {
    type: "Realization",
    sourceLayer: Layer.EPBS,
    sourceTypes: ["ConfigurationItem"],
    targetLayer: Layer.PA,
    targetTypes: ["PhysicalComponent", "PhysicalActor"],
    descriptionFa: "مورد پیکربندی، مؤلفه فیزیکی یا بازیگر فیزیکی را محقق می‌کند",
  },
];

// ─── Derived views ───────────────────────────────────────────────────────────

/** Layers in which a relationship type can be created. */
export function connectionLayersFor(
  relationshipType: RelationshipTypeValue,
): LayerValue[] {
  const layers: LayerValue[] = [];
  for (const rule of CONNECTION_RULES) {
    if (
      rule.relationshipType === relationshipType &&
      !layers.includes(rule.layer.value)
    ) {
      layers.push(rule.layer.value);
    }
  }
  return layers;
}
