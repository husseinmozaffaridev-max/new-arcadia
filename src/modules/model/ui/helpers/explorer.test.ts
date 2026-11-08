import { describe, expect, it } from "vitest";
import { getCategoryFolders } from "./explorer";

describe("getCategoryFolders (Layer-specific Category Folders)", () => {
  it("never includes Component folder for OA (Layer 1: Operational Analysis)", () => {
    const folders = getCategoryFolders("OA");
    const labels = folders.map((f) => f.label);
    const keys = folders.map((f) => f.key);

    expect(keys).not.toContain("components");
    expect(labels.some((l) => l.toLowerCase().includes("component"))).toBe(false);
    expect(labels).toContain("Entities & Actors");
    expect(labels).toContain("Activities");

    // Matchers test
    const actorFolder = folders.find((f) => f.key === "actors")!;
    expect(actorFolder.match("OperationalEntity")).toBe(true);
    expect(actorFolder.match("OperationalActor")).toBe(true);
  });

  it("never includes Component folder for SA (Layer 2: System Analysis)", () => {
    const folders = getCategoryFolders("SA");
    const labels = folders.map((f) => f.label);
    const keys = folders.map((f) => f.key);

    expect(keys).not.toContain("components");
    expect(labels.some((l) => l.toLowerCase().includes("component"))).toBe(false);
    expect(labels).toContain("System & Actors");
    expect(labels).toContain("Functions");

    // Verify System and SystemActor match System & Actors
    const actorFolder = folders.find((f) => f.key === "actors")!;
    expect(actorFolder.match("System")).toBe(true);
    expect(actorFolder.match("SystemActor")).toBe(true);
  });

  it("includes Components folder for LA (Layer 3: Logical Architecture)", () => {
    const folders = getCategoryFolders("LA");
    const compFolder = folders.find((f) => f.key === "components");
    expect(compFolder).toBeDefined();
    expect(compFolder?.label).toBe("Components");
    expect(compFolder?.match("LogicalComponent")).toBe(true);
    expect(compFolder?.match("PhysicalNode")).toBe(false);
  });

  it("includes Components & Nodes folder for PA (Layer 4: Physical Architecture)", () => {
    const folders = getCategoryFolders("PA");
    const compFolder = folders.find((f) => f.key === "components");
    expect(compFolder).toBeDefined();
    expect(compFolder?.label).toBe("Components & Nodes");
    expect(compFolder?.match("PhysicalComponent")).toBe(true);
    expect(compFolder?.match("PhysicalNode")).toBe(true);
  });
});
