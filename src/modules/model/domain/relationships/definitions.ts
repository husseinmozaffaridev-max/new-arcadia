// ─── Relationship value unions ───────────────────────────────────────────────

export type RelationshipTypeValue =
  | "Allocation"
  | "OperationalExchange"
  | "CommunicationMean"
  | "InvolvementLink"
  | "FunctionalExchange"
  | "SystemExchange"
  | "LogicalExchange"
  | "ComponentExchange"
  | "ProvidedInterface"
  | "RequiredInterface"
  | "PhysicalExchange"
  | "PhysicalLink"
  | "DeploymentLink"
  | "Composition"
  | "Generalization";

export type TraceLinkTypeValue = "Realization" | "Refinement";

export type AnyRelationshipValue = RelationshipTypeValue | TraceLinkTypeValue;

export type RelationshipKind = "connection" | "trace";

// ─── Definitions ─────────────────────────────────────────────────────────────

/**
 * The single source of truth for how a relationship is named and how it reads
 * in a sentence.
 *
 * - `label` / `labelFa` — the display name of the relationship type.
 * - `noun` / `nounFa` — lowercase noun used inside prose
 *   ("create a functional exchange", "یک تبادل تابعی بسازید").
 * - `forward` — phrase that reads source → target
 *   ("SystemFunction **realizes** OperationalActivity").
 * - `reverse` — phrase that reads target → source, used when the pair has to be
 *   displayed the other way round.
 */
export interface RelationshipDefinition {
  value: AnyRelationshipValue;
  kind: RelationshipKind;
  label: string;
  labelFa: string;
  noun: string;
  nounFa: string;
  forward: string;
  forwardFa: string;
  reverse: string;
  reverseFa: string;
}

export const RELATIONSHIP_DEFINITIONS: Record<
  AnyRelationshipValue,
  RelationshipDefinition
