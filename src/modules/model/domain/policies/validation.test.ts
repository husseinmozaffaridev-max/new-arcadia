import { describe, expect, it } from "vitest";
import { type ValidationIssue, ValidationPolicy } from "./validation";

type Context = Parameters<typeof ValidationPolicy.validate>[0];
type Element = Context["elements"][number];
type TraceLink = Context["traceLinks"][number];
type Relationship = Context["relationships"][number];

const element = (over: Partial<Element> = {}): Element => ({
  id: "e1",
  modelId: "model-1",
  layer: "SA",
  type: "System",
  name: "System A",
  parentId: null,
  status: "Validated",
  properties: {},
  ...over,
});

const trace = (over: Partial<TraceLink> = {}): TraceLink => ({
  id: "trace-1",
  sourceElementId: "e1",
  targetElementId: "e2",
  sourceLayer: "LA",
  targetLayer: "SA",
  type: "Realization",
  ...over,
});

const relationship = (over: Partial<Relationship> = {}): Relationship => ({
  id: "rel-1",
  sourceElementId: "e1",
  targetElementId: "e2",
  type: "ComponentExchange",
  ...over,
});

const validate = (over: Partial<Context> = {}) =>
  ValidationPolicy.validate({
    elements: [],
    traceLinks: [],
    relationships: [],
    ...over,
  });

const rulesOf = (issues: ValidationIssue[]) => issues.map((i) => i.rule);

