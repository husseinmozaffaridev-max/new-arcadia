import { describe, expect, it } from "vitest";
import {
  duplicateNameMessage,
  findAvailableCountedName,
  findAvailableName,
  isDuplicateName,
} from "./uniqueness";

const siblings = [
  { id: "a", name: "System Function" },
  { id: "b", name: "  Operational Actor " },
  { id: "c", name: "ENTITY" },
];

describe("uniqueness policy", () => {
  describe("isDuplicateName", () => {
    it("returns false when no siblings exist", () => {
      expect(isDuplicateName("System Function", [])).toBe(false);
    });

    it("detects an exact match", () => {
      expect(isDuplicateName("System Function", siblings)).toBe(true);
    });

    it("matches case-insensitively and trims both sides", () => {
      expect(isDuplicateName("entity", siblings)).toBe(true);
      expect(isDuplicateName("  operational actor  ", siblings)).toBe(true);
      expect(isDuplicateName("system function", siblings)).toBe(true);
    });

    it("returns false for a free name", () => {
      expect(isDuplicateName("Logical Component", siblings)).toBe(false);
    });

    it("excludes the entity being renamed", () => {
      expect(isDuplicateName("System Function", siblings, "a")).toBe(false);
      expect(isDuplicateName("System Function", siblings, "b")).toBe(true);
    });

    it("allows a case-only rename of the same entity", () => {
      expect(isDuplicateName("entity", siblings, "c")).toBe(false);
      expect(isDuplicateName("Entity", siblings, "c")).toBe(false);
    });

    it("never reports blank names as duplicates", () => {
      expect(isDuplicateName("", siblings)).toBe(false);
      expect(isDuplicateName("   ", siblings)).toBe(false);
    });
  });

  describe("findAvailableName", () => {
    it("returns the base when it is free", () => {
      expect(findAvailableName("New System Function", [])).toBe(
        "New System Function",
      );
      expect(
        findAvailableName("New System Function", ["New Logical Component"]),
      ).toBe("New System Function");
    });

    it("appends (2) on the first conflict", () => {
      expect(
        findAvailableName("New System Function", ["New System Function"]),
      ).toBe("New System Function (2)");
    });

    it("skips occupied slots", () => {
      expect(
        findAvailableName("New System Function", [
          "New System Function",
          "New System Function (2)",
        ]),
      ).toBe("New System Function (3)");
    });

    it("treats taken names case-insensitively", () => {
      expect(findAvailableName("Class", ["CLASS"])).toBe("Class (2)");
    });

    it("trims the base before comparing", () => {
      expect(findAvailableName("  Class  ", ["Class"])).toBe("Class (2)");
    });

    it("truncates the base so the result fits the maximum length", () => {
      const base = "a".repeat(100);
      const result = findAvailableName(base, [base], { maxLength: 100 });
      expect(result).toHaveLength(100);
      expect(result.endsWith(" (2)")).toBe(true);
      expect(result.startsWith("a".repeat(96))).toBe(true);
    });

    it("defaults to the 255 character maximum", () => {
      const base = "b".repeat(255);
      const result = findAvailableName(base, [base]);
      expect(result).toHaveLength(255);
      expect(result.endsWith(" (2)")).toBe(true);
    });

    it("keeps a free base untouched even above the suffix threshold", () => {
      const base = "c".repeat(100);
      expect(findAvailableName(base, [])).toBe(base);
    });
  });

  describe("findAvailableCountedName", () => {
    it("starts with 1 on first occurrence", () => {
      expect(findAvailableCountedName("Operational Activity", [])).toBe(
        "Operational Activity 1",
      );
    });

    it("increments to 2, 3, etc. when previous numbers are taken", () => {
      expect(
        findAvailableCountedName("Operational Activity", [
          "Operational Activity 1",
        ]),
      ).toBe("Operational Activity 2");

      expect(
        findAvailableCountedName("Operational Activity", [
          "Operational Activity 1",
          "Operational Activity 2",
        ]),
      ).toBe("Operational Activity 3");
    });

    it("cleans up 'New ' prefix and extracts base", () => {
      expect(
        findAvailableCountedName("New Operational Activity", [
          "Operational Activity 1",
        ]),
      ).toBe("Operational Activity 2");
    });
  });

  describe("duplicateNameMessage", () => {
    it("quotes the name and states label and scope", () => {
      expect(
        duplicateNameMessage("element", " System Function ", "this layer"),
      ).toBe(
        'The name "System Function" is already used by another element in this layer',
      );
    });

    it("supports other labels and scopes", () => {
      expect(duplicateNameMessage("model", "PA Model", "this project")).toBe(
        'The name "PA Model" is already used by another model in this project',
      );
      expect(duplicateNameMessage("diagram", "Context", "this model")).toBe(
        'The name "Context" is already used by another diagram in this model',
      );
    });
  });
});
