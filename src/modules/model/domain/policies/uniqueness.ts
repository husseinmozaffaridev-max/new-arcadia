import { NAME_MAX_LENGTH } from "./naming";

/**
 * UniquenessPolicy
 *
 * The single source of truth for keeping human-readable names unique within a
 * scope (model, layer or project).
 *
 * Two behaviours, one rule:
 *  - `isDuplicateName` answers whether a *rename* to `name` would collide with
 *    a sibling entity (trimmed, case-insensitive, self-excluded).
 *  - `findAvailableName` resolves a *create* conflict by suffixing ` (2)`,
 *    ` (3)`, … first free slot, truncating the base so the result never
 *    exceeds the entity's maximum name length.
 *
 * Both are pure: the calling use case is responsible for loading the siblings
 * through its repository and for throwing `duplicateNameMessage(...)` when a
 * rename is refused.
 */

export type NamedEntity = {
  readonly id: string;
  readonly name: string;
};

export type FindAvailableNameOptions = {
  /** Defaults to {@link NAME_MAX_LENGTH} (255). */
  maxLength?: number;
};

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function trimTo(value: string, maxLength: number): string {
  const limit = Math.max(0, maxLength);
  return value.length <= limit ? value : value.slice(0, limit);
}

/**
 * Whether renaming/creating `name` collides with a sibling entity.
 *
 * Comparison is trimmed and case-insensitive. Pass the entity's own id as
 * `excludeId` so a case-only rename of the same entity (`Foo` → `foo`) is not
 * reported as a duplicate.
 */
export function isDuplicateName(
  name: string,
  siblings: readonly NamedEntity[],
  excludeId?: string,
): boolean {
  const target = normalise(name);
  if (!target) return false;

  return siblings.some(
    (sibling) => sibling.id !== excludeId && normalise(sibling.name) === target,
  );
}

/**
 * Generates an initial name with a 1-based sequential counter (e.g. "Activity 1", "Activity 2")
 * according to Capella conventions.
 */
export function findAvailableCountedName(
  base: string,
  takenNames: readonly string[],
  options: FindAvailableNameOptions = {},
): string {
  const maxLength = options.maxLength ?? NAME_MAX_LENGTH;
  const trimmed = base.trim().replace(/^New\s+/i, "");
  const taken = new Set(takenNames.map(normalise));

  const match = trimmed.match(/^(.*?)(?:\s+(\d+)|\s*\((\d+)\))$/);
  const cleanBase = match ? match[1].trim() : trimmed;

  for (let count = 1; count <= taken.size + 2; count++) {
    const suffix = ` ${count}`;
    const candidate = `${trimTo(cleanBase, maxLength - suffix.length)}${suffix}`;
    if (!taken.has(normalise(candidate))) {
      return candidate;
    }
  }

  return `${cleanBase} 1`;
}

/**
 * Returns `base` when it is free, otherwise the first free `base (2)`,
 * `base (3)`, … The base is truncated when needed so the returned name never
 * exceeds `maxLength`.
 *
 * Termination: at most `takenNames.length + 1` candidates exist and every one
 * is distinct, so at least one is free.
 */
export function findAvailableName(
  base: string,
  takenNames: readonly string[],
  options: FindAvailableNameOptions = {},
): string {
  const maxLength = options.maxLength ?? NAME_MAX_LENGTH;
  const trimmed = base.trim();
  const taken = new Set(takenNames.map(normalise));

  if (!taken.has(normalise(trimmed))) {
    return trimTo(trimmed, maxLength);
  }

  const limit = taken.size + 2;
  for (let count = 2; count <= limit; count++) {
    const suffix = ` (${count})`;
    const candidate = `${trimTo(trimmed, maxLength - suffix.length)}${suffix}`;
    if (!taken.has(normalise(candidate))) {
      return candidate;
    }
  }

  throw new Error(`Unable to derive a unique name for "${trimmed}"`);
}

/**
 * Shared wording for a refused rename. Kept consistent with the
 * Validation panel's `duplicate-name` rule.
 *
 * e.g. `The name "System Function" is already used by another element in this layer`
 */
export function duplicateNameMessage(
  label: string,
  name: string,
  scope: string,
): string {
  return `The name "${name.trim()}" is already used by another ${label} in ${scope}`;
}