> = {
  // ─── Connections (same layer) ──────────────────────────────────────────────
  Allocation: {
    value: "Allocation",
    kind: "connection",
    label: "Allocation",
    labelFa: "تخصیص",
    noun: "allocation",
    nounFa: "تخصیص",
    forward: "is allocated to",
    forwardFa: "تخصیصیافته به",
    reverse: "allocates",
    reverseFa: "تخصیص می‌دهد",
  },
  OperationalExchange: {
    value: "OperationalExchange",
    kind: "connection",
    label: "Operational Exchange",
    labelFa: "تبادل عملیاتی",
    noun: "operational exchange",
    nounFa: "تبادل عملیاتی",
    forward: "exchanges with",
    forwardFa: "تبادل دارد با",
    reverse: "exchanges with",
    reverseFa: "تبادل دارد با",
  },
  CommunicationMean: {
    value: "CommunicationMean",
    kind: "connection",
    label: "Communication Mean",
    labelFa: "وسیله ارتباط عملیاتی",
    noun: "communication mean",
    nounFa: "وسیله ارتباط",
    forward: "communicates with",
    forwardFa: "ارتباط دارد با",
    reverse: "communicates with",
    reverseFa: "ارتباط دارد با",
  },
  InvolvementLink: {
    value: "InvolvementLink",
    kind: "connection",
    label: "Involvement Link",
    labelFa: "پیوند مشارکت",
    noun: "involvement link",
    nounFa: "پیوند مشارکت",
    forward: "is involved in",
    forwardFa: "درگیر است در",
    reverse: "involves",
    reverseFa: "شامل است",
  },
  FunctionalExchange: {
    value: "FunctionalExchange",
    kind: "connection",
    label: "Functional Exchange",
    labelFa: "تبادل تابعی",
    noun: "functional exchange",
    nounFa: "تبادل تابعی",
    forward: "exchanges with",
    forwardFa: "تبادل دارد با",
    reverse: "exchanges with",
    reverseFa: "تبادل دارد با",
  },
  SystemExchange: {
    value: "SystemExchange",
    kind: "connection",
    label: "System Exchange",
    labelFa: "تبادل سیستمی",
    noun: "system exchange",
    nounFa: "تبادل سیستمی",
    forward: "exchanges with",
    forwardFa: "تبادل دارد با",
    reverse: "exchanges with",
    reverseFa: "تبادل دارد با",
  },
  LogicalExchange: {
    value: "LogicalExchange",
    kind: "connection",
    label: "Logical Exchange",
    labelFa: "تبادل منطقی",
    noun: "logical exchange",
    nounFa: "تبادل منطقی",
    forward: "exchanges with",
    forwardFa: "تبادل دارد با",
    reverse: "exchanges with",
    reverseFa: "تبادل دارد با",
  },
  ComponentExchange: {
    value: "ComponentExchange",
    kind: "connection",
    label: "Component Exchange",
    labelFa: "تبادل مؤلفه",
    noun: "component exchange",
    nounFa: "تبادل مؤلفه",
    forward: "exchanges with",
    forwardFa: "تبادل دارد با",
    reverse: "exchanges with",
    reverseFa: "تبادل دارد با",
  },
  ProvidedInterface: {
    value: "ProvidedInterface",
    kind: "connection",
    label: "Provided Interface",
    labelFa: "رابط ارائه‌شده",
    noun: "provided interface",
    nounFa: "رابط ارائه‌شده",
    forward: "provides an interface to",
    forwardFa: "رابط ارائه می‌دهد به",
    reverse: "receives an interface from",
    reverseFa: "رابط دریافت می‌کند از",
  },
  RequiredInterface: {
    value: "RequiredInterface",
    kind: "connection",
    label: "Required Interface",
    labelFa: "رابط مورد نیاز",
    noun: "required interface",
    nounFa: "رابط مورد نیاز",
    forward: "requires an interface from",
    forwardFa: "رابط نیاز دارد از",
    reverse: "provides an interface to",
    reverseFa: "رابط ارائه می‌دهد به",
  },
  PhysicalExchange: {
    value: "PhysicalExchange",
    kind: "connection",
    label: "Physical Exchange",
    labelFa: "تبادل فیزیکی",
    noun: "physical exchange",
    nounFa: "تبادل فیزیکی",
    forward: "exchanges with",
    forwardFa: "تبادل دارد با",
    reverse: "exchanges with",
    reverseFa: "تبادل دارد با",
  },
  PhysicalLink: {
    value: "PhysicalLink",
    kind: "connection",
    label: "Physical Link",
    labelFa: "پیوند فیزیکی",
    noun: "physical link",
    nounFa: "پیوند فیزیکی",
    forward: "is physically linked to",
    forwardFa: "پیوند فیزیکی دارد با",
    reverse: "is physically linked to",
    reverseFa: "پیوند فیزیکی دارد با",
  },
  DeploymentLink: {
    value: "DeploymentLink",
    kind: "connection",
    label: "Deployment Link",
    labelFa: "پیوند استقرار",
    noun: "deployment link",
    nounFa: "پیوند استقرار",
    forward: "is deployed on",
    forwardFa: "مستقر است روی",
    reverse: "hosts",
    reverseFa: "میزبان است",
  },
  Composition: {
    value: "Composition",
    kind: "connection",
    label: "Composition",
    labelFa: "ترکیب",
    noun: "composition",
    nounFa: "ترکیب",
    forward: "is composed of",
    forwardFa: "تشکیل‌شده از",
    reverse: "is part of",
    reverseFa: "بخشی از",
  },
  Generalization: {
    value: "Generalization",
    kind: "connection",
    label: "Generalization",
    labelFa: "تعمیم",
    noun: "generalization",
    nounFa: "تعمیم",
    forward: "is a specialization of",
    forwardFa: "نوعی از",
    reverse: "is a generalization of",
    reverseFa: "تعمیم است برای",
  },

  // ─── Trace links (intra- or cross-layer) ───────────────────────────────────
  Realization: {
    value: "Realization",
    kind: "trace",
    label: "Realization",
    labelFa: "تحقق",
    noun: "realization",
    nounFa: "تحقق",
    forward: "realizes",
    forwardFa: "تحقق می‌بخشد",
    reverse: "is realized by",
    reverseFa: "توسط این محقق می‌شود",
  },
  Refinement: {
    value: "Refinement",
    kind: "trace",
    label: "Refinement",
    labelFa: "اصلاح",
    noun: "refinement",
    nounFa: "اصلاح",
    forward: "refines",
    forwardFa: "اصلاح می‌کند",
    reverse: "is refined by",
    reverseFa: "توسط این اصلاح می‌شود",
  },
};

export const ALL_RELATIONSHIP_VALUES = Object.keys(
  RELATIONSHIP_DEFINITIONS,
) as AnyRelationshipValue[];

export const CONNECTION_VALUES = ALL_RELATIONSHIP_VALUES.filter(
  (value) => RELATIONSHIP_DEFINITIONS[value].kind === "connection",
) as RelationshipTypeValue[];

export const TRACE_VALUES = ALL_RELATIONSHIP_VALUES.filter(
  (value) => RELATIONSHIP_DEFINITIONS[value].kind === "trace",
) as TraceLinkTypeValue[];

const BY_VALUE = new Map<AnyRelationshipValue, RelationshipDefinition>(
  ALL_RELATIONSHIP_VALUES.map((value) => [
    value,
    RELATIONSHIP_DEFINITIONS[value],
  ]),
);

export function getRelationshipDefinition(
  value: string,
): RelationshipDefinition | null {
  return BY_VALUE.get(value as AnyRelationshipValue) ?? null;
}

export function relationshipDefinitionsOfKind(
  kind: RelationshipKind,
): RelationshipDefinition[] {
  return ALL_RELATIONSHIP_VALUES.map(
    (value) => RELATIONSHIP_DEFINITIONS[value],
  ).filter((definition) => definition.kind === kind);
}
