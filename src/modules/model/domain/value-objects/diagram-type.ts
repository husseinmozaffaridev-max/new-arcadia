import { ValueObject } from "@/modules/shared/domain/value-object";
import { Layer } from "./layer";

export type DiagramTypeValue =
  // ── OA ──────────────────────────────────────────────
  | "OEBD" // Operational Entity Breakdown
  | "OEB"  // legacy alias
  | "OCB"  // Operational Capabilities Blank
  | "OCD"  // legacy alias
  | "OAB"  // Operational Architecture Blank
  | "OAIB" // Operational Activity Interaction Blank
  | "OABD" // Operational Activity Breakdown
  | "OPD"  // Operational Process Description
  | "OAS"  // Entity Scenario
  | "OIS"  // legacy alias
  | "OAAB" // legacy alias
  // ── SA ──────────────────────────────────────────────
  | "CSA"  // Contextual System Actors
  | "MCB"  // Missions Capabilities Blank
  | "CCB"  // Contextual Capability (Capella: "Contextual Capability")
  | "CMB"  // Contextual Mission (Capella: "Contextual Mission")
  | "SFBD" // System Function Breakdown
  | "SFB"  // legacy alias
  | "SCD"  // legacy alias
  | "SDFB" // System Data Flow Blank
  | "SAB"  // System Architecture Blank
  | "SFOA" // System Functions – Operational Activities
  | "SAS"  // legacy alias
  | "SS"   // legacy alias
  // ── LA ──────────────────────────────────────────────
  | "LCBD" // Logical Component Breakdown
  | "LCB"  // legacy alias
  | "LFBD" // Logical Function Breakdown
  | "LFB"  // legacy alias
  | "LDFB" // Logical Data Flow Blank
  | "LAB"  // Logical Architecture Blank
  | "LAS"  // legacy alias
  | "LS"   // legacy alias
  // ── PA ──────────────────────────────────────────────
  | "PCBD" // Physical Component Breakdown
  | "PCB"  // legacy alias
  | "PFBD" // Physical Function Breakdown
  | "PFB"  // legacy alias
  | "PDFB" // Physical Data Flow Blank
  | "PAB"  // Physical Architecture Blank
  | "PPD"  // Physical Path Description
  | "PAS"  // legacy alias
  | "PS"   // legacy alias
  // ── Cross-layer ─────────────────────────────────────
  | "CRB"  // Capability Realization Blank (LA + PA)
  | "EAB"
  | "ECB"
  | "EPBB"
  | "CDB";

interface DiagramTypeMeta {
  label: string;
  labelFa: string;
  layer: Layer;
  /** If set, diagram type is available in these layers (transverse, e.g. CDB). */
  layers?: Layer[];
  description: string;
}

