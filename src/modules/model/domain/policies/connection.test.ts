import { describe, expect, it } from "vitest";
import { ElementType } from "../value-objects/element-type";
import { RelationshipType } from "../value-objects/relationship-type";
import { ConnectionPolicy } from "./connection";

const connect = (
  source: string,
  target: string,
  relationship: string,
): boolean =>
  ConnectionPolicy.isAllowed(
    ElementType.from(source),
    ElementType.from(target),
    RelationshipType.from(relationship),
  );

describe("ConnectionPolicy", () => {
  it("allows operational exchanges between activities", () => {
    expect(
      connect(
        "OperationalActivity",
        "OperationalActivity",
        "OperationalExchange",
      ),
    ).toBe(true);
    expect(
      connect(
        "OperationalEntity",
        "OperationalActivity",
        "OperationalExchange",
      ),
    ).toBe(false);
  });

  it("allows generalization between entities and actors in OA", () => {
    expect(
      connect("OperationalEntity", "OperationalActor", "Generalization"),
    ).toBe(true);
    expect(
      connect("OperationalActor", "OperationalEntity", "Generalization"),
    ).toBe(true);
    expect(
      connect("OperationalActivity", "OperationalEntity", "Generalization"),
    ).toBe(false);
  });

  it("allocates functions to their owning component in every layer", () => {
    expect(connect("SystemFunction", "SystemComponent", "Allocation")).toBe(
      true,
    );
    expect(connect("SystemFunction", "System", "Allocation")).toBe(true);
    expect(connect("SystemFunction", "SystemActor", "Allocation")).toBe(true);
    expect(connect("LogicalFunction", "LogicalComponent", "Allocation")).toBe(
      true,
    );
    expect(connect("PhysicalFunction", "PhysicalComponent", "Allocation")).toBe(
      true,
    );
    expect(connect("LogicalFunction", "LogicalActor", "Allocation")).toBe(true);
    expect(connect("PhysicalFunction", "PhysicalNode", "Allocation")).toBe(
      false,
    );
  });

  it("no longer allows function → component links as exchanges", () => {
    expect(
      connect("SystemFunction", "SystemComponent", "FunctionalExchange"),
    ).toBe(false);
    expect(
      connect("LogicalFunction", "LogicalComponent", "LogicalExchange"),
    ).toBe(false);
    expect(
      connect("PhysicalFunction", "PhysicalComponent", "PhysicalExchange"),
    ).toBe(false);
  });

  it("still allows real function → function exchanges", () => {
    expect(
      connect("SystemFunction", "SystemFunction", "FunctionalExchange"),
    ).toBe(true);
    expect(
      connect("LogicalFunction", "LogicalFunction", "LogicalExchange"),
    ).toBe(true);
    expect(
      connect("PhysicalFunction", "PhysicalFunction", "PhysicalExchange"),
    ).toBe(true);
  });

  it("does not allow composition edges in SA or any layer", () => {
    expect(connect("SystemComponent", "SystemComponent", "Composition")).toBe(
      false,
    );
    expect(connect("SystemFunction", "SystemFunction", "Composition")).toBe(
      false,
    );
    expect(connect("System", "SystemComponent", "Composition")).toBe(false);
    expect(connect("SystemActor", "SystemComponent", "Composition")).toBe(
      false,
    );
  });

  it("allows interaction exchanges between entities and actors in OA", () => {
    expect(
      connect("OperationalEntity", "OperationalEntity", "OperationalExchange"),
    ).toBe(true);
    expect(
      connect("OperationalEntity", "OperationalActor", "OperationalExchange"),
    ).toBe(true);
    expect(
      connect("OperationalActor", "OperationalEntity", "OperationalExchange"),
    ).toBe(true);
    expect(
      connect("OperationalActor", "OperationalActor", "OperationalExchange"),
    ).toBe(true);
  });

  it("allows component and system exchanges between system and actors in SA", () => {
    expect(connect("System", "SystemActor", "ComponentExchange")).toBe(true);
    expect(connect("SystemComponent", "SystemActor", "ComponentExchange")).toBe(
      true,
    );
    expect(connect("System", "SystemActor", "SystemExchange")).toBe(true);
  });

  it("never allows actors to be composed or decomposed", () => {
    expect(connect("LogicalActor", "LogicalComponent", "Composition")).toBe(
      false,
    );
    expect(connect("LogicalComponent", "LogicalActor", "Composition")).toBe(
      false,
    );
    expect(connect("SystemActor", "SystemComponent", "Composition")).toBe(
      false,
    );
    expect(connect("SystemComponent", "SystemActor", "Composition")).toBe(
      false,
    );
    expect(connect("PhysicalActor", "PhysicalComponent", "Composition")).toBe(
      false,
    );
    expect(connect("PhysicalComponent", "PhysicalActor", "Composition")).toBe(
      false,
    );
    expect(
      connect("OperationalActor", "OperationalEntity", "Composition"),
    ).toBe(false);
    expect(
      connect("OperationalEntity", "OperationalActor", "Composition"),
    ).toBe(false);
  });

  it("generalizes components and actors in SA, LA and PA", () => {
    expect(connect("SystemComponent", "SystemActor", "Generalization")).toBe(
      true,
    );
    expect(connect("SystemFunction", "SystemComponent", "Generalization")).toBe(
      false,
    );
    expect(connect("LogicalComponent", "LogicalActor", "Generalization")).toBe(
      true,
    );
    expect(
      connect("PhysicalComponent", "PhysicalActor", "Generalization"),
    ).toBe(true);
    expect(
      connect("LogicalFunction", "LogicalFunction", "Generalization"),
    ).toBe(false);
  });

  it("keeps deployment and involvement as connections", () => {
    expect(connect("PhysicalComponent", "PhysicalNode", "DeploymentLink")).toBe(
      true,
    );
    expect(
      connect("OperationalCapability", "OperationalEntity", "InvolvementLink"),
    ).toBe(false);
    expect(
      connect("OperationalEntity", "OperationalCapability", "InvolvementLink"),
    ).toBe(true);
    expect(
      connect(
        "OperationalActivity",
        "OperationalCapability",
        "InvolvementLink",
      ),
    ).toBe(true);
    expect(
      connect("OperationalActor", "OperationalCapability", "InvolvementLink"),
    ).toBe(true);
    expect(
      connect("OperationalEntity", "OperationalEntity", "InvolvementLink"),
    ).toBe(false);
  });

  it("lists allowed relationship types for a pair", () => {
    const allowed = ConnectionPolicy.getAllowedTypes(
      "SystemFunction",
      "SystemComponent",
    ).map((t) => t.value);

    expect(allowed).toContain("Allocation");
    expect(allowed).not.toContain("FunctionalExchange");

    expect(
      ConnectionPolicy.getAllowedTypes("PhysicalComponent", "PhysicalNode").map(
        (t) => t.value,
      ),
    ).toContain("DeploymentLink");

    expect(
      ConnectionPolicy.getAllowedTypes("Mission", "SystemFunction"),
    ).toEqual([]);
  });
});

