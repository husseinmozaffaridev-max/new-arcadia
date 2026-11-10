import { describe, expect, it, vi } from "vitest";
import { Diagram } from "../../domain/entities/diagram";
import { UpdateDiagramLayoutDTO } from "../../presentation/dtos/update-diagram-layout";
import type { IDiagramRepository } from "../ports/diagram";
import { UpdateDiagramLayoutUseCase } from "./update-diagram-layout";

describe("UpdateDiagramLayoutDTO", () => {
  it("preserves empty layout and relationship lists to clear a view", () => {
    const dto = UpdateDiagramLayoutDTO.create({
      id: "diagram-1",
      elementLayouts: [],
      visibleRelationshipIds: [],
    });
    expect(dto.elementLayouts).toEqual([]);
    expect(dto.visibleRelationshipIds).toEqual([]);
  });
});

describe("UpdateDiagramLayoutUseCase", () => {
  it("replaces the current layouts and stores relationship membership", async () => {
    const diagram = Diagram.create({
      id: "diagram-1",
      modelId: "model-1",
      type: "LAB",
      name: "View",
    });
    diagram.placeElement("old", { x: 1, y: 2 });
    const updateLayout = vi.fn(async (payload) => {
      expect(payload.elementLayouts).toEqual([]);
      expect(payload.viewport.visibleRelationshipIds).toEqual(["exchange-1"]);
      return diagram;
    });
    const repository = {
      findById: vi.fn(async () => diagram),
      updateLayout,
    } as unknown as IDiagramRepository;
    const useCase = new UpdateDiagramLayoutUseCase(repository);
    await useCase.execute({
      payload: {
        id: "diagram-1",
        elementLayouts: [],
        visibleRelationshipIds: ["exchange-1"],
      },
      context: { token: "token" },
    });
    expect(updateLayout).toHaveBeenCalledOnce();
  });
});
