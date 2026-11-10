import { describe, expect, it } from "vitest";
import { Layer } from "../value-objects/layer";
import { CONNECTION_VALUES, TRACE_VALUES } from "./definitions";
import { CONNECTION_RULES, connectionLayersFor, TRACE_RULES } from "./rules";

describe("connection rules", () => {
  it("only reference relationship types that exist in the registry", () => {
    for (const rule of CONNECTION_RULES) {
      expect(CONNECTION_VALUES).toContain(rule.relationshipType);
      expect(rule.allowedSources.length).toBeGreaterThan(0);
      expect(rule.allowedTargets.length).toBeGreaterThan(0);
      expect(rule.descriptionFa.length).toBeGreaterThan(0);
      expect(rule.layer).toBeInstanceOf(Layer);
    }
  });

  it("has no duplicated rule", () => {
    const keys = CONNECTION_RULES.map(
      (r) =>
        `${r.relationshipType}|${r.layer.value}|${r.allowedSources.join(",")}|${r.allowedTargets.join(",")}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("derives the layers a relationship type can be created in", () => {
    expect(connectionLayersFor("OperationalExchange")).toEqual(["OA"]);
    expect(connectionLayersFor("ComponentExchange")).toEqual([
      "SA",
      "LA",
      "PA",
    ]);
    expect(connectionLayersFor("Allocation").sort()).toEqual([
      "LA",
      "OA",
      "PA",
      "SA",
    ]);
    expect(connectionLayersFor("Generalization")).toEqual(["EPBS"]);
    expect(connectionLayersFor("DeploymentLink")).toEqual(["PA"]);
  });

  it("no longer models function → component allocation as an exchange", () => {
    const mislabelled = CONNECTION_RULES.filter(
      (r) =>
        ["FunctionalExchange", "LogicalExchange", "PhysicalExchange"].includes(
          r.relationshipType,
        ) && r.allowedSources.some((s) => s.endsWith("Function")),
    );
    for (const rule of mislabelled) {
      expect(rule.allowedTargets.some((t) => t.endsWith("Component"))).toBe(
        false,
      );
    }
  });

  it("does not offer composition in any architecture layer (Capella removes Composition edge)", () => {
    expect(connectionLayersFor("Composition")).toEqual([]);
    expect(connectionLayersFor("Generalization")).toEqual(["EPBS"]);
  });

  it("supports interaction and functional exchanges across architecture layers", () => {
    expect(connectionLayersFor("OperationalExchange")).toEqual(["OA"]);
    expect(connectionLayersFor("CommunicationMean")).toEqual(["OA"]);
    expect(connectionLayersFor("FunctionalExchange")).toEqual([
      "OA",
      "SA",
      "LA",
      "PA",
    ]);
    expect(connectionLayersFor("LogicalExchange")).toEqual(["LA"]);
    expect(connectionLayersFor("PhysicalExchange")).toEqual(["PA"]);
  });

  it("offers allocation for every architecture layer", () => {
    expect(connectionLayersFor("Allocation")).toEqual(
      expect.arrayContaining(["OA", "SA", "LA", "PA"]),
    );
  });

  it("permits actor interactions only through the layer's exchange type", () => {
    const actorPairs = CONNECTION_RULES.filter(
      (rule) =>
        rule.allowedSources.some((source) => source.endsWith("Actor")) &&
        rule.allowedTargets.some((target) => target.endsWith("Actor")),
    );
    expect(
      actorPairs.map((rule) => [rule.layer.value, rule.relationshipType]),
    ).toEqual([
      ["OA", "CommunicationMean"],
      ["SA", "ComponentExchange"],
      ["LA", "ComponentExchange"],
      ["PA", "ComponentExchange"],
    ]);
  });
});

describe("trace rules", () => {
  it("only reference trace types that exist in the registry", () => {
    for (const rule of TRACE_RULES) {
      expect(TRACE_VALUES).toContain(rule.type);
      expect(rule.sourceLayer).toBeInstanceOf(Layer);
      expect(rule.targetLayer).toBeInstanceOf(Layer);
      expect(rule.descriptionFa.length).toBeGreaterThan(0);
    }
  });

  it("are strictly cross-layer — no intra-layer trace links", () => {
    for (const rule of TRACE_RULES) {
      expect(
        rule.sourceLayer.equals(rule.targetLayer),
        `${rule.type} ${rule.sourceLayer}→${rule.targetLayer} must be cross-layer`,
      ).toBe(false);
    }
  });

  it("point from the concrete layer to the abstract one", () => {
    for (const rule of TRACE_RULES) {
      expect(rule.targetLayer.isHigherAbstractionThan(rule.sourceLayer)).toBe(
        true,
      );
    }
  });

  it("contains no allocation, deployment or involvement rules", () => {
    const types = TRACE_RULES.map((r) => r.type);
    expect(types).not.toContain("Allocation");
    expect(types).not.toContain("Deployment");
    expect(types).not.toContain("Involvement");
    expect(types).not.toContain("Owned");
    expect(new Set(types)).toEqual(new Set(["Realization"]));
  });
});
