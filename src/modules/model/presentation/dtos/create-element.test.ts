import { describe, expect, it } from "vitest";
import { CreateElementDTO } from "./create-element";

describe("CreateElementDTO", () => {
  it("accepts mission and capability types exposed by the editable palettes", () => {
    expect(
      CreateElementDTO.create({
        modelId: "model-1",
        type: "SystemMission",
        name: "Mission",
        layer: "SA",
      }).type,
    ).toBe("SystemMission");
    expect(
      CreateElementDTO.create({
        modelId: "model-2",
        type: "LogicalCapability",
        name: "Realization",
        layer: "LA",
      }).type,
    ).toBe("LogicalCapability");
  });
});
