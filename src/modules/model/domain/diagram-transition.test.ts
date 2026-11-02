import { describe, expect, it } from "vitest";
import { getTransitionedDiagramType } from "./diagram-transition";

describe("getTransitionedDiagramType", () => {
  it("carries each architecture diagram to its counterpart type", () => {
    expect(getTransitionedDiagramType("OAB")).toBe("SAB");
    expect(getTransitionedDiagramType("OCB")).toBe("MCB");
    expect(getTransitionedDiagramType("OAIB")).toBe("SDFB");
    expect(getTransitionedDiagramType("OABD")).toBe("SFBD");
    expect(getTransitionedDiagramType("OAAB")).toBe("SAB");
    expect(getTransitionedDiagramType("OPD")).toBe("SDFB");
    expect(getTransitionedDiagramType("SAB")).toBe("LAB");
    expect(getTransitionedDiagramType("SDFB")).toBe("LDFB");
    expect(getTransitionedDiagramType("LAB")).toBe("PAB");
    expect(getTransitionedDiagramType("LCB")).toBe("PCB");
  });

  it("skips types that have no counterpart in the next layer", () => {
    expect(getTransitionedDiagramType("SCD")).toBeNull();
    expect(getTransitionedDiagramType("PAB")).toBeNull();
    expect(getTransitionedDiagramType("PS")).toBeNull();
  });

  it("never returns a class or scenario diagram type", () => {
    expect(getTransitionedDiagramType("CDB")).toBeNull();
    expect(getTransitionedDiagramType("OIS")).toBeNull();
    expect(getTransitionedDiagramType("SS")).toBeNull();
    expect(getTransitionedDiagramType("LS")).toBeNull();
  });

  it("returns null for anything unknown", () => {
    expect(getTransitionedDiagramType("nope")).toBeNull();
    expect(getTransitionedDiagramType("")).toBeNull();
  });
});