const META: Record<DiagramTypeValue, DiagramTypeMeta> = {
  OEB: {
    label: "Operational Entity Breakdown",
    labelFa: "تجزیه موجودیت عملیاتی",
    layer: Layer.OA,
    description: "سلسله‌مراتب موجودیت‌های عملیاتی",
  },
  OEBD: {
    label: "Operational Entity Breakdown Diagram",
    labelFa: "نمودار شکست موجودیت‌های عملیاتی",
    layer: Layer.OA,
    description: "سلسله‌مراتب و شکست موجودیت‌های عملیاتی مطابق استاندارد Capella",
  },
  OCB: {
    label: "Operational Capabilities Blank",
    labelFa: "بوم قابلیت‌های عملیاتی",
    layer: Layer.OA,
    description: "قابلیت‌های عملیاتی و موجودیت‌های درگیر",
  },
  OAB: {
    label: "Operational Architecture Blank",
    labelFa: "بوم معماری عملیاتی",
    layer: Layer.OA,
    description: "نمای کلی معماری عملیاتی",
  },
  OAIB: {
    label: "Operational Activity Interaction Blank",
    labelFa: "بوم تعامل فعالیت عملیاتی",
    layer: Layer.OA,
    description: "تعامل میان فعالیت‌های عملیاتی",
  },
  OABD: {
    label: "Operational Activity Breakdown",
    labelFa: "تجزیه فعالیت‌های عملیاتی",
    layer: Layer.OA,
    description: "ساختار تجزیه فعالیت‌های عملیاتی",
  },
  OPD: {
    label: "Operational Process Description",
    labelFa: "شرح فرآیند عملیاتی",
    layer: Layer.OA,
    description: "توصیف فرآیندها و توالی فعالیت‌های عملیاتی",
  },
  OCD: {
    label: "Operational Capability Blank",
    labelFa: "بوم قابلیت عملیاتی",
    layer: Layer.OA,
    description: "قابلیت‌های عملیاتی و موجودیت‌های درگیر",
  },
  OAS: {
    label: "Entity Scenario",
    labelFa: "سناریوی موجودیت‌های عملیاتی",
    layer: Layer.OA,
    description: "سناریوی زمانی (sequence) برای موجودیت‌ها و بازیگران عملیاتی",
  },
  OIS: {
    label: "Operational Activity Scenario",
    labelFa: "سناریوی فعالیت عملیاتی",
    layer: Layer.OA,
    description: "سناریوی توالی عملیاتی",
  },
  OAAB: {
    label: "Operational Architecture Blank",
    labelFa: "بوم معماری عملیاتی",
    layer: Layer.OA,
    description: "نمای کلی معماری عملیاتی",
  },
  MCB: {
    label: "Missions Capabilities Blank",
    labelFa: "بوم مأموریت‌ها و قابلیت‌ها",
    layer: Layer.SA,
    description: "قابلیت‌های مأموریتی سیستم",
  },
  CCB: {
    label: "Contextual Capability",
    labelFa: "قابلیت‌های زمینه‌ای",
    layer: Layer.SA,
    description: "نمودار قابلیت‌های سیستم از دیدگاه جعبه‌سیاه",
  },
  CMB: {
    label: "Contextual Mission",
    labelFa: "مأموریت زمینه‌ای",
    layer: Layer.SA,
    description: "نمودار مأموریت‌های سیستم از دیدگاه جعبه‌سیاه",
  },
  CSA: {
    label: "Contextual System Actors",
    labelFa: "زمینه بازیگران سیستم",
    layer: Layer.SA,
    description: "سیستم تحت مطالعه و بازیگران پیرامون آن",
  },
  SCD: {
    label: "Mission Capability Blank",
    labelFa: "بوم قابلیت مأموریت",
    layer: Layer.SA,
    description: "قابلیت‌های مأموریتی سیستم",
  },
  SFBD: {
    label: "System Function Breakdown Diagram",
    labelFa: "تجزیه توابع سیستم",
    layer: Layer.SA,
    description: "ساختار تجزیه کارکردهای سیستم",
  },
  SFB: {
    label: "System Function Breakdown",
    labelFa: "تجزیه کارکرد سیستم",
    layer: Layer.SA,
    description: "ساختار تجزیه کارکردهای سیستم",
  },
  SAB: {
    label: "System Architecture Blank",
    labelFa: "معماری سیستم",
    layer: Layer.SA,
    description: "دیاگرام اصلی معماری سیستم",
  },
  SDFB: {
    label: "System Data Flow Blank",
    labelFa: "جریان داده سیستم",
    layer: Layer.SA,
    description: "جریان داده در سطح سیستم",
  },
  SAS: {
    label: "System Architecture Scenario",
    labelFa: "سناریوی معماری سیستم",
    layer: Layer.SA,
    description: "سناریوی رفتاری سیستم",
  },
  SS: {
    label: "Functional Scenario",
    labelFa: "سناریوی کارکردی",
    layer: Layer.SA,
    description: "سناریوی رفتاری سیستم",
  },
  SFOA: {
    label: "System Functions - Operational Activities",
    labelFa: "توابع سیستم – فعالیت‌های عملیاتی",
    layer: Layer.SA,
    description: "نمودار ردیابی تخصیص توابع سیستم به فعالیت‌های عملیاتی",
  },
  LAB: {
    label: "Logical Architecture Blank",
    labelFa: "معماری منطقی",
    layer: Layer.LA,
    description: "دیاگرام اصلی معماری منطقی",
  },
  LDFB: {
    label: "Logical Dataflow Breakdown",
    labelFa: "تجزیه جریان داده منطقی",
    layer: Layer.LA,
    description: "جریان داده در سطح منطقی",
  },
  LCB: {
    label: "Logical Component Breakdown",
    labelFa: "تجزیه مؤلفه منطقی",
    layer: Layer.LA,
    description: "سلسله‌مراتب مؤلفه‌های منطقی",
  },
  LCBD: {
    label: "Logical Component Breakdown Diagram",
    labelFa: "نمودار شکست مؤلفه‌های منطقی",
    layer: Layer.LA,
    description: "سلسله‌مراتب و شکست مؤلفه‌های منطقی مطابق استاندارد Capella",
  },
  LFBD: {
    label: "Logical Function Breakdown Diagram",
    labelFa: "تجزیه توابع منطقی",
    layer: Layer.LA,
    description: "ساختار تجزیه کارکردهای منطقی",
  },
  LFB: {
    label: "Logical Function Breakdown",
    labelFa: "تجزیه کارکرد منطقی",
    layer: Layer.LA,
    description: "ساختار تجزیه کارکردهای منطقی",
  },
  LAS: {
    label: "Logical Architecture Scenario",
    labelFa: "سناریوی معماری منطقی",
    layer: Layer.LA,
    description: "سناریوی رفتاری منطقی",
  },
  LS: {
    label: "Functional Scenario",
    labelFa: "سناریوی کارکردی",
    layer: Layer.LA,
    description: "سناریوی رفتاری منطقی",
  },
  PAB: {
    label: "Physical Architecture Blank",
    labelFa: "معماری فیزیکی",
    layer: Layer.PA,
    description: "دیاگرام اصلی معماری فیزیکی",
  },
  PDFB: {
    label: "Physical Dataflow Blank",
    labelFa: "بوم جریان داده فیزیکی",
    layer: Layer.PA,
    description: "جریان داده در سطح فیزیکی",
  },
  PCB: {
    label: "Physical Component Breakdown",
    labelFa: "تجزیه مؤلفه فیزیکی",
    layer: Layer.PA,
    description: "سلسله‌مراتب مؤلفه‌های فیزیکی",
  },
  PCBD: {
    label: "Physical Component Breakdown Diagram",
    labelFa: "نمودار شکست مؤلفه‌های فیزیکی",
    layer: Layer.PA,
    description: "سلسله‌مراتب و شکست مؤلفه‌ها و نودهای فیزیکی مطابق استاندارد Capella",
  },
  PFBD: {
    label: "Physical Function Breakdown Diagram",
    labelFa: "تجزیه توابع فیزیکی",
    layer: Layer.PA,
    description: "ساختار تجزیه کارکردهای فیزیکی",
  },
  PFB: {
    label: "Physical Function Breakdown",
    labelFa: "تجزیه کارکرد فیزیکی",
    layer: Layer.PA,
    description: "ساختار تجزیه کارکردهای فیزیکی",
  },
  PAS: {
    label: "Physical Architecture Scenario",
    labelFa: "سناریوی معماری فیزیکی",
    layer: Layer.PA,
    description: "سناریوی رفتاری در سطح فیزیکی",
  },
  PS: {
    label: "Functional Scenario Diagram",
    labelFa: "دیاگرام سناریوی کارکردی",
    layer: Layer.PA,
    description: "سناریوی رفتاری فیزیکی",
  },
  PPD: {
    label: "Physical Path Description",
    labelFa: "شرح مسیر فیزیکی",
    layer: Layer.PA,
    description: "توصیف مسیرهای فیزیکی و ارتباطات سخت‌افزاری بین گره‌ها",
  },
  CRB: {
    label: "Capability Realization Blank",
    labelFa: "بوم تحقق قابلیت‌ها",
    layer: Layer.LA,
    layers: [Layer.LA, Layer.PA],
    description: "بوم تحقق قابلیت‌های سیستم مطابق استاندارد Capella در سطوح منطقی و فیزیکی",
  },
  EPBB: {
    label: "EPBS Breakdown",
    labelFa: "تجزیه محصول نهایی",
    layer: Layer.EPBS,
    description: "سلسله‌مراتب مؤلفه‌های محصول نهایی",
  },
  EAB: {
    label: "EPBS Architecture Blank",
    labelFa: "معماری محصول نهایی",
    layer: Layer.EPBS,
    description: "دیاگرام اصلی معماری محصول نهایی",
  },
  ECB: {
    label: "EPBS Context/Interface Diagram",
    labelFa: "دیاگرام زمینه/رابط محصول نهایی",
    layer: Layer.EPBS,
    description: "موجودیت‌های پیکربندی و رابط‌های بین آن‌ها",
  },
  CDB: {
    label: "Class Diagram",
    labelFa: "دیاگرام کلاس",
    layer: Layer.SA,
    layers: [Layer.OA, Layer.SA, Layer.LA, Layer.PA, Layer.EPBS],
    description: "دیاگرام کلاس UML برای مدل‌سازی ساختار داده",
  },
};

