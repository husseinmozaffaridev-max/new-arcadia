import type { DiagramTypeInfo, DiagramTypeValue } from "../types/diagram";
import type { LayerValue } from "../types/layer";

export const DIAGRAM_TYPES: DiagramTypeInfo[] = [
  // ─── Operational Analysis (OA) ───────────────────────────────────────────
  {
    value: "OEBD",
    label: "Operational Entity Breakdown Diagram",
    labelFa: "شکست موجودیت‌های عملیاتی",
    layer: "OA",
  },
  {
    value: "OEB",
    label: "Operational Entity Breakdown",
    labelFa: "تجزیه موجودیت عملیاتی",
    layer: "OA",
  },
  {
    value: "OCB",
    label: "Operational Capabilities Blank",
    labelFa: "بوم قابلیت‌های عملیاتی",
    layer: "OA",
  },
  {
    value: "OAB",
    label: "Operational Architecture Blank",
    labelFa: "بوم معماری عملیاتی",
    layer: "OA",
  },
  {
    value: "OAIB",
    label: "Operational Activity Interaction Blank",
    labelFa: "بوم تعامل فعالیت عملیاتی",
    layer: "OA",
  },
  {
    value: "OABD",
    label: "Operational Activity Breakdown",
    labelFa: "شکست فعالیت‌های عملیاتی",
    layer: "OA",
  },
  {
    value: "OAS",
    label: "Operational Activity Scenario",
    labelFa: "سناریوی فعالیت عملیاتی",
    layer: "OA",
  },
  {
    value: "OCD",
    label: "Operational Capability Blank",
    labelFa: "بوم قابلیت عملیاتی",
    layer: "OA",
  },
  {
    value: "OPD",
    label: "Operational Process Description",
    labelFa: "شرح فرآیند عملیاتی",
    layer: "OA",
  },
  {
    value: "OIS",
    label: "Operational Activity Scenario",
    labelFa: "سناریوی فعالیت عملیاتی",
    layer: "OA",
  },
  {
    value: "OAAB",
    label: "Operational Architecture Blank",
    labelFa: "بوم معماری عملیاتی",
    layer: "OA",
  },
  // ─── System Analysis (SA) ────────────────────────────────────────────────
  {
    value: "MCB",
    label: "Missions / Capabilities Blank",
    labelFa: "بوم مأموریت‌ها و قابلیت‌ها",
    layer: "SA",
  },
  {
    value: "CSA",
    label: "Context System Actors",
    labelFa: "زمینه بازیگران سیستم",
    layer: "SA",
  },
  {
    value: "SAB",
    label: "System Architecture Blank",
    labelFa: "بوم معماری سیستم",
    layer: "SA",
  },
  {
    value: "SDFB",
    label: "System Data Flow Blank",
    labelFa: "بوم جریان داده سیستم",
    layer: "SA",
  },
  {
    value: "SFBD",
    label: "System Function Breakdown Diagram",
    labelFa: "شکست توابع سیستم",
    layer: "SA",
  },
  {
    value: "SAS",
    label: "System Architecture Scenario",
    labelFa: "سناریوی معماری سیستم",
    layer: "SA",
  },
  {
    value: "SCD",
    label: "Mission Capability Blank",
    labelFa: "بوم قابلیت مأموریت",
    layer: "SA",
  },
  {
    value: "SFB",
    label: "System Function Breakdown",
    labelFa: "تجزیه کارکرد سیستم",
    layer: "SA",
  },
  {
    value: "SS",
    label: "Functional Scenario",
    labelFa: "سناریوی کارکردی",
    layer: "SA",
  },
  // ─── Logical Architecture (LA) ───────────────────────────────────────────
  {
    value: "LCBD",
    label: "Logical Component Breakdown Diagram",
    labelFa: "شکست مؤلفه‌های منطقی",
    layer: "LA",
  },
  {
    value: "LCB",
    label: "Logical Component Breakdown",
    labelFa: "تجزیه مؤلفه منطقی",
    layer: "LA",
  },
  {
    value: "CRB",
    label: "Capability Realization Blank",
    labelFa: "بوم تحقق قابلیت‌ها",
    layer: "LA",
  },
  {
    value: "LAB",
    label: "Logical Architecture Blank",
    labelFa: "بوم معماری منطقی",
    layer: "LA",
  },
  {
    value: "LDFB",
    label: "Logical Data Flow Blank",
    labelFa: "بوم جریان داده منطقی",
    layer: "LA",
  },
  {
    value: "LFBD",
    label: "Logical Function Breakdown Diagram",
    labelFa: "شکست توابع منطقی",
    layer: "LA",
  },
  {
    value: "LAS",
    label: "Logical Architecture Scenario",
    labelFa: "سناریوی معماری منطقی",
    layer: "LA",
  },
  {
    value: "LFB",
    label: "Logical Function Breakdown",
    labelFa: "تجزیه کارکرد منطقی",
    layer: "LA",
  },
  {
    value: "LS",
    label: "Functional Scenario",
    labelFa: "سناریوی کارکردی",
    layer: "LA",
  },
  // ─── Physical Architecture (PA) ──────────────────────────────────────────
  {
    value: "PCBD",
    label: "Physical Component Breakdown Diagram",
    labelFa: "شکست مؤلفه‌های فیزیکی",
    layer: "PA",
  },
  {
    value: "PCB",
    label: "Physical Component Breakdown",
    labelFa: "تجزیه مؤلفه فیزیکی",
    layer: "PA",
  },
  {
    value: "CRB",
    label: "Capability Realization Blank",
    labelFa: "بوم تحقق قابلیت‌ها",
    layer: "PA",
  },
  {
    value: "PAB",
    label: "Physical Architecture Blank",
    labelFa: "بوم معماری فیزیکی",
    layer: "PA",
  },
  {
    value: "PDFB",
    label: "Physical Dataflow Blank",
    labelFa: "بوم جریان داده فیزیکی",
    layer: "PA",
  },
  {
    value: "PFBD",
    label: "Physical Function Breakdown Diagram",
    labelFa: "شکست توابع فیزیکی",
    layer: "PA",
  },
  {
    value: "PAS",
    label: "Physical Architecture Scenario",
    labelFa: "سناریوی معماری فیزیکی",
    layer: "PA",
  },
  {
    value: "PFB",
    label: "Physical Function Breakdown",
    labelFa: "تجزیه کارکرد فیزیکی",
    layer: "PA",
  },
  {
    value: "PS",
    label: "Functional Scenario Diagram",
    labelFa: "دیاگرام سناریوی کارکردی",
    layer: "PA",
  },
  // ─── Transverse ──────────────────────────────────────────────────────────
  {
    value: "CDB",
    label: "Class Diagram",
    labelFa: "دیاگرام کلاس",
    layer: "SA",
  },
];

export const DIAGRAMS_BY_LAYER: Record<LayerValue, DiagramTypeValue[]> = {
  OA: ["OEBD", "OCB", "OABD", "OAIB", "OAB", "OPD", "OAS", "CDB"],
  SA: ["CSA", "MCB", "SFBD", "SDFB", "SAB", "SAS", "CDB"],
  LA: ["LCBD", "LFBD", "LDFB", "LAB", "CRB", "LAS", "CDB"],
  PA: ["PCBD", "PFBD", "PDFB", "PAB", "CRB", "PAS", "CDB"],
  // Legacy layer — no diagram types offered in the UI.
  EPBS: [],
};
