import { ElementType } from "../value-objects/element-type";
import { Layer, type LayerValue } from "../value-objects/layer";
import { RelationshipType } from "../value-objects/relationship-type";
import { ConnectionPolicy } from "./connection";
import { checkName } from "./naming";

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  rule: string;
  message: string;
  elementId?: string;
  elementName?: string;
  elementType?: string;
  relationshipId?: string;
  layer?: LayerValue;
};

type ValidationContext = {
  elements: Array<{
    id: string;
    modelId: string;
    layer: string;
    type: string;
    name: string;
    parentId: string | null;
    status: string;
    properties?: Record<string, unknown>;
  }>;
  traceLinks: Array<{
    id: string;
    sourceElementId: string;
    targetElementId: string;
    sourceLayer: string;
    targetLayer: string;
    type: string;
  }>;
  relationships: Array<{
    id: string;
    sourceElementId: string;
    targetElementId: string;
    type: string;
  }>;
};

function elementKey(el: { id: string; layer: string; type: string }) {
  return `${el.layer}:${el.type}:${el.id}`;
}

/**
 * ValidationPolicy
 *
 * Runs structural validation rules against a model's elements, trace links,
 * and relationships. Returns a list of issues categorized by severity.
 */
export class ValidationPolicy {
  static validate(ctx: ValidationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    let issueCounter = 0;

    const nextId = () => `val-${++issueCounter}`;

    const elementsByLayer = new Map<string, typeof ctx.elements>();
    for (const el of ctx.elements) {
      const arr = elementsByLayer.get(el.layer) ?? [];
      arr.push(el);
      elementsByLayer.set(el.layer, arr);
    }

    // ── Rule 1: Orphan elements (no relationships AND no trace links) ─────
    const elementsWithRels = new Set<string>();
    for (const r of ctx.relationships) {
      elementsWithRels.add(r.sourceElementId);
      elementsWithRels.add(r.targetElementId);
    }
    for (const t of ctx.traceLinks) {
      elementsWithRels.add(t.sourceElementId);
      elementsWithRels.add(t.targetElementId);
    }

    for (const el of ctx.elements) {
      if (!elementsWithRels.has(el.id) && el.parentId === null) {
        issues.push({
          id: nextId(),
          severity: "warning",
          rule: "orphan-element",
          message: `No relationships, trace links, or child decomposition`,
          elementId: el.id,
          elementName: el.name,
          elementType: el.type,
          layer: el.layer as LayerValue,
        });
      }
    }

    // ── Rule 2: Elements with empty names ──────────────────────────────────
    for (const el of ctx.elements) {
      const nameCheck = checkName(el.name, { label: "Name" });
      if (!nameCheck.valid) {
        issues.push({
          id: nextId(),
          severity: "error",
          rule: "empty-name",
          message: nameCheck.message,
          elementId: el.id,
          elementName: el.name,
          elementType: el.type,
          layer: el.layer as LayerValue,
        });
      }
    }

    // ── Rule 3: Cross-layer trace link validation ──────────────────────────
    for (const trace of ctx.traceLinks) {
      const src = ctx.elements.find((e) => e.id === trace.sourceElementId);
      const tgt = ctx.elements.find((e) => e.id === trace.targetElementId);
      if (!src || !tgt) {
        issues.push({
          id: nextId(),
          severity: "error",
          rule: "dangling-trace",
          message: `References missing element`,
          elementId: src?.id ?? tgt?.id,
          elementName: src?.name ?? tgt?.name,
          elementType: src?.type ?? tgt?.type,
          layer: trace.sourceLayer as LayerValue,
        });
        continue;
      }

      const srcLayer = Layer.from(trace.sourceLayer);
      const tgtLayer = Layer.from(trace.targetLayer);

      if (trace.type === "Realization") {
        if (tgtLayer.order >= srcLayer.order) {
          issues.push({
            id: nextId(),
            severity: "error",
            rule: "realization-direction",
            message: `Realization trace must go from more concrete (higher order) to more abstract (lower order) layer`,
            elementId: src.id,
            elementName: src.name,
            elementType: src.type,
            layer: trace.sourceLayer as LayerValue,
          });
        }

        if (Math.abs(srcLayer.order - tgtLayer.order) !== 1) {
          issues.push({
            id: nextId(),
            severity: "warning",
            rule: "non-adjacent-realization",
            message: `Realization skips layers`,
            elementId: src.id,
            elementName: src.name,
            elementType: src.type,
            layer: trace.sourceLayer as LayerValue,
          });
        }
      }
    }

    // ── Rule 4: Layer completeness — SA should have at least one System ────
    const saElements = elementsByLayer.get("SA") ?? [];
    if (saElements.length > 0) {
      const hasSystem = saElements.some((e) => e.type === "System");
      if (!hasSystem) {
        issues.push({
          id: nextId(),
          severity: "info",
          rule: "missing-system",
          message: "System Analysis layer has no System element",
          layer: "SA",
        });
      }
    }

    // ── Rule 4b: EPBS should have at least one EPBSArchitecture ──────────────
    const epbsElements = elementsByLayer.get("EPBS") ?? [];
    if (epbsElements.length > 0) {
      const hasEPBSArchitecture = epbsElements.some(
        (e) => e.type === "EPBSArchitecture",
      );
      if (!hasEPBSArchitecture) {
        issues.push({
          id: nextId(),
          severity: "info",
          rule: "missing-epbs-architecture",
          message: "EPBS layer has no EPBS Architecture element",
          layer: "EPBS",
        });
      }
    }

    // ── Rule 4c: EPBS should have at least one ConfigurationItem ────────────
    if (epbsElements.length > 0) {
      const hasConfigurationItem = epbsElements.some(
        (e) => e.type === "ConfigurationItem",
      );
      if (!hasConfigurationItem) {
        issues.push({
          id: nextId(),
          severity: "warning",
          rule: "missing-configuration-item",
          message: "EPBS layer has no Configuration Item element",
          layer: "EPBS",
        });
      }
    }

    // ── Rule 4d: Every ConfigurationItem must have a kind ───────────────────
    for (const el of epbsElements) {
      if (el.type === "ConfigurationItem") {
        // The kind would be in extensionProperties
        const kind = el.properties?.configurationItemKind;
        if (!kind) {
          issues.push({
            id: nextId(),
            severity: "error",
            rule: "configuration-item-missing-kind",
            message: `ConfigurationItem "${el.name}" must have a kind (System, Subsystem, Hardware, Software)`,
            elementId: el.id,
            elementName: el.name,
            elementType: el.type,
            layer: "EPBS",
          });
        }
      }
    }

    // ── Rule 4e: Every ConfigurationItem must trace to at least one PhysicalComponent/Actor ─────────
    if (epbsElements.length > 0) {
      const traceLinksBySource = new Map<string, typeof ctx.traceLinks>();
      for (const trace of ctx.traceLinks) {
        if (!traceLinksBySource.has(trace.sourceElementId)) {
          traceLinksBySource.set(trace.sourceElementId, []);
        }
        traceLinksBySource.get(trace.sourceElementId)!.push(trace);
      }

      for (const el of epbsElements) {
        if (el.type === "ConfigurationItem") {
          const traces = traceLinksBySource.get(el.id) ?? [];
          const hasRealizationToPA = traces.some(
            (t) =>
              t.type === "Realization" &&
              (t.targetLayer === "PA" || t.targetLayer === "LA"),
          );
          if (!hasRealizationToPA) {
            issues.push({
              id: nextId(),
              severity: "warning",
              rule: "unrealized-configuration-item",
              message: `ConfigurationItem "${el.name}" has no realization trace to PhysicalComponent or PhysicalActor`,
              elementId: el.id,
              elementName: el.name,
              elementType: el.type,
              layer: "EPBS",
            });
          }
        }
      }
    }

    // ── Rule 4f: ConfigurationItemInterface must have ProvidedInterface/RequiredInterface ────────
    if (epbsElements.length > 0) {
      const interfaces = epbsElements.filter(
        (e) => e.type === "ConfigurationItemInterface",
      );
      const relationshipsBySource = new Map<string, typeof ctx.relationships>();
      for (const rel of ctx.relationships) {
        if (!relationshipsBySource.has(rel.sourceElementId)) {
          relationshipsBySource.set(rel.sourceElementId, []);
        }
        relationshipsBySource.get(rel.sourceElementId)!.push(rel);
      }

      for (const iface of interfaces) {
        const rels = relationshipsBySource.get(iface.id) ?? [];
        const hasProvidedOrRequired = rels.some(
          (r) =>
            r.type === "ProvidedInterface" || r.type === "RequiredInterface",
        );
        if (!hasProvidedOrRequired) {
          issues.push({
            id: nextId(),
            severity: "warning",
            rule: "interface-missing-connection",
            message: `ConfigurationItemInterface "${iface.name}" has no ProvidedInterface or RequiredInterface connection`,
            elementId: iface.id,
            elementName: iface.name,
            elementType: iface.type,
            layer: "EPBS",
          });
        }
      }
    }

    // ── Rule 4g: No orphan ConfigurationItem (no parent, no children, no trace) ──────────────────
    for (const el of epbsElements) {
      if (
        el.type === "ConfigurationItem" &&
        el.parentId === null &&
        !epbsElements.some((e) => e.parentId === el.id)
      ) {
        const hasTrace = ctx.traceLinks.some(
          (t) => t.sourceElementId === el.id || t.targetElementId === el.id,
        );
        if (!hasTrace) {
          issues.push({
            id: nextId(),
            severity: "warning",
            rule: "orphan-configuration-item",
            message: `ConfigurationItem "${el.name}" is orphaned (no parent, no children, no traces)`,
            elementId: el.id,
            elementName: el.name,
            elementType: el.type,
            layer: "EPBS",
          });
        }
      }
    }

    // ── Rule 5: Parent-child consistency ───────────────────────────────────
    const elementById = new Map(ctx.elements.map((e) => [e.id, e]));

    // ── Rule 5b: Actor interactions must use a valid relation ────────────
    for (const rel of ctx.relationships) {
      const source = elementById.get(rel.sourceElementId);
      const target = elementById.get(rel.targetElementId);
      if (
        source &&
        target &&
        source.type.endsWith("Actor") &&
        target.type.endsWith("Actor") &&
        !ConnectionPolicy.isAllowed(
          ElementType.from(source.type),
          ElementType.from(target.type),
          RelationshipType.from(rel.type),
        )
      ) {
        issues.push({
          id: nextId(),
          severity: "error",
          rule: "invalid-actor-relationship",
          message: `Relationship "${rel.type}" is not valid between actors "${source.name}" and "${target.name}".`,
          elementId: source.id,
          elementName: source.name,
          elementType: source.type,
          relationshipId: rel.id,
          layer: source.layer as LayerValue,
        });
      }
    }

    for (const el of ctx.elements) {
      if (el.parentId) {
        const parent = elementById.get(el.parentId);
        const isOperationalActorInEntity =
          el.type === "OperationalActor" &&
          el.layer === "OA" &&
          parent?.type === "OperationalEntity" &&
          parent.layer === "OA";
        if (el.type.endsWith("Actor") && !isOperationalActorInEntity) {
          issues.push({
            id: nextId(),
            severity: "error",
            rule: "actor-has-parent",
            message: `Actor "${el.name}" cannot be decomposed or nested inside another element`,
            elementId: el.id,
            elementName: el.name,
            elementType: el.type,
            layer: el.layer as LayerValue,
          });
        }
        if (!parent) {
          issues.push({
            id: nextId(),
            severity: "error",
            rule: "missing-parent",
            message: `Parent does not exist`,
            elementId: el.id,
            elementName: el.name,
            elementType: el.type,
            layer: el.layer as LayerValue,
          });
        } else if (parent.layer !== el.layer) {
          issues.push({
            id: nextId(),
            severity: "error",
            rule: "cross-layer-parent",
            message: `Parent "${parent.name}" is in a different layer`,
            elementId: el.id,
            elementName: el.name,
            elementType: el.type,
            layer: el.layer as LayerValue,
          });
        } else if (parent.type.endsWith("Actor")) {
          issues.push({
            id: nextId(),
            severity: "error",
            rule: "actor-cannot-be-decomposed",
            message: `Actor "${parent.name}" cannot be decomposed or contain child elements`,
            elementId: el.id,
            elementName: el.name,
            elementType: el.type,
            layer: el.layer as LayerValue,
          });
        }
      }
    }

    // ── Rule 6: Duplicate element names within same model+layer ────────────
    const namesSeen = new Map<string, string[]>();
    for (const el of ctx.elements) {
      const key = `${el.modelId}:${el.layer}:${el.name.toLowerCase()}`;
      const arr = namesSeen.get(key) ?? [];
      arr.push(el.id);
      namesSeen.set(key, arr);
    }
    for (const [, ids] of Array.from(namesSeen)) {
      if (ids.length > 1) {
        for (const id of ids) {
          const el = elementById.get(id);
          if (el) {
            issues.push({
              id: nextId(),
              severity: "warning",
              rule: "duplicate-name",
              message: `Duplicate name in this layer`,
              elementId: el.id,
              elementName: el.name,
              elementType: el.type,
              layer: el.layer as LayerValue,
            });
          }
        }
      }
    }

    return issues;
  }
}
