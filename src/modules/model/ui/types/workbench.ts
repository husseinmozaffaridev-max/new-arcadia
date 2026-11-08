import type { ClassElementData } from "./class-diagram";
import type { Diagram } from "./diagram";
import type { Element } from "./element";
import type { Model } from "./model";

export type WorkbenchModelData = {
  model: Model;
  /** Merged arch + class elements (backward-compatible) */
  elements: Element[];
  /** Merged arch + class diagrams (backward-compatible) */
  diagrams: Diagram[];
  /** Architecture-only elements */
  archElements: Element[];
  /** Class diagram elements (raw ClassElementData) */
  classElements: ClassElementData[];
  /** Architecture-only diagrams */
  archDiagrams: Diagram[];
  /** Scenario diagrams (OIS, SS, LS, PS) */
  scenarioDiagrams: Diagram[];
  /** Class diagrams (CDB) */
  classDiagrams: Diagram[];
};

export type WorkbenchData = {
  project: {
    id: number;
    name: string;
    description?: string | null;
    permissions: string[];
    [key: string]: unknown;
  };
  modelData: WorkbenchModelData[];
};
