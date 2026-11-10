import { describe, expect, it } from "vitest";
import { ConnectionPolicy } from "../../domain/policies/connection";
import {
  getConnectionFailureMessage,
  getDiagramPalette,
  getDiagramTypesForLayer,
  getDiagramVisibleRelationshipTypes,
  isTreeBreakdownDiagram,
  planHierarchyConnection,
} from "./diagram";

describe("editable Capella palettes", () => {
  it("keeps communication means in OAB and containment in OEBD", () => {
    expect(getDiagramPalette("OEBD").relationshipTypes).not.toContain(
      "CommunicationMean",
    );
    expect(getDiagramPalette("OAB").relationshipTypes).toContain(
      "CommunicationMean",
    );
    expect(
      getConnectionFailureMessage(
        "OperationalEntity",
        "OperationalActor",
        "OEBD",
        false,
      ),
    ).toContain("Communication Mean in OAB");
    const allowedByModel = ConnectionPolicy.getAllowedTypes(
      "OperationalEntity",
      "OperationalActor",
    ).map((type) => type.value);
    expect(
      allowedByModel.filter((type) =>
        getDiagramPalette("OEBD").relationshipTypes.includes(type),
      ),
    ).toEqual([]);
    expect(
      allowedByModel.filter((type) =>
        getDiagramPalette("OAB").relationshipTypes.includes(type),
      ),
    ).toEqual(["CommunicationMean"]);
  });
  it("maps handle gestures to containment in OEBD and OABD", () => {
    expect(isTreeBreakdownDiagram("OEBD")).toBe(true);
    expect(isTreeBreakdownDiagram("OABD")).toBe(true);
    expect(isTreeBreakdownDiagram("OAB")).toBe(false);
    expect(
      planHierarchyConnection(
        { id: "cabin", type: "OperationalActor" },
        { id: "crew", type: "OperationalEntity" },
        "OEBD",
        [{ id: "cabin" }, { id: "crew" }],
      ),
    ).toBe("valid");
    expect(
      planHierarchyConnection(
        { id: "new", type: "OperationalActivity" },
        { id: "entertainment", type: "OperationalActivity" },
        "OABD",
        [{ id: "new" }, { id: "entertainment" }],
      ),
    ).toBe("valid");
  });

  it("rejects an impossible hierarchy or a cycle", () => {
    expect(
      planHierarchyConnection(
        { id: "aircraft", type: "OperationalEntity" },
        { id: "cabin", type: "OperationalActor" },
        "OEBD",
        [{ id: "aircraft" }, { id: "cabin" }],
      ),
    ).toBe("invalid-pair");
    expect(
      planHierarchyConnection(
        { id: "parent", type: "OperationalActivity" },
        { id: "child", type: "OperationalActivity" },
        "OABD",
        [{ id: "child", parentId: "parent" }, { id: "parent" }],
      ),
    ).toBe("cycle");
  });
  it("uses functional exchanges for dataflow diagrams in all four layers", () => {
    for (const type of ["OAIB", "SDFB", "LDFB", "PDFB"]) {
      expect(getDiagramPalette(type).relationshipTypes).toContain(
        "FunctionalExchange",
      );
    }
  });

  it("separates containment from connections in breakdown diagrams", () => {
    for (const type of ["OEBD", "LCBD", "PCBD"]) {
      expect(getDiagramPalette(type).relationshipTypes).not.toContain(
        "Generalization",
      );
    }
  });

  it("offers Capella communication and component exchanges where they belong", () => {
    expect(getDiagramPalette("OAB").relationshipTypes).toContain(
      "CommunicationMean",
    );
    expect(getDiagramPalette("CSA").relationshipTypes).toContain(
      "ComponentExchange",
    );
    expect(getDiagramPalette("PAB").relationshipTypes).toContain(
      "PhysicalLink",
    );
    expect(getDiagramPalette("PAB").relationshipTypes).toContain(
      "DeploymentLink",
    );
  });

  it("projects existing communication means in OCB without creating them there", () => {
    expect(getDiagramPalette("OCB").relationshipTypes).not.toContain(
      "CommunicationMean",
    );
    expect(getDiagramVisibleRelationshipTypes("OCB")).toContain(
      "CommunicationMean",
    );
  });

  it("offers mission and capability realization elements in editable palettes", () => {
    expect(getDiagramPalette("MCB").elementTypes).toContain("SystemMission");
    expect(getDiagramPalette("CRB").elementTypes).toContain(
      "LogicalCapability",
    );
    expect(getDiagramPalette("CRB").elementTypes).toContain(
      "PhysicalComponent",
    );
  });
});

describe("getDiagramTypesForLayer", () => {
  it("never returns duplicate diagram type values for LA", () => {
    const types = getDiagramTypesForLayer("LA");
    const values = types.map((t) => t.value);
    const uniqueValues = Array.from(new Set(values));

    expect(values).toEqual(uniqueValues);
    // CRB is NOT in the canonical DIAGRAMS_BY_LAYER for LA (matches Capella's
    // "Representations per category" panel — CRB is opened via other means).
    expect(values.filter((v) => v === "CRB")).toHaveLength(0);
  });

  it("never returns duplicate diagram type values for PA", () => {
    const types = getDiagramTypesForLayer("PA");
    const values = types.map((t) => t.value);
    const uniqueValues = Array.from(new Set(values));

    expect(values).toEqual(uniqueValues);
    // CRB is NOT in the canonical DIAGRAMS_BY_LAYER for PA (matches Capella).
    expect(values.filter((v) => v === "CRB")).toHaveLength(0);
  });

  it("never returns duplicate diagram type values for OA and SA", () => {
    const oaTypes = getDiagramTypesForLayer("OA");
    const oaValues = oaTypes.map((t) => t.value);
    expect(oaValues).toEqual(Array.from(new Set(oaValues)));

    const saTypes = getDiagramTypesForLayer("SA");
    const saValues = saTypes.map((t) => t.value);
    expect(saValues).toEqual(Array.from(new Set(saValues)));
  });

  it("does NOT include transverse CDB in layer pickers (matches Capella)", () => {
    // CDB (Class Diagram) is a transverse view in Capella — it is NOT listed
    // in the per-layer "Representations per category" panel.  It is accessible
    // via a separate data-model explorer path.
    for (const layer of ["OA", "SA", "LA", "PA"] as const) {
      const types = getDiagramTypesForLayer(layer);
      expect(types.some((t) => t.value === "CDB")).toBe(false);
    }
  });
});
