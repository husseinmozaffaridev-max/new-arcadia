import { describe, expect, it } from "vitest";
import { mapToLifelineType } from "./scenario";

describe("mapToLifelineType", () => {
  it("maps all Actor element types to ACTOR", () => {
    expect(mapToLifelineType("OperationalActor")).toBe("ACTOR");
    expect(mapToLifelineType("Actor")).toBe("ACTOR");
    expect(mapToLifelineType("SystemActor")).toBe("ACTOR");
    expect(mapToLifelineType("LogicalActor")).toBe("ACTOR");
    expect(mapToLifelineType("PhysicalActor")).toBe("ACTOR");
  });

  it("maps all Function and Activity element types to FUNCTION", () => {
    expect(mapToLifelineType("OperationalActivity")).toBe("FUNCTION");
    expect(mapToLifelineType("SystemFunction")).toBe("FUNCTION");
    expect(mapToLifelineType("LogicalFunction")).toBe("FUNCTION");
    expect(mapToLifelineType("PhysicalFunction")).toBe("FUNCTION");
  });

  it("maps all Component, Entity, System and Node element types to COMPONENT", () => {
    expect(mapToLifelineType("OperationalEntity")).toBe("COMPONENT");
    expect(mapToLifelineType("System")).toBe("COMPONENT");
    expect(mapToLifelineType("SystemComponent")).toBe("COMPONENT");
    expect(mapToLifelineType("LogicalComponent")).toBe("COMPONENT");
    expect(mapToLifelineType("PhysicalComponent")).toBe("COMPONENT");
    expect(mapToLifelineType("PhysicalNode")).toBe("COMPONENT");
  });

  it("maps ClassElement and Class to CLASS_ELEMENT", () => {
    expect(mapToLifelineType("ClassElement")).toBe("CLASS_ELEMENT");
    expect(mapToLifelineType("Class")).toBe("CLASS_ELEMENT");
  });

  it("returns null for non-lifeline element types (Capabilities, Missions, Ports, etc.)", () => {
    expect(mapToLifelineType("OperationalCapability")).toBeNull();
    expect(mapToLifelineType("SystemCapability")).toBeNull();
    expect(mapToLifelineType("LogicalCapability")).toBeNull();
    expect(mapToLifelineType("Mission")).toBeNull();
    expect(mapToLifelineType("SystemMission")).toBeNull();
    expect(mapToLifelineType("FunctionPort")).toBeNull();
    expect(mapToLifelineType("UnknownType")).toBeNull();
  });
});
