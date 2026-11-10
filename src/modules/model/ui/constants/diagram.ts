import type { DiagramTypeInfo, DiagramTypeValue } from "../types/diagram";
import type { LayerValue } from "../types/layer";

export const DIAGRAM_TYPES: DiagramTypeInfo[] = [
  // ─── Operational Analysis (OA) ───────────────────────────────────────────
  {
    value: "OEBD",
    label: "Operational Entity Breakdown",
    labelFa: "شکست موجودیت‌های عملیاتی",
    layer: "OA",
  },
  {
    value: "OCB",
    label: "Operational Capabilities Blank",
    labelFa: "بوم قابلیت‌های عملیاتی",
    layer: "OA",
  },
  {
    value: "OABD",
    label: "Operational Activity Breakdown",
    labelFa: "شکست فعالیت‌های عملیاتی",
    layer: "OA",
  },
  {
    value: "OAIB",
    label: "Operational Activity Interaction Blank",
    labelFa: "بوم تعامل فعالیت عملیاتی",
    layer: "OA",
  },
  {
    value: "OAB",
    label: "Operational Architecture Blank",
    labelFa: "بوم معماری عملیاتی",
    layer: "OA",
  },
  {
    value: "OPD",
    label: "Operational Process Description",
    labelFa: "شرح فرآیند عملیاتی",
    layer: "OA",
  },
  {
    value: "OAS",
    label: "Entity Scenario",
    labelFa: "سناریوی موجودیت‌های عملیاتی",
    layer: "OA",
  },
  // ─── System Analysis (SA) ────────────────────────────────────────────────
  {
    value: "CSA",
    label: "Contextual System Actors",
    labelFa: "زمینه بازیگران سیستم",
    layer: "SA",
  },
  {
    value: "MCB",
    label: "Missions Capabilities Blank",
    labelFa: "بوم مأموریت‌ها و قابلیت‌ها",
    layer: "SA",
  },
  {
    value: "CCB",
    label: "Contextual Capability",
    labelFa: "قابلیت‌های زمینه‌ای",
    layer: "SA",
  },
  {
    value: "CMB",
    label: "Contextual Mission",
    labelFa: "مأموریت زمینه‌ای",
    layer: "SA",
  },
  {
    value: "SFBD",
    label: "System Function Breakdown",
    labelFa: "شکست توابع سیستم",
    layer: "SA",
  },
  {
    value: "SDFB",
    label: "System Data Flow Blank",
    labelFa: "بوم جریان داده سیستم",
    layer: "SA",
  },
  {
    value: "SAB",
    label: "System Architecture Blank",
    labelFa: "بوم معماری سیستم",
    layer: "SA",
  },
  {
    value: "SFOA",
    label: "System Functions - Operational Activities",
    labelFa: "توابع سیستم – فعالیت‌های عملیاتی",
    layer: "SA",
  },
  // ─── Logical Architecture (LA) ───────────────────────────────────────────
  {
    value: "LCBD",
    label: "Logical Component Breakdown",
    labelFa: "شکست مؤلفه‌های منطقی",
    layer: "LA",
  },
  {
    value: "LFBD",
    label: "Logical Function Breakdown",
    labelFa: "شکست توابع منطقی",
    layer: "LA",
  },
  {
    value: "LDFB",
    label: "Logical Data Flow Blank",
    labelFa: "بوم جریان داده منطقی",
    layer: "LA",
  },
  {
    value: "LAB",
    label: "Logical Architecture Blank",
    labelFa: "بوم معماری منطقی",
    layer: "LA",
  },
  // ─── Physical Architecture (PA) ──────────────────────────────────────────
  {
    value: "PCBD",
    label: "Physical Component Breakdown",
    labelFa: "شکست مؤلفه‌های فیزیکی",
    layer: "PA",
  },
  {
    value: "PFBD",
    label: "Physical Function Breakdown",
    labelFa: "شکست توابع فیزیکی",
    layer: "PA",
  },
  {
    value: "PDFB",
    label: "Physical Data Flow Blank",
    labelFa: "بوم جریان داده فیزیکی",
    layer: "PA",
  },
  {
    value: "PAB",
    label: "Physical Architecture Blank",
    labelFa: "بوم معماری فیزیکی",
    layer: "PA",
  },
  {
    value: "PPD",
    label: "Physical Path Description",
    labelFa: "شرح مسیر فیزیکی",
    layer: "PA",
  },
  // ─── Cross-layer (kept for rendering of existing diagrams) ───────────────
  {
    value: "CRB",
    label: "Capability Realization Blank",
    labelFa: "بوم تحقق قابلیت‌ها",
    layer: "LA",
  },
  // ─── EPBS (legacy — not offered in UI) ───────────────────────────────────
  {
    value: "EPBB",
    label: "EPBS Breakdown",
    labelFa: "تجزیه محصول نهایی",
    layer: "OA",
  },
  {
    value: "EAB",
    label: "EPBS Architecture Blank",
    labelFa: "معماری محصول نهایی",
    layer: "OA",
  },
  {
    value: "ECB",
    label: "EPBS Context/Interface Diagram",
    labelFa: "دیاگرام زمینه/رابط محصول نهایی",
    layer: "OA",
  },
  // ─── Legacy aliases (kept for DB backward-compatibility) ─────────────────
  {
    value: "OEB",
    label: "Operational Entity Breakdown (legacy)",
    labelFa: "شکست موجودیت عملیاتی (قدیمی)",
    layer: "OA",
  },
  {
    value: "OCD",
    label: "Operational Capability Blank (legacy)",
    labelFa: "بوم قابلیت عملیاتی (قدیمی)",
    layer: "OA",
  },
  {
    value: "OIS",
    label: "Entity Scenario (legacy)",
    labelFa: "سناریوی موجودیت (قدیمی)",
    layer: "OA",
  },
  {
    value: "OAAB",
    label: "Operational Architecture Blank (legacy)",
    labelFa: "بوم معماری عملیاتی (قدیمی)",
    layer: "OA",
  },
  {
    value: "SCD",
    label: "Mission Capability Blank (legacy)",
    labelFa: "بوم قابلیت مأموریت (قدیمی)",
    layer: "SA",
  },
  {
    value: "SFB",
    label: "System Function Breakdown (legacy)",
    labelFa: "شکست کارکرد سیستم (قدیمی)",
    layer: "SA",
  },
  {
    value: "SAS",
    label: "System Architecture Scenario (legacy)",
    labelFa: "سناریوی معماری سیستم (قدیمی)",
    layer: "SA",
  },
  {
    value: "SS",
    label: "Functional Scenario (legacy)",
    labelFa: "سناریوی کارکردی (قدیمی)",
    layer: "SA",
  },
  {
    value: "LCB",
    label: "Logical Component Breakdown (legacy)",
    labelFa: "شکست مؤلفه منطقی (قدیمی)",
    layer: "LA",
  },
  {
    value: "LFB",
    label: "Logical Function Breakdown (legacy)",
    labelFa: "شکست کارکرد منطقی (قدیمی)",
    layer: "LA",
  },
  {
    value: "LAS",
    label: "Logical Architecture Scenario (legacy)",
    labelFa: "سناریوی معماری منطقی (قدیمی)",
    layer: "LA",
  },
  {
    value: "LS",
    label: "Functional Scenario (legacy)",
    labelFa: "سناریوی کارکردی (قدیمی)",
    layer: "LA",
  },
  {
    value: "PCB",
    label: "Physical Component Breakdown (legacy)",
    labelFa: "شکست مؤلفه فیزیکی (قدیمی)",
    layer: "PA",
  },
  {
    value: "PFB",
    label: "Physical Function Breakdown (legacy)",
    labelFa: "شکست کارکرد فیزیکی (قدیمی)",
    layer: "PA",
  },
  {
    value: "PAS",
    label: "Physical Architecture Scenario (legacy)",
    labelFa: "سناریوی معماری فیزیکی (قدیمی)",
    layer: "PA",
  },
  {
    value: "PS",
    label: "Functional Scenario Diagram (legacy)",
    labelFa: "دیاگرام سناریوی کارکردی (قدیمی)",
    layer: "PA",
  },
  // ─── Class Diagram ────────────────────────────────────────────────────────
  {
    value: "CDB",
    label: "Class Diagram",
    labelFa: "دیاگرام کلاس",
    layer: "SA",
  },
];

export const DIAGRAMS_BY_LAYER: Record<LayerValue, DiagramTypeValue[]> = {
  OA: ["OEBD", "OCB", "OABD", "OAIB", "OAB", "OPD", "OAS"],
  SA: ["CSA", "CCB", "CMB", "MCB", "SFBD", "SDFB", "SAB", "SFOA"],
  LA: ["LCBD", "LFBD", "LDFB", "LAB"],
  PA: ["PCBD", "PFBD", "PDFB", "PAB", "PPD"],
  // Legacy layer — no diagram types offered in the UI.
  EPBS: [],
};
