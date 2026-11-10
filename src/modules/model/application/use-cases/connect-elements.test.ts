import { describe, expect, it, vi } from "vitest";
import { ModelElement } from "../../domain/entities/element";
import { Relationship } from "../../domain/entities/relationship";
import type { IElementRepository } from "../ports/element";
import type { IRelationshipRepository } from "../ports/relationship";
import { ConnectElementsUseCase } from "./connect-elements";

describe("ConnectElementsUseCase", () => {
  it("creates an Aircraft to Cabin Crew communication mean in the same OA model", async () => {
    const aircraft = ModelElement.create({
      id: "aircraft",
      modelId: "model-1",
      layer: "OA",
      type: "OperationalEntity",
      name: "Aircraft",
    });
    const cabinCrew = ModelElement.create({
      id: "cabin-crew",
      modelId: "model-1",
      layer: "OA",
      type: "OperationalActor",
      name: "Cabin Crew",
    });
    const createRelationship = vi.fn(async (input) =>
      Relationship.create({
        id: "mean-1",
        ...input,
        type: input.type.value,
      }),
    );
    const useCase = new ConnectElementsUseCase(
      {
        findElementById: vi.fn(async ({ id }) =>
          id === "aircraft" ? aircraft : cabinCrew,
        ),
      } as unknown as IElementRepository,
      { createRelationship } as unknown as IRelationshipRepository,
    );

    const result = await useCase.execute({
      payload: {
        modelId: "model-1",
        sourceElementId: "aircraft",
        targetElementId: "cabin-crew",
        relationshipType: "CommunicationMean",
        name: "Aircraft-Cabin Crew Communication",
      },
      context: { token: "token" },
    });

    expect(result.type).toBe("CommunicationMean");
    expect(result.sourceElementId).toBe("aircraft");
    expect(result.targetElementId).toBe("cabin-crew");
    expect(createRelationship).toHaveBeenCalledOnce();
  });

  it("rejects a relationship whose endpoint is in another model", async () => {
    const source = ModelElement.create({
      id: "source",
      modelId: "model-1",
      layer: "OA",
      type: "OperationalActivity",
      name: "Source",
    });
    const target = ModelElement.create({
      id: "target",
      modelId: "model-2",
      layer: "OA",
      type: "OperationalActivity",
      name: "Target",
    });
    const createRelationship = vi.fn();
    const useCase = new ConnectElementsUseCase(
      {
        findElementById: vi.fn(async ({ id }) =>
          id === "source" ? source : target,
        ),
      } as unknown as IElementRepository,
      { createRelationship } as unknown as IRelationshipRepository,
    );
    await expect(
      useCase.execute({
        payload: {
          modelId: "model-1",
          sourceElementId: "source",
          targetElementId: "target",
          relationshipType: "FunctionalExchange",
        },
        context: { token: "token" },
      }),
    ).rejects.toThrow(
      "Both relationship endpoints must belong to the selected model",
    );
    expect(createRelationship).not.toHaveBeenCalled();
  });
});
