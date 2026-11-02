"use client";

import type { DiagramTypeValue } from "../types/diagram";
import { ArchDiagramCanvas } from "./arch-diagram-canvas";
import { ClassDiagramCanvas } from "./class-diagram-canvas";
import { ScenarioDiagramCanvas } from "./scenario-diagram-canvas";

type DiagramCanvasClientProps = {
  diagramId: string;
  modelId: string;
  diagramType: DiagramTypeValue;
};

const SCENARIO_TYPES = new Set([
  "OIS",
  "OAS",
  "SS",
  "SAS",
  "LS",
  "LAS",
  "PS",
  "PAS",
]);

export function DiagramCanvasClient({
  diagramId,
  modelId,
  diagramType,
}: DiagramCanvasClientProps) {
  if (SCENARIO_TYPES.has(diagramType)) {
    return <ScenarioDiagramCanvas diagramId={diagramId} modelId={modelId} />;
  }

  if (diagramType === "CDB") {
    return <ClassDiagramCanvas diagramId={diagramId} modelId={modelId} />;
  }

  return <ArchDiagramCanvas diagramId={diagramId} modelId={modelId} />;
}
