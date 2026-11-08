import { describe, expect, it } from "vitest";
import { DiagramType } from "./diagram-type";
import { Layer } from "./layer";

describe("DiagramType", () => {
  it("rejects an unknown diagram type", () => {
    expect(() => DiagramType.from("XYZ")).toThrow(
      "Diagram type is invalid : XYZ",
    );
    expect(DiagramType.from("SAB").value).toBe("SAB");
  });

  it("exposes bilingual labels and a description", () => {
    const sab = DiagramType.from("SAB");

    expect(sab.label).toBe("System Architecture Blank");
    expect(sab.labelFa).toBe("معماری سیستم");
    expect(sab.description).toBe("دیاگرام اصلی معماری سیستم");
    expect(sab.layer.equals(Layer.SA)).toBe(true);
    expect(sab.toString()).toBe("SAB");
  });

  it("lists the diagrams offered by a layer", () => {
    expect(DiagramType.allForLayer(Layer.OA).map((d) => d.value)).toEqual([
      "OEB",
      "OEBD",
      "OCB",
      "OAB",
      "OAIB",
      "OABD",
      "OPD",
      "OCD",
      "OAS",
      "OIS",
      "OAAB",
      "CDB",
    ]);
    expect(DiagramType.allForLayer(Layer.LA).map((d) => d.value)).toEqual([
      "LAB",
      "LDFB",
      "LCB",
      "LCBD",
      "LFBD",
      "LFB",
      "LAS",
      "LS",
      "CRB",
      "CDB",
    ]);
    expect(DiagramType.allForLayer(Layer.EPBS).map((d) => d.value)).toEqual([
      "EPBB",
      "EAB",
      "ECB",
      "CDB",
    ]);
  });

  it("offers the transverse class diagram in every layer", () => {
    for (const layer of Layer.all()) {
      expect(DiagramType.allForLayer(layer).map((d) => d.value)).toContain(
        "CDB",
      );
    }
    expect(DiagramType.from("CDB").layer.equals(Layer.SA)).toBe(true);
  });

  it("recognises the scenario diagrams", () => {
    for (const scenario of [
      "OIS",
      "OAS",
      "SS",
      "SAS",
      "LS",
      "LAS",
      "PS",
      "PAS",
    ] as const) {
      expect(DiagramType.from(scenario).isScenario()).toBe(true);
    }
    expect(DiagramType.from("SAB").isScenario()).toBe(false);
    expect(DiagramType.from("OCB").isScenario()).toBe(false);
    expect(DiagramType.from("OCD").isScenario()).toBe(false);
  });

  it("recognises the breakdown diagrams", () => {
    expect(DiagramType.from("OEB").isBreakdown()).toBe(true);
    expect(DiagramType.from("LCB").isBreakdown()).toBe(true);
    expect(DiagramType.from("SFBD").isBreakdown()).toBe(true);
    expect(DiagramType.from("SCD").isBreakdown()).toBe(false);
    expect(DiagramType.from("MCB").isBreakdown()).toBe(false);
    expect(DiagramType.from("OCD").isBreakdown()).toBe(false);
  });

  it("compares by value", () => {
    expect(DiagramType.from("LAB").equals(DiagramType.from("LAB"))).toBe(true);
    expect(DiagramType.from("LAB").equals(DiagramType.from("PAB"))).toBe(false);
  });
});
