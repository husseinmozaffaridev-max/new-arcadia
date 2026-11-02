import { z } from "zod";
import type { DiagramTypeValue } from "@/modules/model/ui/types/diagram";

export const diagramFormSchema = z.object({
  type: z.enum<DiagramTypeValue[]>(
    [
      "OEB",
      "OCB",
      "OCD",
      "OAB",
      "OAIB",
      "OABD",
      "OPD",
      "OAS",
      "OIS",
      "OAAB",
      "MCB",
      "CSA",
      "SCD",
      "SFBD",
      "SFB",
      "SDFB",
      "SAB",
      "SAS",
      "SS",
      "LCB",
      "LFBD",
      "LFB",
      "LDFB",
      "LAB",
      "LAS",
      "LS",
      "PCB",
      "PFBD",
      "PFB",
      "PDFB",
      "PAB",
      "PAS",
      "PS",
      "CDB",
    ],
    {
      error: "Diagram type is invalid",
    },
  ),
  name: z.string().min(1, "Diagram name is required"),
  description: z.string().optional(),
});

export type DiagramFormValues = z.infer<typeof diagramFormSchema>;

const SCENARIO_TYPE_VALUES = new Set([
  "OIS",
  "OAS",
  "SS",
  "SAS",
  "LS",
  "LAS",
  "PS",
  "PAS",
]);

function kindLabelFor(type: DiagramFormValues["type"]): string {
  if (type === "CDB") return "class diagram";
  if (SCENARIO_TYPE_VALUES.has(type)) return "scenario";
  return "diagram";
}

/**
 * Diagram/scenario/class-diagram names share one namespace per model, so the
 * schema rejects a name already taken by any sibling (`siblingNames` must
 * exclude the entity being edited). Mirrors the server-side
 * `duplicateNameMessage` wording; the server remains the authoritative check.
 */
export function createDiagramFormSchema(siblingNames: readonly string[] = []) {
  const taken = new Set(
    siblingNames.map((name) => name.trim().toLowerCase()).filter(Boolean),
  );

  return diagramFormSchema.superRefine((values, ctx) => {
    const trimmed = values.name.trim();
    if (!trimmed || taken.size === 0) return;

    if (taken.has(trimmed.toLowerCase())) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: `The name "${trimmed}" is already used by another ${kindLabelFor(values.type)} in this model`,
      });
    }
  });
}
