import { validateRequiredName } from "../../domain/policies/naming";

type DiagramType =
  | "OEB"
  | "OCB"
  | "OCD"
  | "OAB"
  | "OAIB"
  | "OABD"
  | "OPD"
  | "OAS"
  | "OIS"
  | "OAAB"
  | "MCB"
  | "CSA"
  | "SCD"
  | "SFBD"
  | "SFB"
  | "SDFB"
  | "SAB"
  | "SAS"
  | "SS"
  | "LCB"
  | "LFBD"
  | "LFB"
  | "LDFB"
  | "LAB"
  | "LAS"
  | "LS"
  | "PCB"
  | "PFBD"
  | "PFB"
  | "PDFB"
  | "PAB"
  | "PAS"
  | "PS"
  | "EPBB"
  | "EAB"
  | "ECB";

export type CreateDiagramDTOProps = {
  type: DiagramType;
  name: string;
  modelId: string;
  description?: string;
};

export class CreateDiagramDTO {
  public readonly type: DiagramType;
  public readonly name: string;
  public readonly modelId: string;
  public readonly description?: string;

  private constructor(props: CreateDiagramDTOProps) {
    this.type = props.type;
    this.name = props.name;
    this.modelId = props.modelId;
    this.description = props.description;
  }

  static create(props: {
    name: string;
    modelId: string;
    type: DiagramType;
    description?: string;
  }): CreateDiagramDTO {
    return new CreateDiagramDTO({
      type: CreateDiagramDTO.validateType(props.type),
      name: CreateDiagramDTO.validateName(props.name),
      modelId: CreateDiagramDTO.validateModelId(props.modelId),
      description: CreateDiagramDTO.validateDescription(props.description),
    });
  }

  private static validateType(type: string): DiagramType {
    const validTypes: DiagramType[] = [
      "OEB",
      "OCD",
      "OAB",
      "OAIB",
      "OABD",
      "OPD",
      "OIS",
      "OAAB",
      "CSA",
      "SCD",
      "SFB",
      "SDFB",
      "SAB",
      "SS",
      "LCB",
      "LFB",
      "LDFB",
      "LAB",
      "LS",
      "PCB",
      "PFB",
      "PDFB",
      "PAB",
      "PS",
      "EPBB",
      "EAB",
      "ECB",
    ];

    if (!validTypes.includes(type as DiagramType)) {
      throw new Error(`Diagram type must be one of: ${validTypes.join(", ")}`);
    }

    return type as DiagramType;
  }

  private static validateName(name: string): string {
    return validateRequiredName(name, {
      label: "Diagram name",
      maxLength: 100,
    });
  }

  private static validateModelId(modelId: string): string {
    if (!modelId) {
      throw new Error("Model id is required");
    }

    const trimmed = modelId.trim();

    if (!trimmed) {
      throw new Error("Model ID cannot be empty");
    }

    if (trimmed.length > 255) {
      throw new Error("Model ID cannot exceed 255 characters");
    }

    return trimmed;
  }

  private static validateDescription(description?: string): string | undefined {
    if (description === undefined || description === null) return undefined;

    const trimmed = description.trim();

    if (trimmed.length === 0) return undefined;

    if (trimmed.length > 500) {
      throw new Error("Diagram description cannot exceed 500 characters");
    }

    return trimmed;
  }
}
