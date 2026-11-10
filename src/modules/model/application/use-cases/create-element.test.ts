import { describe, expect, it, vi } from "vitest";
import { ModelElement } from "../../domain/entities/element";
import { Model } from "../../domain/entities/model";
import type { IElementRepository } from "../ports/element";
import type { IModelRepository } from "../ports/model";
import { CreateElementUseCase } from "./create-element";

describe("CreateElementUseCase operational containment", () => {
  const model = Model.create({
    id: "oa-model",
    projectId: "project",
    layer: "OA",
    name: "Operational Analysis",
  });
  const crew = ModelElement.create({
    id: "crew",
    modelId: "oa-model",
    layer: "OA",
    type: "OperationalEntity",
    name: "Crew",
  });

  it("creates Cabin Crew inside the Crew entity", async () => {
    const createElement = vi.fn(async (payload) =>
      ModelElement.create({ id: "cabin-crew", ...payload }),
    );
    const useCase = new CreateElementUseCase(
      {
        findModelById: vi.fn(async () => model),
      } as unknown as IModelRepository,
      {
        findElementById: vi.fn(async () => crew),
        findElementsByModelId: vi.fn(async () => [crew]),
        createElement,
      } as unknown as IElementRepository,
    );
    const result = await useCase.execute({
      payload: {
        modelId: "oa-model",
        layer: "OA",
        type: "OperationalActor",
        name: "Cabin Crew",
        parentId: "crew",
      },
      context: { token: "token" },
    });
    expect(result.parentId).toBe("crew");
    expect(createElement).toHaveBeenCalledOnce();
  });

  it("rejects a parent entity from another model", async () => {
    const foreignCrew = ModelElement.create({
      id: "foreign",
      modelId: "other-model",
      layer: "OA",
      type: "OperationalEntity",
      name: "Foreign Crew",
    });
    const createElement = vi.fn();
    const useCase = new CreateElementUseCase(
      {
        findModelById: vi.fn(async () => model),
      } as unknown as IModelRepository,
      {
        findElementById: vi.fn(async () => foreignCrew),
        createElement,
      } as unknown as IElementRepository,
    );
    await expect(
      useCase.execute({
        payload: {
          modelId: "oa-model",
          layer: "OA",
          type: "OperationalActor",
          name: "Cabin Crew",
          parentId: "foreign",
        },
        context: { token: "token" },
      }),
    ).rejects.toThrow("Parent element must be in the same model and layer");
    expect(createElement).not.toHaveBeenCalled();
  });

  it("requires an operational activity parent for activity decomposition", async () => {
    const createElement = vi.fn();
    const useCase = new CreateElementUseCase(
      {
        findModelById: vi.fn(async () => model),
      } as unknown as IModelRepository,
      {
        findElementById: vi.fn(async () => crew),
        createElement,
      } as unknown as IElementRepository,
    );
    await expect(
      useCase.execute({
        payload: {
          modelId: "oa-model",
          layer: "OA",
          type: "OperationalActivity",
          name: "New Activity",
          parentId: "crew",
        },
        context: { token: "token" },
      }),
    ).rejects.toThrow(
      "An operational activity can only be contained by another operational activity",
    );
    expect(createElement).not.toHaveBeenCalled();
  });
});
