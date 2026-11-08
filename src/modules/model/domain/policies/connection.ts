import type { RelationshipTypeValue } from "../relationships/definitions";
import { CONNECTION_RULES } from "../relationships/rules";
import { ElementType } from "../value-objects/element-type";
import { RelationshipType } from "../value-objects/relationship-type";

/**
 * Exchanges, ordered concrete → abstract. When a connection is re-homed in
 * another layer (a transition), only exchanges are allowed to fall back to
 * another exchange of the same family; structural types keep their meaning or
 * are dropped.
 */
const EXCHANGE_TYPES: RelationshipTypeValue[] = [
  "OperationalExchange",
  "FunctionalExchange",
  "SystemExchange",
  "ComponentExchange",
  "LogicalExchange",
  "PhysicalExchange",
];

/**
 * ConnectionPolicy
 *
 * Same-layer connection validation — a thin view over the shared
 * `CONNECTION_RULES` registry in `domain/relationships/rules.ts`.
 */
export class ConnectionPolicy {
  static assertAllowed(
    sourceType: ElementType,
    targetType: ElementType,
    relationshipType: RelationshipType,
  ): void {
    if (
      sourceType.value.endsWith("Actor") &&
      targetType.value.endsWith("Actor")
    ) {
      throw new Error(
        `Connecting two actors ("${sourceType.label}" to "${targetType.label}") is not allowed. According to Arcadia methodology, actors cannot be connected to each other.`,
      );
    }

    const rule = CONNECTION_RULES.find(
      (r) =>
        r.relationshipType === relationshipType.value &&
        r.allowedSources.includes(sourceType.value) &&
        r.allowedTargets.includes(targetType.value),
    );

    if (!rule) {
      throw new Error(
        `Connection from "${sourceType.label}" to "${targetType.label}" via "${relationshipType.label}" is not allowed.`,
      );
    }
  }

  static getAllowedTypes(
    sourceType: string | ElementType,
    targetType: string | ElementType,
  ): RelationshipType[] {
    const source = ElementType.from(sourceType.toString()).value;
    const target = ElementType.from(targetType.toString()).value;

    if (source.endsWith("Actor") && target.endsWith("Actor")) {
      return [];
    }

    const values = CONNECTION_RULES.filter(
      (r) =>
        r.allowedSources.includes(source) && r.allowedTargets.includes(target),
    ).map((r) => r.relationshipType);

    return Array.from(new Set(values)).map((value) =>
      RelationshipType.from(value),
    );
  }

  static isAllowed(
    sourceType: ElementType,
    targetType: ElementType,
    relationshipType: RelationshipType,
  ): boolean {
    try {
      ConnectionPolicy.assertAllowed(sourceType, targetType, relationshipType);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Picks the relationship type to use when a connection is rebuilt between two
   * elements that moved to another layer.
   *
   * 1. the original type, when it is still valid for the new element pair;
   * 2. otherwise the first exchange that is valid — but only when the original
   *    type was an exchange itself;
   * 3. otherwise `null`, meaning the connection must be dropped (a structural
   *    link such as Composition or InvolvementLink is never silently turned
   *    into an exchange).
   */
  static resolveTransitionType(
    sourceType: string | ElementType,
    targetType: string | ElementType,
    preferred: RelationshipTypeValue,
  ): RelationshipTypeValue | null {
    const allowed = ConnectionPolicy.getAllowedTypes(
      sourceType,
      targetType,
    ).map((type) => type.value);

    if (allowed.includes(preferred)) return preferred;

    if (!EXCHANGE_TYPES.includes(preferred)) return null;

    return EXCHANGE_TYPES.find((type) => allowed.includes(type)) ?? null;
  }
}
