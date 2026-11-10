import { describe, expect, it } from "vitest";
import type { Element } from "../types/element";
import { buildArchEdges, buildArchNodes } from "./arch-canvas";

const relationships = [
  {
    id: "exchange-1",
    name: "First",
    type: "FunctionalExchange",
    sourceElementId: "a",
    targetElementId: "b",
  },
  {
    id: "exchange-2",
    name: "Second",
    type: "FunctionalExchange",
    sourceElementId: "a",
    targetElementId: "b",
  },
];
const nodes = new Set(["a", "b"]);

describe("buildArchNodes", () => {
  it("renders an operational actor and its parent as separate OEBD tree nodes", () => {
    const now = "2026-01-01T00:00:00.000Z";
    const elements: Element[] = [
      {
        id: "crew",
        modelId: "model",
        type: "OperationalEntity",
        name: "Crew",
        status: "DRAFT",
        parentId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cabin",
        modelId: "model",
        type: "OperationalActor",
        name: "Cabin Crew",
        status: "DRAFT",
        parentId: "crew",
        createdAt: now,
        updatedAt: now,
      },
    ];
    const layouts = [
      {
        elementId: "crew",
        position: { x: 100, y: 100 },
        size: { width: 240, height: 170 },
      },
      {
        elementId: "cabin",
        position: { x: 140, y: 150 },
        size: { width: 160, height: 60 },
      },
    ];
    const diagramNodes = buildArchNodes(elements, layouts, "model", "OEBD");
    expect(diagramNodes.find((node) => node.id === "cabin")).toMatchObject({
      position: { x: 140, y: 150 },
    });
    expect(
      diagramNodes.find((node) => node.id === "cabin")?.parentId,
    ).toBeUndefined();
    const hierarchy = buildArchEdges(
      [],
      new Set(["crew", "cabin"]),
      "model",
      "OEBD",
      elements,
      [],
    );
    expect(hierarchy).toMatchObject([
      {
        source: "cabin",
        target: "crew",
        deletable: false,
        data: { hierarchy: true, hierarchyArrow: true },
      },
    ]);
  });
});

describe("buildArchEdges", () => {
  it("shows a communication mean in OAB and OCB, but not OEBD", () => {
    const communication = [
      {
        id: "mean",
        name: "Crew-Aircraft network",
        type: "CommunicationMean",
        sourceElementId: "a",
        targetElementId: "b",
      },
    ];
    expect(buildArchEdges(communication, nodes, "model", "OAB")).toHaveLength(
      1,
    );
    expect(buildArchEdges(communication, nodes, "model", "OCB")).toHaveLength(
      1,
    );
    expect(buildArchEdges(communication, nodes, "model", "OEBD")).toHaveLength(
      0,
    );
  });

  it("shows only relationships selected for this diagram", () => {
    expect(
      buildArchEdges(
        relationships,
        nodes,
        "model",
        "OAIB",
        [],
        ["exchange-2"],
      ).map((edge) => edge.id),
    ).toEqual(["exchange-2"]);
    expect(
      buildArchEdges(relationships, nodes, "model", "OAIB", [], []).map(
        (edge) => edge.id,
      ),
    ).toEqual([]);
  });

  it("keeps automatic visibility for diagrams created before the membership field", () => {
    expect(
      buildArchEdges(relationships, nodes, "model", "OAIB", [], null).map(
        (edge) => edge.id,
      ),
    ).toEqual(["exchange-1", "exchange-2"]);
  });

  it("draws hierarchy from containment even with no selected relationships", () => {
    const edges = buildArchEdges(
      [],
      nodes,
      "model",
      "OABD",
      [{ id: "a" }, { id: "b", parentId: "a" }],
      [],
    );
    expect(edges).toHaveLength(1);
    expect(edges[0]?.data?.hierarchy).toBe(true);
  });
});
