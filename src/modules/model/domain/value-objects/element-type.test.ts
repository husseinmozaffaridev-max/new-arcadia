import { describe, expect, it } from "vitest";
import {
  ElementType,
  type ElementTypeCategory,
  type ElementTypeValue,
} from "./element-type";
import { Layer } from "./layer";

const CATEGORIES: ElementTypeCategory[] = [
  "mission",
  "actor",
  "entity",
  "system",
  "component",
  "function",
  "capability",
  "process",
  "port",
  "node",
  "configuration-item",
  "architecture",
];

describe("ElementType metadata", () => {
  it("describes every type with label, labelFa, layer and category", () => {
    for (const type of ElementType.all()) {
      expect(type.label.length).toBeGreaterThan(0);
      expect(type.labelFa.length).toBeGreaterThan(0);
      expect(CATEGORIES).toContain(type.category);
      expect(type.layer).toBeInstanceOf(Layer);
    }
  });

  it("groups types per layer", () => {
    const count = (layer: Layer) => ElementType.allForLayer(layer).length;
    expect(count(Layer.OA)).toBe(6);
    expect(count(Layer.SA)).toBe(7);
    expect(count(Layer.LA)).toBe(4);
    expect(count(Layer.PA)).toBe(4);
    expect(count(Layer.EPBS)).toBe(4);
  });

  it("scopes FunctionPort to the system layer only", () => {
    const port = ElementType.from("FunctionPort");
    expect(port.layer).toBe(Layer.SA);
    expect(ElementType.allForLayer(Layer.LA).map((t) => t.value)).not.toContain(
      "FunctionPort",
    );
    expect(ElementType.allForLayer(Layer.PA).map((t) => t.value)).not.toContain(
      "FunctionPort",
    );
    expect(port.isPort()).toBe(true);
  });

  it("does not treat operational entities as actors", () => {
    expect(ElementType.from("OperationalEntity").isActor()).toBe(false);
    expect(ElementType.from("OperationalEntity").isEntity()).toBe(true);

    const actors: ElementTypeValue[] = [
      "OperationalActor",
      "SystemActor",
      "LogicalActor",
      "PhysicalActor",
    ];
    for (const actor of actors) {
      expect(ElementType.from(actor).isActor()).toBe(true);
      expect(ElementType.from(actor).category).toBe("actor");
    }
  });

  it("classifies activities and functions under the function category", () => {
    const functions: ElementTypeValue[] = [
      "OperationalActivity",
      "SystemFunction",
      "LogicalFunction",
      "PhysicalFunction",
    ];
    for (const fn of functions) {
      expect(ElementType.from(fn).isFunction()).toBe(true);
      expect(ElementType.from(fn).category).toBe("function");
    }
  });

  it("classifies all component flavours under the component category", () => {
    for (const component of [
      "SystemComponent",
      "LogicalComponent",
      "PhysicalComponent",
    ] as ElementTypeValue[]) {
      expect(ElementType.from(component).isComponent()).toBe(true);
    }
    expect(ElementType.from("System").isSystem()).toBe(true);
    expect(ElementType.from("PhysicalNode").isNode()).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(() => ElementType.from("Widget")).toThrow();
    expect(ElementType.tryFrom("Widget")).toBeNull();
    expect(ElementType.tryFrom("System")?.value).toBe("System");
  });
});