describe("ValidationPolicy", () => {
  it("reports nothing for an empty model", () => {
    expect(validate()).toEqual([]);
  });

  it("reports nothing for a fully connected, correctly named model", () => {
    const issues = validate({
      elements: [
        element({ id: "sys", name: "System A" }),
        element({
          id: "bus",
          name: "Bus",
          type: "SystemComponent",
        }),
      ],
      relationships: [
        relationship({
          sourceElementId: "sys",
          targetElementId: "bus",
        }),
      ],
    });

    expect(issues).toEqual([]);
  });

  it("numbers issues uniquely and stamps the layer", () => {
    const issues = validate({
      elements: [
        element({ id: "a", name: "   " }),
        element({ id: "b", name: "dup" }),
        element({ id: "c", name: "dup" }),
      ],
    });

    expect(issues.length).toBeGreaterThanOrEqual(3);
    expect(new Set(issues.map((i) => i.id)).size).toBe(issues.length);
    expect(issues.map((i) => i.id)).toEqual(
      issues.map((_, index) => `val-${index + 1}`),
    );
    for (const issue of issues) {
      expect(issue.layer).toBe("SA");
    }
  });

  describe("rule 1 · orphan-element", () => {
    it("flags a root element with no relationships or traces", () => {
      const issues = validate({ elements: [element()] });

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        severity: "warning",
        rule: "orphan-element",
        elementId: "e1",
        elementName: "System A",
        elementType: "System",
      });
    });

    it("stays quiet once the element is connected", () => {
      expect(
        rulesOf(
          validate({
            elements: [element(), element({ id: "e2" })],
            relationships: [relationship()],
          }),
        ),
      ).not.toContain("orphan-element");

      expect(
        rulesOf(
          validate({
            elements: [element(), element({ id: "e2" })],
            traceLinks: [trace()],
          }),
        ),
      ).not.toContain("orphan-element");

      expect(
        rulesOf(validate({ elements: [element({ parentId: "parent" })] })),
      ).not.toContain("orphan-element");
    });
  });

  describe("rule 2 · empty-name", () => {
    it("rejects blank names", () => {
      const issues = validate({ elements: [element({ name: "   " })] });
      const issue = issues.find((i) => i.rule === "empty-name");

      expect(issue).toMatchObject({
        severity: "error",
        message: "Name cannot be empty",
        elementId: "e1",
      });
    });

    it("accepts a trimmed name", () => {
      expect(
        rulesOf(validate({ elements: [element({ name: "  System A  " })] })),
      ).not.toContain("empty-name");
    });
  });

  describe("rule 3 · trace links", () => {
    const linked = {
      elements: [
        element({ id: "sa", layer: "SA", type: "System" }),
        element({ id: "la", layer: "LA", type: "LogicalComponent" }),
        element({ id: "pa", layer: "PA", type: "PhysicalComponent" }),
      ],
    };

    it("flags a trace pointing at a missing element", () => {
      const issues = validate({
        ...linked,
        traceLinks: [
          trace({
            sourceElementId: "la",
            targetElementId: "ghost",
            sourceLayer: "LA",
            targetLayer: "SA",
          }),
        ],
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          rule: "dangling-trace",
          message: "References missing element",
        }),
      );
    });

    it("accepts a realization going from concrete to abstract", () => {
      const issues = validate({
        ...linked,
        traceLinks: [
          trace({
            sourceElementId: "la",
            targetElementId: "sa",
            sourceLayer: "LA",
            targetLayer: "SA",
          }),
        ],
      });

      expect(rulesOf(issues)).not.toContain("realization-direction");
      expect(rulesOf(issues)).not.toContain("non-adjacent-realization");
    });

    it("rejects a realization that points the wrong way", () => {
      const issues = validate({
        ...linked,
        traceLinks: [
          trace({
            sourceElementId: "sa",
            targetElementId: "la",
            sourceLayer: "SA",
            targetLayer: "LA",
          }),
        ],
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          rule: "realization-direction",
          elementId: "sa",
        }),
      );
      expect(rulesOf(issues)).not.toContain("non-adjacent-realization");
    });

    it("warns when a realization skips a layer", () => {
      const issues = validate({
        ...linked,
        traceLinks: [
          trace({
            sourceElementId: "pa",
            targetElementId: "sa",
            sourceLayer: "PA",
            targetLayer: "SA",
          }),
        ],
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          rule: "non-adjacent-realization",
          elementId: "pa",
        }),
      );
      expect(rulesOf(issues)).not.toContain("realization-direction");
    });
  });

  describe("rule 4 · layer completeness", () => {
    it("notes a System Analysis layer without a System", () => {
      const issues = validate({
        elements: [element({ id: "bus", type: "SystemComponent" })],
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "info",
          rule: "missing-system",
          layer: "SA",
        }),
      );
    });

    it("stays quiet when the System exists or the layer is unused", () => {
      expect(
        rulesOf(validate({ elements: [element({ id: "sys" })] })),
      ).not.toContain("missing-system");
      expect(
        rulesOf(validate({ elements: [element({ layer: "LA" })] })),
      ).not.toContain("missing-system");
    });
  });

  describe("rules 4b–4g · EPBS completeness", () => {
    const epbsElement = (over: Partial<Element> = {}) =>
      element({
        layer: "EPBS",
        type: "ConfigurationItem",
        ...over,
      });

    it("reports a layer missing its architecture and configuration items", () => {
      const issues = validate({
        elements: [
          epbsElement({ id: "iface", type: "ConfigurationItemInterface" }),
        ],
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          rule: "missing-epbs-architecture",
          severity: "info",
        }),
      );
      expect(issues).toContainEqual(
        expect.objectContaining({
          rule: "missing-configuration-item",
          severity: "warning",
        }),
      );
      expect(issues).toContainEqual(
        expect.objectContaining({
          rule: "interface-missing-connection",
          severity: "warning",
        }),
      );
    });

    it("requires a kind on every configuration item", () => {
      const withoutKind = validate({
        elements: [
          epbsElement({ id: "arch", type: "EPBSArchitecture", name: "EPBS" }),
          epbsElement({ id: "ci", name: "CI" }),
        ],
        relationships: [
          relationship({
            sourceElementId: "arch",
            targetElementId: "ci",
            type: "Composition",
          }),
        ],
      });

      expect(withoutKind).toContainEqual(
        expect.objectContaining({
          severity: "error",
          rule: "configuration-item-missing-kind",
          elementId: "ci",
        }),
      );

      const withKind = validate({
        elements: [
          epbsElement({ id: "arch", type: "EPBSArchitecture", name: "EPBS" }),
          epbsElement({
            id: "ci",
            name: "CI",
            properties: { configurationItemKind: "System" },
          }),
        ],
        relationships: [
          relationship({
            sourceElementId: "arch",
            targetElementId: "ci",
            type: "Composition",
          }),
        ],
      });

      expect(rulesOf(withKind)).not.toContain(
        "configuration-item-missing-kind",
      );
    });

    it("warns about a configuration item that realizes nothing", () => {
      const issues = validate({
        elements: [
          epbsElement({ id: "arch", type: "EPBSArchitecture", name: "EPBS" }),
          epbsElement({
            id: "ci",
            name: "CI",
            properties: { configurationItemKind: "System" },
          }),
          element({
            id: "pc",
            layer: "PA",
            type: "PhysicalComponent",
            name: "PC",
          }),
        ],
        relationships: [
          relationship({
            sourceElementId: "arch",
            targetElementId: "ci",
            type: "Composition",
          }),
        ],
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          rule: "unrealized-configuration-item",
          elementId: "ci",
        }),
      );
    });

    it("accepts a configuration item realized by a physical component", () => {
      const issues = validate({
        elements: [
          epbsElement({ id: "arch", type: "EPBSArchitecture", name: "EPBS" }),
          epbsElement({
            id: "ci",
            name: "CI",
            properties: { configurationItemKind: "System" },
          }),
          element({
            id: "pc",
            layer: "PA",
            type: "PhysicalComponent",
            name: "PC",
          }),
        ],
        relationships: [
          relationship({
            sourceElementId: "arch",
            targetElementId: "ci",
            type: "Composition",
          }),
        ],
        traceLinks: [
          trace({
            sourceElementId: "ci",
            targetElementId: "pc",
            sourceLayer: "EPBS",
            targetLayer: "PA",
            type: "Realization",
          }),
        ],
      });

      expect(rulesOf(issues)).not.toContain("unrealized-configuration-item");
      expect(issues).toEqual([]);
    });

    it("reports nothing for a complete EPBS model", () => {
      const issues = validate({
        elements: [
          epbsElement({ id: "arch", type: "EPBSArchitecture", name: "EPBS" }),
          epbsElement({
            id: "ci",
            name: "CI",
            properties: { configurationItemKind: "System" },
          }),
          epbsElement({
            id: "iface",
            type: "ConfigurationItemInterface",
            name: "Iface",
          }),
          element({
            id: "pc",
            layer: "PA",
            type: "PhysicalComponent",
            name: "PC",
          }),
        ],
        relationships: [
          relationship({
            sourceElementId: "arch",
            targetElementId: "ci",
            type: "Composition",
          }),
          relationship({
            sourceElementId: "iface",
            targetElementId: "ci",
            type: "ProvidedInterface",
          }),
        ],
        traceLinks: [
          trace({
            sourceElementId: "ci",
            targetElementId: "pc",
            sourceLayer: "EPBS",
            targetLayer: "PA",
            type: "Realization",
          }),
        ],
      });

      expect(issues).toEqual([]);
    });

    it("warns about a configuration item that is fully orphaned", () => {
      const issues = validate({
        elements: [
          epbsElement({ id: "arch", type: "EPBSArchitecture", name: "EPBS" }),
          epbsElement({
            id: "ci",
            name: "CI",
            properties: { configurationItemKind: "System" },
          }),
          epbsElement({
            id: "child",
            name: "Child",
            parentId: "ci",
            properties: { configurationItemKind: "Hardware" },
          }),
        ],
        relationships: [
          relationship({
            sourceElementId: "arch",
            targetElementId: "child",
            type: "Composition",
          }),
        ],
      });

      expect(rulesOf(issues)).not.toContain("orphan-configuration-item");

      const lonely = validate({
        elements: [
          epbsElement({ id: "arch", type: "EPBSArchitecture", name: "EPBS" }),
          epbsElement({
            id: "ci",
            name: "CI",
            properties: { configurationItemKind: "System" },
          }),
        ],
        relationships: [
          relationship({
            sourceElementId: "arch",
            targetElementId: "ci",
            type: "Composition",
          }),
          relationship({
            sourceElementId: "arch",
            targetElementId: "ci",
            type: "RequiredInterface",
          }),
        ],
      });

      expect(rulesOf(lonely)).toContain("orphan-configuration-item");
    });
  });

  describe("rule 5 · parent-child consistency", () => {
    it("flags a parent that does not exist", () => {
      const issues = validate({
        elements: [element({ parentId: "ghost" })],
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          rule: "missing-parent",
          elementId: "e1",
        }),
      );
    });

    it("flags a parent living in another layer", () => {
      const issues = validate({
        elements: [
          element({
            id: "parent",
            layer: "OA",
            type: "OperationalEntity",
            name: "Op",
          }),
          element({ id: "child", layer: "SA", parentId: "parent" }),
        ],
      });

      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          rule: "cross-layer-parent",
          elementId: "child",
          message: 'Parent "Op" is in a different layer',
        }),
      );
    });

    it("accepts a parent in the same layer", () => {
      const issues = validate({
        elements: [
          element({ id: "parent", name: "Parent" }),
          element({ id: "child", name: "Child", parentId: "parent" }),
        ],
      });

      expect(rulesOf(issues)).not.toContain("missing-parent");
      expect(rulesOf(issues)).not.toContain("cross-layer-parent");
    });

    it("flags an actor that has a parent (actors cannot be decomposed or nested)", () => {
      const issues = validate({
        elements: [
          element({
            id: "parent",
            name: "System Component",
            type: "SystemComponent",
          }),
          element({
            id: "actor",
            name: "Radar Operator",
            type: "SystemActor",
            parentId: "parent",
          }),
        ],
      });

      expect(rulesOf(issues)).toContain("actor-has-parent");
      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          rule: "actor-has-parent",
          elementId: "actor",
        }),
      );
    });

    it("flags an element whose parent is an actor (actors cannot be decomposed or contain child elements)", () => {
      const issues = validate({
        elements: [
          element({
            id: "actor",
            name: "Pilot",
            type: "SystemActor",
          }),
          element({
            id: "child",
            name: "Sub Component",
            type: "SystemComponent",
            parentId: "actor",
          }),
        ],
      });

      expect(rulesOf(issues)).toContain("actor-cannot-be-decomposed");
      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          rule: "actor-cannot-be-decomposed",
          elementId: "child",
        }),
      );
    });

    it("flags a relationship between two actors (actors cannot connect to other actors)", () => {
      const issues = validate({
        elements: [
          element({
            id: "actor1",
            name: "Pilot",
            type: "SystemActor",
          }),
          element({
            id: "actor2",
            name: "Co-Pilot",
            type: "SystemActor",
          }),
        ],
        relationships: [
          relationship({
            id: "rel1",
            sourceElementId: "actor1",
            targetElementId: "actor2",
            type: "SystemExchange",
          }),
        ],
      });

      expect(rulesOf(issues)).toContain("actor-connected-to-actor");
      expect(issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          rule: "actor-connected-to-actor",
          elementId: "actor1",
        }),
      );
    });
  });

  describe("rule 6 · duplicate names", () => {
    it("warns for every element sharing a name in one model and layer", () => {
      const issues = validate({
        elements: [
          element({ id: "a", name: "Controller" }),
          element({ id: "b", name: "controller" }),
          element({ id: "c", name: "Unique" }),
        ],
      });

      const duplicates = issues.filter((i) => i.rule === "duplicate-name");
      expect(duplicates).toHaveLength(2);
      expect(duplicates.map((i) => i.elementId).sort()).toEqual(["a", "b"]);
      expect(duplicates[0]).toMatchObject({
        severity: "warning",
        message: "Duplicate name in this layer",
      });
    });

    it("ignores the same name in another layer or another model", () => {
      expect(
        rulesOf(
          validate({
            elements: [
              element({ id: "a", name: "Controller" }),
              element({
                id: "b",
                name: "Controller",
                layer: "LA",
                type: "LogicalComponent",
              }),
            ],
          }),
        ),
      ).not.toContain("duplicate-name");

      expect(
        rulesOf(
          validate({
            elements: [
              element({ id: "a", name: "Controller" }),
              element({ id: "b", name: "Controller", modelId: "model-2" }),
            ],
          }),
        ),
      ).not.toContain("duplicate-name");
    });
  });
});