const BREAKDOWN_TYPES: ReadonlySet<DiagramTypeValue> = new Set([
  "OEB",
  "OEBD",
  "OABD",
  "SFB",
  "SFBD",
  "LFB",
  "LFBD",
  "PFB",
  "PFBD",
  "LCB",
  "LCBD",
  "PCB",
  "PCBD",
  "ECB",
]);

const ALL_VALUES = Object.keys(META) as DiagramTypeValue[];

interface DiagramTypeProps {
  value: DiagramTypeValue;
}

export class DiagramType extends ValueObject<DiagramTypeProps> {
  protected validate(props: DiagramTypeProps): void {
    if (!ALL_VALUES.includes(props.value))
      throw new Error(`Diagram type is invalid : ${props.value}`);
  }

  static from(value: string): DiagramType {
    if (!ALL_VALUES.includes(value as DiagramTypeValue))
      throw new Error(`Diagram type is invalid : ${value}`);
    return new DiagramType({ value: value as DiagramTypeValue });
  }

  static allForLayer(layer: Layer): DiagramType[] {
    return ALL_VALUES.filter((v) => {
      const meta = META[v];
      if (meta.layers) return meta.layers.some((l) => l.equals(layer));
      return meta.layer.equals(layer);
    }).map((v) => new DiagramType({ value: v }));
  }

  get value(): DiagramTypeValue {
    return this.props.value;
  }
  get layer(): Layer {
    return META[this.props.value].layer;
  }
  get label(): string {
    return META[this.props.value].label;
  }
  get labelFa(): string {
    return META[this.props.value].labelFa;
  }
  get description(): string {
    return META[this.props.value].description;
  }

  isScenario(): boolean {
    return this.props.value.endsWith("S") || this.props.value.endsWith("IS");
  }

  isBreakdown(): boolean {
    return BREAKDOWN_TYPES.has(this.props.value);
  }

  toString(): string {
    return this.props.value;
  }
}
