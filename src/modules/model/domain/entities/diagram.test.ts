import { describe, expect, it } from "vitest";
import { Diagram } from "./diagram";

type CreateProps = Partial<Parameters<typeof Diagram.create>[0]>;
type ReconstituteProps = Parameters<typeof Diagram.reconstitute>[0];

const createProps = (overrides: CreateProps = {}) => ({
  id: "diagram-1",
  modelId: "model-1",
  type: "LAB",
  name: "Logical View",
  ...overrides,
});

const reconstitutable = (
  overrides: Partial<ReconstituteProps> = {},
): ReconstituteProps => ({
  id: "diagram-1",
  modelId: "model-1",
  type: "LAB",
  name: "Logical View",
  description: "overview",
  viewport: { x: 10, y: 20, zoom: 2 },
  elementLayouts: [
    {
      elementId: "element-1",
      position: { x: 100, y: 200 },
      size: { width: 120, height: 60 },
    },
    {
      elementId: "element-2",
      position: { x: 300, y: 400 },
      size: { width: 160, height: 60 },
    },
  ],
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-02T00:00:00.000Z",
  ...overrides,
});

describe("Diagram.create", () => {
  it("builds a diagram with the default viewport and no layouts", () => {
    const diagram = Diagram.create(createProps());

    expect(diagram.id).toBe("diagram-1");
    expect(diagram.modelId).toBe("model-1");
    expect(diagram.type.value).toBe("LAB");
    expect(diagram.name).toBe("Logical View");
    expect(diagram.description).toBe("");
    expect(diagram.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(diagram.elementLayouts).toEqual([]);
    expect(diagram.visibleRelationshipIds).toEqual([]);
    expect(diagram.createdAt).toBeInstanceOf(Date);
    expect(diagram.updatedAt).toBeInstanceOf(Date);
  });

  it("trims the name and keeps the description", () => {
    const diagram = Diagram.create(
      createProps({ name: "  Logical View  ", description: "overview" }),
    );

    expect(diagram.name).toBe("Logical View");
    expect(diagram.description).toBe("overview");
  });

  it("rejects a blank name and an unknown diagram type", () => {
    expect(() => Diagram.create(createProps({ name: "   " }))).toThrow(
      "Diagram name is required",
    );
    expect(() => Diagram.create(createProps({ type: "NOPE" }))).toThrow(
      "Diagram type is invalid : NOPE",
    );
  });
});

describe("Diagram.reconstitute", () => {
  it("restores the viewport and the element layouts", () => {
    const diagram = Diagram.reconstitute(reconstitutable());

    expect(diagram.id).toBe("diagram-1");
    expect(diagram.modelId).toBe("model-1");
    expect(diagram.type.value).toBe("LAB");
    expect(diagram.name).toBe("Logical View");
    expect(diagram.description).toBe("overview");
    expect(diagram.viewport).toEqual({ x: 10, y: 20, zoom: 2 });
    expect(diagram.elementLayouts).toHaveLength(2);
    expect(diagram.visibleRelationshipIds).toBeNull();
    expect(diagram.hasElement("element-1")).toBe(true);
    expect(diagram.getElementLayout("element-2")?.position).toEqual({
      x: 300,
      y: 400,
    });
    expect(diagram.createdAt.toISOString()).toBe("2020-01-01T00:00:00.000Z");
    expect(diagram.updatedAt.toISOString()).toBe("2020-01-02T00:00:00.000Z");
  });

  it("round-trips through toJSON", () => {
    const json = Diagram.reconstitute(reconstitutable()).toJSON();
    const restored = Diagram.reconstitute({
      ...json,
      description: json.description ?? "",
    });

    expect(restored.toJSON()).toEqual(json);
  });
});

describe("Diagram.setVisibleRelationships", () => {
  it("stores unique relationship IDs for this view", () => {
    const diagram = Diagram.create(createProps());
    diagram.setVisibleRelationships(["exchange-1", "exchange-1", "exchange-2"]);
    expect(diagram.visibleRelationshipIds).toEqual([
      "exchange-1",
      "exchange-2",
    ]);
    expect(diagram.toJSON().visibleRelationshipIds).toEqual([
      "exchange-1",
      "exchange-2",
    ]);
  });
});

describe("Diagram.rename", () => {
  it("trims the new name and refreshes updatedAt", () => {
    const diagram = Diagram.reconstitute(reconstitutable());

    diagram.rename("  Architecture  ");

    expect(diagram.name).toBe("Architecture");
    expect(diagram.updatedAt.getTime()).toBeGreaterThan(
      Date.parse("2021-01-01T00:00:00.000Z"),
    );
  });

  it("refuses a blank name", () => {
    const diagram = Diagram.create(createProps());

    expect(() => diagram.rename("   ")).toThrow("Diagram name can't empty");
    expect(diagram.name).toBe("Logical View");
  });
});

describe("Diagram.updateDescription", () => {
  it("stores the description and can clear it", () => {
    const diagram = Diagram.create(createProps());

    diagram.updateDescription("first");
    expect(diagram.description).toBe("first");

    diagram.updateDescription(undefined);
    expect(diagram.description).toBeUndefined();
  });
});

describe("Diagram.updateViewport", () => {
  it("copies the viewport so later mutation cannot leak in", () => {
    const diagram = Diagram.create(createProps());
    const viewport = { x: 5, y: 6, zoom: 1.5 };

    diagram.updateViewport(viewport);
    viewport.zoom = 99;

    expect(diagram.viewport).toEqual({ x: 5, y: 6, zoom: 1.5 });
  });
});

describe("Diagram.placeElement", () => {
  it("stores a layout with the default size when none is given", () => {
    const diagram = Diagram.create(createProps());

    diagram.placeElement("element-1", { x: 10, y: 20 });

    expect(diagram.hasElement("element-1")).toBe(true);
    expect(diagram.getElementLayout("element-1")).toEqual({
      elementId: "element-1",
      position: { x: 10, y: 20 },
      size: { width: 160, height: 60 },
    });
    expect(diagram.getElementLayout("missing")).toBeNull();
    expect(diagram.hasElement("missing")).toBe(false);
  });

  it("keeps an explicit size", () => {
    const diagram = Diagram.create(createProps());

    diagram.placeElement(
      "element-1",
      { x: 1, y: 2 },
      { width: 40, height: 30 },
    );

    expect(diagram.getElementLayout("element-1")?.size).toEqual({
      width: 40,
      height: 30,
    });
  });
});

describe("Diagram.moveElement", () => {
  it("repositions a placed element and keeps its size", () => {
    const diagram = Diagram.reconstitute(reconstitutable());

    diagram.moveElement("element-1", { x: 30, y: 40 });

    expect(diagram.getElementLayout("element-1")?.position).toEqual({
      x: 30,
      y: 40,
    });
    expect(diagram.getElementLayout("element-1")?.size).toEqual({
      width: 120,
      height: 60,
    });
    expect(diagram.updatedAt.getTime()).toBeGreaterThan(
      Date.parse("2021-01-01T00:00:00.000Z"),
    );
  });

  it("refuses to move an element that was never placed", () => {
    const diagram = Diagram.create(createProps());

    expect(() => diagram.moveElement("element-9", { x: 1, y: 1 })).toThrow(
      "Element element-9 does't exist in diagram.",
    );
    expect(diagram.elementLayouts).toHaveLength(0);
  });
});

describe("Diagram.removeElementLayout", () => {
  it("drops the layout without touching the other elements", () => {
    const diagram = Diagram.reconstitute(reconstitutable());

    diagram.removeElementLayout("element-1");

    expect(diagram.hasElement("element-1")).toBe(false);
    expect(diagram.getElementLayout("element-1")).toBeNull();
    expect(diagram.elementLayouts).toHaveLength(1);
    expect(diagram.hasElement("element-2")).toBe(true);
  });
});

describe("Diagram.equals", () => {
  it("compares on id", () => {
    const diagram = Diagram.create(createProps());
    const sameId = Diagram.create(createProps({ name: "Other" }));
    const otherId = Diagram.create(createProps({ id: "diagram-2" }));

    expect(diagram.equals(sameId)).toBe(true);
    expect(diagram.equals(otherId)).toBe(false);
  });
});
