import { describe, expect, it } from "vitest";
import { canNestOnDiagram } from "../helpers/diagram";
import {
  canPlaceElementOnDiagram,
  getDiagramPlacements,
  getElementPlacementError,
  getNewElementActions,
} from "./element-actions";

describe("canPlaceElementOnDiagram", () => {
  it("accepts only the element types a diagram declares", () => {
    expect(canPlaceElementOnDiagram("SystemFunction", "SDFB")).toBe(true);
    expect(canPlaceElementOnDiagram("FunctionPort", "SDFB")).toBe(true);
    expect(canPlaceElementOnDiagram("SystemComponent", "SDFB")).toBe(false);
    expect(canPlaceElementOnDiagram("SystemComponent", "SAB")).toBe(false);
    expect(canPlaceElementOnDiagram("SystemFunction", "SAB")).toBe(true);
    expect(canPlaceElementOnDiagram("SystemFunction", "SCD")).toBe(false);
    expect(canPlaceElementOnDiagram("SystemCapability", "SCD")).toBe(true);
    expect(canPlaceElementOnDiagram("OperationalActivity", "SAB")).toBe(false);
    expect(canPlaceElementOnDiagram("OperationalCapability", "OAB")).toBe(
      false,
    );
    expect(canPlaceElementOnDiagram("OperationalEntity", "OAB")).toBe(true);
    expect(canPlaceElementOnDiagram("OperationalActor", "OAB")).toBe(true);
    expect(canPlaceElementOnDiagram("OperationalActivity", "OAB")).toBe(true);
    expect(canPlaceElementOnDiagram("OperationalCapability", "OCB")).toBe(true);
    expect(canPlaceElementOnDiagram("Mission", "OCB")).toBe(true);
    expect(canPlaceElementOnDiagram("OperationalActivity", "OCB")).toBe(false);
  });
});

describe("getElementPlacementError", () => {
  it("returns null when the element fits", () => {
    expect(
      getElementPlacementError("Render Video", "SystemFunction", "SDFB"),
    ).toBeNull();
  });

  it("names the diagram and what it supports when it does not", () => {
    const message = getElementPlacementError(
      "Render Video",
      "SystemComponent",
      "SDFB",
    );

    expect(message).toContain('Cannot add "Render Video" to SDFB diagram.');
    expect(message).toContain("SystemFunction");
    expect(message).not.toContain("SystemComponent");
  });

  it("returns Persian error message when locale is fa", () => {
    const message = getElementPlacementError(
      "Render Video",
      "SystemComponent",
      "SDFB",
      "fa",
    );

    expect(message).toContain("افزودن «Render Video» به دیاگرام SDFB مجاز نیست.");
    expect(message).toContain("SystemFunction");
  });
});

describe("getDiagramPlacements", () => {
  it("flags every diagram with its permission", () => {
    const diagrams = [
      { id: "d1", type: "SDFB" },
      { id: "d2", type: "LAB" },
    ] as Parameters<typeof getDiagramPlacements>[0];

    expect(getDiagramPlacements(diagrams, "LogicalFunction")).toEqual([
      { diagram: diagrams[0], allowed: false },
      { diagram: diagrams[1], allowed: true },
    ]);
    expect(
      getDiagramPlacements(diagrams, "LogicalComponent").map((p) => p.allowed),
    ).toEqual([false, true]);
  });
});

describe("getNewElementActions", () => {
  it("offers only the element types of the layer", () => {
    const values = getNewElementActions("SA").map((a) => a.value);

    expect(values).toContain("SystemFunction");
    expect(values).toContain("SystemComponent");
    expect(values).not.toContain("PhysicalComponent");
    expect(values).not.toContain("OperationalActivity");
    expect(getNewElementActions("PA").map((a) => a.value)).not.toContain(
      "SystemFunction",
    );
  });

  it("brings an icon and a visual for every action", () => {
    for (const action of getNewElementActions("LA")) {
      expect(action.icon, action.value).toBeDefined();
      expect(action.strokeColor, action.value).toMatch(/^#/);
      expect(action.fillColor, action.value).toMatch(/^#/);
      expect(action.label.length, action.value).toBeGreaterThan(0);
    }
  });
});

describe("canNestOnDiagram", () => {
  it("strictly prohibits any breakdown or decomposition on OAB", () => {
    // Entities cannot be decomposed on OAB (breakdown belongs to OEB)
    expect(
      canNestOnDiagram("OperationalEntity", "OperationalEntity", "OAB"),
    ).toBe(false);
    // Activities cannot be decomposed on OAB (breakdown belongs to OABD)
    expect(
      canNestOnDiagram("OperationalActivity", "OperationalActivity", "OAB"),
    ).toBe(false);
    // Activities cannot be nested into entities or actors on OAB (allocation is via relationship edge)
    expect(
      canNestOnDiagram("OperationalActivity", "OperationalEntity", "OAB"),
    ).toBe(false);
    expect(
      canNestOnDiagram("OperationalActivity", "OperationalActor", "OAB"),
    ).toBe(false);
  });

  it("permits entity breakdown only on OEB/OEBD and activity breakdown only on OABD", () => {
    expect(
      canNestOnDiagram("OperationalEntity", "OperationalEntity", "OEB"),
    ).toBe(true);
    expect(
      canNestOnDiagram("OperationalEntity", "OperationalEntity", "OEBD"),
    ).toBe(true);
    expect(
      canNestOnDiagram("OperationalActivity", "OperationalActivity", "OABD"),
    ).toBe(true);
    expect(
      canNestOnDiagram("LogicalComponent", "LogicalComponent", "LCBD"),
    ).toBe(true);
    expect(
      canNestOnDiagram("PhysicalComponent", "PhysicalComponent", "PCBD"),
    ).toBe(true);
  });

  it("permits component decomposition and function allocation on SAB, but not function breakdown", () => {
    expect(canNestOnDiagram("SystemComponent", "System", "SAB")).toBe(true);
    expect(canNestOnDiagram("SystemComponent", "SystemComponent", "SAB")).toBe(
      true,
    );
    expect(canNestOnDiagram("SystemFunction", "SystemComponent", "SAB")).toBe(
      true,
    );
    expect(canNestOnDiagram("SystemFunction", "SystemFunction", "SAB")).toBe(
      false,
    );
    expect(canNestOnDiagram("SystemFunction", "SystemFunction", "SFBD")).toBe(
      true,
    );
  });

  it("disallows any nesting on flat diagrams like OCB, OAIB, and SDFB", () => {
    expect(
      canNestOnDiagram("OperationalActivity", "OperationalEntity", "OCB"),
    ).toBe(false);
    expect(
      canNestOnDiagram("OperationalActivity", "OperationalActivity", "OAIB"),
    ).toBe(false);
    expect(canNestOnDiagram("SystemFunction", "SystemFunction", "SDFB")).toBe(
      false,
    );
  });
});
