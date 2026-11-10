import { describe, expect, it, vi } from "vitest";
import { ModelElement } from "../../domain/entities/element";
import type { IElementRepository } from "../ports/element";
import { UpdateElementUseCase } from "./update-element";

describe("UpdateElementUseCase operational containment", () => {
  it("moves a new operational activity under Use Entertainment Services", async () => {
    const child = ModelElement.create({
      id: "new",
      modelId: "oa-model",
      layer: "OA",
      type: "OperationalActivity",
      name: "Operational Activity 1",
    });
    const parent = ModelElement.create({
      id: "entertainment",
      modelId: "oa-model",
      layer: "OA",
      type: "OperationalActivity",
      name: "Use Entertainment Services",
    });
    const updateElement = vi.fn(async (payload) =>
      ModelElement.create({
        id: child.id,
        modelId: child.modelId,
        layer: "OA",
        type: child.type.value,
        name: payload.name,
        parentId: payload.parentId,
      }),
    );
    const useCase = new UpdateElementUseCase({
      findElementById: vi.fn(async ({ id }) =>
        id === parent.id ? parent : child,
      ),
      findElementsByModelId: vi.fn(async () => [parent, child]),
      updateElement,
    } as unknown as IElementRepository);
    const result = await useCase.execute({
      payload: { id: child.id, name: child.name, parentId: parent.id },
      context: { token: "token" },
    });
    expect(result.parentId).toBe(parent.id);
    expect(updateElement).toHaveBeenCalledOnce();
  });

  it("rejects putting a parent activity under its child", async () => {
    const parent = ModelElement.create({
      id: "parent",
      modelId: "oa-model",
      layer: "OA",
      type: "OperationalActivity",
      name: "Parent",
    });
    const child = ModelElement.create({
      id: "child",
      modelId: "oa-model",
      layer: "OA",
      type: "OperationalActivity",
      name: "Child",
      parentId: parent.id,
    });
    const updateElement = vi.fn();
    const useCase = new UpdateElementUseCase({
      findElementById: vi.fn(async ({ id }) =>
        id === parent.id ? parent : child,
      ),
      findElementsByModelId: vi.fn(async () => [parent, child]),
      updateElement,
    } as unknown as IElementRepository);
    await expect(
      useCase.execute({
        payload: { id: parent.id, name: parent.name, parentId: child.id },
        context: { token: "token" },
      }),
    ).rejects.toThrow("An element cannot be placed inside its descendant");
    expect(updateElement).not.toHaveBeenCalled();
  });

  it("places an existing Cabin Crew actor under a Crew entity", async () => {
    const actor = ModelElement.create({
      id: "cabin",
      modelId: "oa-model",
      layer: "OA",
      type: "OperationalActor",
      name: "Cabin Crew",
    });
    const crew = ModelElement.create({
      id: "crew",
      modelId: "oa-model",
      layer: "OA",
      type: "OperationalEntity",
      name: "Crew",
    });
    const updateElement = vi.fn(async (payload) =>
      ModelElement.create({
        id: actor.id,
        modelId: actor.modelId,
        layer: "OA",
        type: actor.type.value,
        name: payload.name,
        parentId: payload.parentId,
      }),
    );
    const useCase = new UpdateElementUseCase({
      findElementById: vi.fn(async ({ id }) => (id === "crew" ? crew : actor)),
      findElementsByModelId: vi.fn(async () => [crew, actor]),
      updateElement,
    } as unknown as IElementRepository);
    const result = await useCase.execute({
      payload: { id: "cabin", name: "Cabin Crew", parentId: "crew" },
      context: { token: "token" },
    });
    expect(result.parentId).toBe("crew");
    expect(updateElement).toHaveBeenCalledOnce();
  });
});