describe("ConnectionPolicy.resolveTransitionType", () => {
  it("keeps a relationship type that is still valid after the move", () => {
    expect(
      ConnectionPolicy.resolveTransitionType(
        "SystemFunction",
        "SystemComponent",
        "Allocation",
      ),
    ).toBe("Allocation");
    expect(
      ConnectionPolicy.resolveTransitionType(
        "LogicalComponent",
        "LogicalComponent",
        "ProvidedInterface",
      ),
    ).toBe("ProvidedInterface");
  });

  it("re-homes an exchange on the exchange of the target layer", () => {
    expect(
      ConnectionPolicy.resolveTransitionType(
        "SystemFunction",
        "SystemFunction",
        "OperationalExchange",
      ),
    ).toBe("FunctionalExchange");
    expect(
      ConnectionPolicy.resolveTransitionType(
        "LogicalFunction",
        "LogicalFunction",
        "FunctionalExchange",
      ),
    ).toBe("LogicalExchange");
    expect(
      ConnectionPolicy.resolveTransitionType(
        "LogicalComponent",
        "LogicalActor",
        "SystemExchange",
      ),
    ).toBe("ComponentExchange");
  });

  it("never turns a structural link into an exchange", () => {
    expect(
      ConnectionPolicy.resolveTransitionType(
        "SystemActor",
        "SystemCapability",
        "DeploymentLink",
      ),
    ).toBeNull();
    expect(
      ConnectionPolicy.resolveTransitionType(
        "SystemFunction",
        "SystemComponent",
        "InvolvementLink",
      ),
    ).toBeNull();
    expect(
      ConnectionPolicy.resolveTransitionType(
        "PhysicalNode",
        "PhysicalNode",
        "Allocation",
      ),
    ).toBeNull();
  });
});
