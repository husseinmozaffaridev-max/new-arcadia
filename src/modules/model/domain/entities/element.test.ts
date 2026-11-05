import { describe, expect, it } from "vitest";
import { ModelElement } from "./element";

type CreateProps = Partial<Parameters<typeof ModelElement.create>[0]>;
type ReconstituteProps = Parameters<typeof ModelElement.reconstitute>[0];

const createProps = (overrides: CreateProps = {}) => ({
  id: "element-1",
  modelId: "model-1",
  layer: "LA",
  type: "LogicalComponent",
  name: "Order",
  ...overrides,
});

const reconstitutable = (
  overrides: Partial<ReconstituteProps> = {},
): ReconstituteProps => ({
  id: "element-1",
  modelId: "model-1",
  layer: "LA",
  type: "LogicalComponent",
  name: "Order",
  description: "an order",
  properties: { status: "VALIDATED", stereotype: "entity" },
  parentId: "parent-1",
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-02T00:00:00.000Z",
  ...overrides,
});

describe("ModelElement.create", () => {
  it("builds a draft root element with defaults", () => {
    const element = ModelElement.create(createProps());

    expect(element.id).toBe("element-1");
    expect(element.modelId).toBe("model-1");
    expect(element.layer.value).toBe("LA");
    expect(element.type.value).toBe("LogicalComponent");
    expect(element.name).toBe("Order");
    expect(element.description).toBe("");
    expect(element.properties).toEqual({ status: "DRAFT" });
    expect(element.status).toBe("DRAFT");
    expect(element.parentId).toBeNull();
    expect(element.isRoot()).toBe(true);
    expect(element.createdAt).toBeInstanceOf(Date);
    expect(element.updatedAt).toBeInstanceOf(Date);
  });

  it("trims the name and applies the provided metadata", () => {
    const element = ModelElement.create(
      createProps({
        name: "  Invoice  ",
        description: "a bill",
        properties: { stereotype: "entity", availableInModes: ["m1"] },
        parentId: "parent-1",
      }),
    );

    expect(element.name).toBe("Invoice");
    expect(element.description).toBe("a bill");
    expect(element.properties).toEqual({
      status: "DRAFT",
      stereotype: "entity",
      availableInModes: ["m1"],
    });
    expect(element.parentId).toBe("parent-1");
    expect(element.isRoot()).toBe(false);
  });

  it("honours a status coming from the properties", () => {
    const element = ModelElement.create(
      createProps({ properties: { status: "VALIDATED" } }),
    );

    expect(element.status).toBe("VALIDATED");
    expect(element.isValidated()).toBe(true);
  });

  it("rejects blank names, unknown value objects and a mismatched layer", () => {
    expect(() => ModelElement.create(createProps({ name: "   " }))).toThrow(
      "Element name is required",
    );
    expect(() => ModelElement.create(createProps({ type: "Nope" }))).toThrow(
      "Element type is invalid: Nope",
    );
    expect(() => ModelElement.create(createProps({ layer: "XX" }))).toThrow(
      "Invalid layer value : XX",
    );
    expect(() => ModelElement.create(createProps({ layer: "SA" }))).toThrow(
      'Element type "Logical Component" does not belong to layer "System Analysis"',
    );
  });

  it("rejects creating an Actor with a parentId (actors cannot be decomposed)", () => {
    expect(() =>
      ModelElement.create(
        createProps({
          type: "LogicalActor",
          layer: "LA",
          parentId: "parent-1",
        }),
      ),
    ).toThrow("Actors cannot be decomposed or nested inside other elements");
  });
});

describe("ModelElement.reconstitute", () => {
  it("restores every persisted field", () => {
    const element = ModelElement.reconstitute(reconstitutable());

    expect(element.id).toBe("element-1");
    expect(element.modelId).toBe("model-1");
    expect(element.layer.value).toBe("LA");
    expect(element.type.value).toBe("LogicalComponent");
    expect(element.name).toBe("Order");
    expect(element.description).toBe("an order");
    expect(element.properties).toEqual({
      status: "VALIDATED",
      stereotype: "entity",
    });
    expect(element.status).toBe("VALIDATED");
    expect(element.parentId).toBe("parent-1");
    expect(element.isRoot()).toBe(false);
    expect(element.createdAt.toISOString()).toBe("2020-01-01T00:00:00.000Z");
    expect(element.updatedAt.toISOString()).toBe("2020-01-02T00:00:00.000Z");
  });

  it("round-trips through toJSON", () => {
    const json = ModelElement.reconstitute(reconstitutable()).toJSON();
    const restored = ModelElement.reconstitute({
      ...json,
      description: json.description ?? "",
    });

    expect(restored.toJSON()).toEqual(json);
  });
});

describe("ModelElement.rename", () => {
  it("trims the new name and refreshes updatedAt", () => {
    const element = ModelElement.reconstitute(reconstitutable());

    element.rename("  Invoice  ");

    expect(element.name).toBe("Invoice");
    expect(element.updatedAt.getTime()).toBeGreaterThan(
      Date.parse("2021-01-01T00:00:00.000Z"),
    );
  });

  it("refuses a blank name", () => {
    const element = ModelElement.create(createProps());

    expect(() => element.rename("   ")).toThrow("Element name can't be empty");
    expect(element.name).toBe("Order");
  });
});

describe("ModelElement.updateDescription", () => {
  it("stores the description and can clear it", () => {
    const element = ModelElement.create(createProps());

    element.updateDescription("a bill");
    expect(element.description).toBe("a bill");

    element.updateDescription(undefined);
    expect(element.description).toBeUndefined();
  });
});

describe("ModelElement.validate", () => {
  it("moves a draft element to validated and keeps the other properties", () => {
    const element = ModelElement.create(
      createProps({ properties: { stereotype: "entity" } }),
    );

    element.validate();

    expect(element.status).toBe("VALIDATED");
    expect(element.properties).toEqual({
      status: "VALIDATED",
      stereotype: "entity",
    });
  });

  it("refuses to validate a deprecated element", () => {
    const element = ModelElement.create(createProps());

    element.deprecate();

    expect(element.status).toBe("DEPRECATED");
    expect(element.isDeprecated()).toBe(true);
    expect(element.isValidated()).toBe(false);
    expect(() => element.validate()).toThrow(
      "Cannot validate a deprecated element",
    );
    expect(element.status).toBe("DEPRECATED");
  });
});

describe("ModelElement.updateProperties", () => {
  it("merges the partial properties", () => {
    const element = ModelElement.create(
      createProps({ properties: { stereotype: "entity" } }),
    );

    element.updateProperties({ portDirection: "OUT" });

    expect(element.properties).toEqual({
      status: "DRAFT",
      stereotype: "entity",
      portDirection: "OUT",
    });
  });
});

describe("ModelElement.setAvailableInModes", () => {
  it("stores the mode ids", () => {
    const element = ModelElement.create(createProps());

    element.setAvailableInModes(["design", "review"]);

    expect(element.properties.availableInModes).toEqual(["design", "review"]);
  });
});

describe("ModelElement.equals", () => {
  it("compares on id", () => {
    const element = ModelElement.create(createProps());
    const sameId = ModelElement.create(createProps({ name: "Other" }));
    const otherId = ModelElement.create(createProps({ id: "element-2" }));

    expect(element.equals(sameId)).toBe(true);
    expect(element.equals(otherId)).toBe(false);
  });
});
