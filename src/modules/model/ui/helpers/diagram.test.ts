import { describe, expect, it } from "vitest";
import { getDiagramTypesForLayer } from "./diagram";

describe("getDiagramTypesForLayer", () => {
  it("never returns duplicate diagram type values for LA", () => {
    const types = getDiagramTypesForLayer("LA");
    const values = types.map((t) => t.value);
    const uniqueValues = Array.from(new Set(values));

    expect(values).toEqual(uniqueValues);
    expect(values.filter((v) => v === "CRB")).toHaveLength(1);
    expect(types.find((t) => t.value === "CRB")?.layer).toBe("LA");
  });

  it("never returns duplicate diagram type values for PA", () => {
    const types = getDiagramTypesForLayer("PA");
    const values = types.map((t) => t.value);
    const uniqueValues = Array.from(new Set(values));

    expect(values).toEqual(uniqueValues);
    expect(values.filter((v) => v === "CRB")).toHaveLength(1);
    expect(types.find((t) => t.value === "CRB")?.layer).toBe("PA");
  });

  it("never returns duplicate diagram type values for OA and SA", () => {
    const oaTypes = getDiagramTypesForLayer("OA");
    const oaValues = oaTypes.map((t) => t.value);
    expect(oaValues).toEqual(Array.from(new Set(oaValues)));

    const saTypes = getDiagramTypesForLayer("SA");
    const saValues = saTypes.map((t) => t.value);
    expect(saValues).toEqual(Array.from(new Set(saValues)));
  });

  it("includes transverse CDB in all operational/architecture layers", () => {
    for (const layer of ["OA", "SA", "LA", "PA"] as const) {
      const types = getDiagramTypesForLayer(layer);
      expect(types.some((t) => t.value === "CDB")).toBe(true);
    }
  });
});
