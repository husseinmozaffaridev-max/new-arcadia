import type { LayerValue } from "./layer";

export type DiagramTypeValue =
  // ── OA ──────────────────────────────────────────────
  | "OEBD" // Operational Entity Breakdown (Capella: "Operational Entity Breakdown")
  | "OCB"  // Operational Capabilities Blank
  | "OABD" // Operational Activity Breakdown
  | "OAIB" // Operational Activity Interaction Blank
  | "OAB"  // Operational Architecture Blank
  | "OPD"  // Operational Process Description
  | "OAS"  // Entity Scenario (Capella label)
  // ── SA ──────────────────────────────────────────────
  | "CSA"  // Contextual System Actors
  | "MCB"  // Missions Capabilities Blank
  | "CCB"  // Contextual Capability
  | "CMB"  // Contextual Mission
  | "SFBD" // System Function Breakdown
  | "SDFB" // System Data Flow Blank
  | "SAB"  // System Architecture Blank
  | "SFOA" // System Functions – Operational Activities (trace diagram)
  // ── LA ──────────────────────────────────────────────
  | "LCBD" // Logical Component Breakdown
  | "LFBD" // Logical Function Breakdown
  | "LDFB" // Logical Data Flow Blank
  | "LAB"  // Logical Architecture Blank
  // ── PA ──────────────────────────────────────────────
  | "PCBD" // Physical Component Breakdown
  | "PFBD" // Physical Function Breakdown
  | "PDFB" // Physical Data Flow Blank
  | "PAB"  // Physical Architecture Blank
  | "PPD"  // Physical Path Description
  // ── Cross-layer / legacy ─────────────────────────────
  | "CRB"  // Capability Realization Blank (LA + PA)
  | "EPBB" // EPBS Breakdown
  | "EAB"  // EPBS Architecture Blank
  | "ECB"  // EPBS Context/Interface Diagram
  | "CDB"  // Class Diagram
  // ── Legacy aliases kept for DB backward-compatibility ──
  | "OEB"
  | "OCD"
  | "OIS"
  | "OAAB"
  | "SCD"
  | "SFB"
  | "SDFB"
  | "SAS"
  | "SS"
  | "LCB"
  | "LFB"
  | "LAS"
  | "LS"
  | "PCB"
  | "PFB"
  | "PAS"
  | "PS";

export type DiagramTypeInfo = {
  value: DiagramTypeValue;
  label: string;
  labelFa: string;
  layer: LayerValue;
};

export type ElementLayout = {
  elementId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type Diagram = {
  id: string;
  modelId: string;
  type: DiagramTypeValue;
  name: string;
  description?: string;
  viewport: Viewport;
  elementLayouts: ElementLayout[];
  visibleRelationshipIds?: string[] | null;
  createdAt: string;
  updatedAt: string;
};
