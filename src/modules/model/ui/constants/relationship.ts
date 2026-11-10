import { relationshipDefinitionsOfKind } from "../../domain/relationships/definitions";
import { connectionLayersFor } from "../../domain/relationships/rules";
import type {
  RelationshipTypeInfo,
  RelationshipTypeValue,
  RelationshipVisualSpec,
} from "../types/relationship";

export const RELATIONSHIP_TYPES: RelationshipTypeInfo[] =
  relationshipDefinitionsOfKind("connection")
    .map((definition) => ({
      value: definition.value as RelationshipTypeValue,
      label: definition.label,
      labelFa: definition.labelFa,
      allowedFor: connectionLayersFor(
        definition.value as RelationshipTypeValue,
      ),
    }))
    .filter((rel) => rel.allowedFor.length > 0);

export const RELATIONSHIP_VISUAL: Record<
  RelationshipTypeValue,
  RelationshipVisualSpec
> = {
  Allocation: {
    strokeColor: "#E67E22",
    strokeWidth: 1,
    arrowEnd: "open-arrow",
    strokeDash: "4,2",
  },
  OperationalExchange: {
    strokeColor: "#2E86C1",
    strokeWidth: 1.5,
    arrowEnd: "arrow",
  },
  CommunicationMean: {
    strokeColor: "#2E86C1",
    strokeWidth: 1.5,
    arrowEnd: "none",
  },
  InvolvementLink: {
    strokeColor: "#717D7E",
    strokeWidth: 1,
    arrowEnd: "open-arrow",
    strokeDash: "5,3",
  },
  FunctionalExchange: {
    strokeColor: "#CA6F1E",
    strokeWidth: 1.5,
    arrowEnd: "arrow",
  },
  SystemExchange: { strokeColor: "#1A5276", strokeWidth: 2, arrowEnd: "arrow" },
  LogicalExchange: {
    strokeColor: "#1E8449",
    strokeWidth: 1.5,
    arrowEnd: "arrow",
  },
  ComponentExchange: {
    strokeColor: "#1D8348",
    strokeWidth: 2,
    arrowEnd: "arrow",
  },
  ProvidedInterface: {
    strokeColor: "#1E8449",
    strokeWidth: 1.5,
    arrowEnd: "diamond",
  },
  RequiredInterface: {
    strokeColor: "#922B21",
    strokeWidth: 1.5,
    arrowEnd: "open-arrow",
    strokeDash: "4,2",
  },
  PhysicalExchange: {
    strokeColor: "#6C3483",
    strokeWidth: 1.5,
    arrowEnd: "arrow",
  },
  PhysicalLink: { strokeColor: "#2C3E50", strokeWidth: 2.5, arrowEnd: "none" },
  DeploymentLink: {
    strokeColor: "#7F8C8D",
    strokeWidth: 1,
    arrowEnd: "open-arrow",
    strokeDash: "6,3",
  },
  Composition: {
    strokeColor: "#7D3C98",
    strokeWidth: 1.5,
    arrowEnd: "diamond", // یا "none" بسته به نمایش
    strokeDash: "none",
  },
  Generalization: {
    strokeColor: "#2E86C1",
    strokeWidth: 1.5,
    arrowEnd: "open-arrow",
    strokeDash: "none",
  },
};
