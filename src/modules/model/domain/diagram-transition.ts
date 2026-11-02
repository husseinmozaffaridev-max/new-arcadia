import type { DiagramTypeValue } from "./value-objects/diagram-type";

/** Architecture diagram types — everything except the transverse `CDB`. */
type ArchitectureDiagramType = Exclude<DiagramTypeValue, "CDB">;

/**
 * Layer-to-layer counterpart for every architecture diagram type.
 *
 * A diagram type carries its own palette and layer, so a cloned diagram cannot
 * keep the source type (an `OAB` inside the SA model would still offer the OA
 * toolbox). Only types with a real counterpart are listed; the rest are skipped
 * by {@link getTransitionedDiagramType}.
 *
 * Scenario diagrams (`OIS`, `SS`, `LS`, `PS`) and class diagrams (`CDB`) live in
 * their own tables and are never cloned by a transition.
 */
const DIAGRAM_TYPE_TRANSITIONS: Partial<
  Record<DiagramTypeValue, ArchitectureDiagramType>
> = {
  // OA → SA
  OEB: "CSA",
  OCB: "MCB",
  OCD: "SCD",
  OAB: "SAB",
  OAAB: "SAB",
  OAIB: "SDFB",
  OPD: "SDFB",
  OABD: "SFBD",
  // SA → LA
  CSA: "LAB",
  SAB: "LAB",
  SFBD: "LFBD",
  SFB: "LFB",
  SDFB: "LDFB",
  // LA → PA
  LCB: "PCB",
  LAB: "PAB",
  LFBD: "PFBD",
  LFB: "PFB",
  LDFB: "PDFB",
  // PA is the last offered layer — nothing to transition into.
};

/** Returns the target-layer diagram type, or `null` when the type has no counterpart. */
export function getTransitionedDiagramType(
  type: string,
): ArchitectureDiagramType | null {
  return DIAGRAM_TYPE_TRANSITIONS[type as DiagramTypeValue] ?? null;
}
