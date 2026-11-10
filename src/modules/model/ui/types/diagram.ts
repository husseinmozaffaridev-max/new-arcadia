import type { LayerValue } from "./layer";

export type DiagramTypeValue =
  | "OEB"
  | "OEBD"
  | "OCB"
  | "OCD"
  | "OAB"
  | "OAIB"
  | "OABD"
  | "OPD"
  | "OAS"
  | "OIS"
  | "OAAB"
  | "MCB"
  | "CSA"
  | "SCD"
  | "SFBD"
  | "SFB"
  | "SDFB"
  | "SAB"
  | "SAS"
  | "SS"
  | "LCB"
  | "LCBD"
  | "LFBD"
  | "LFB"
  | "LDFB"
  | "LAB"
  | "LAS"
  | "LS"
  | "PCB"
  | "PCBD"
  | "PFBD"
  | "PFB"
  | "PDFB"
  | "PAB"
  | "PAS"
  | "PS"
  | "CRB"
  | "EPBB"
  | "EAB"
  | "ECB"
  | "CDB";

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
