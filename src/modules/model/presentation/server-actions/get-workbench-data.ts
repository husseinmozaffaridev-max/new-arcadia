"use server";

import { cacheTag } from "next/cache";
import { getProjectById } from "@/modules/project/presentation/server-actions/get-by-id";
import { cookiesStorageService } from "@/modules/shared/infrastructure/services";
import { fail, type IRes, ok } from "@/modules/shared/utils/response";
import type {
  ClassElementData,
  ClassElementTypeValue,
  ClassStatus,
} from "../../ui/types/class-diagram";
import type { DiagramTypeValue } from "../../ui/types/diagram";
import type {
  WorkbenchData,
  WorkbenchModelData,
} from "../../ui/types/workbench";
import { getClassDiagramsByModelId } from "./get-class-diagrams-by-model-id";
import { getClassElementsByModelId } from "./get-class-elements-by-model-id";
import { getDiagramsByModelId } from "./get-diagrams-by-model-id";
import { getElementsByModelId } from "./get-elements-by-model-id";
import { getModelsByProjectId } from "./get-models-by-project-id";
import { getScenariosByModelId } from "./get-scenarios-by-model-id";

export async function getWorkbenchData(
  projectId: string,
): Promise<IRes<WorkbenchData>> {
  "use cache: private";
  cacheTag(`workbench-data-${projectId}`);

  try {
    const token = await cookiesStorageService.get("token");
    if (!token) {
      throw new Error("Token is required.");
    }

    const projectIdNum = Number(projectId);
    if (!Number.isFinite(projectIdNum) || projectIdNum <= 0) {
      throw new Error("Invalid project ID");
    }

    const [projectResult, modelsResult] = await Promise.all([
      getProjectById(projectIdNum),
      getModelsByProjectId(projectId),
    ]);

    const project = projectResult.data;
    if (!projectResult.success || !project) {
      throw new Error("Project not found");
    }

    const models = modelsResult.data ?? [];

    const modelData: WorkbenchModelData[] = await Promise.all(
      models.map(async (model) => {
        const [
          elementsResult,
          diagramsResult,
          classElementsResult,
          classDiagramsResult,
          scenariosResult,
        ] = await Promise.all([
          getElementsByModelId(model.id),
          getDiagramsByModelId(model.id),
          getClassElementsByModelId(model.id),
          getClassDiagramsByModelId(model.id),
          getScenariosByModelId({ modelId: model.id }),
        ]);

        const archElements = (elementsResult.data ?? []).map((el) => ({
          id: el.id,
          modelId: el.modelId,
          type: el.type,
          name: el.name,
          description: el.description,
          parentId: el.parentId,
          status: el.properties.status,
          createdAt: el.createdAt,
          updatedAt: el.updatedAt,
        }));

        const classElements: ClassElementData[] = (
          classElementsResult.data ?? []
        ).map((el) => ({
          id: el.id,
          modelId: el.modelId,
          layer: el.layer,
          name: el.name,
          elementType: el.elementType as ClassElementTypeValue,
          isAbstract: el.isAbstract,
          isStatic: el.isStatic,
          parentId: el.parentId,
          ordering: el.ordering,
          status: el.status as ClassStatus,
          extensionProperties: el.extensionProperties,
          createdAt: el.createdAt,
          updatedAt: el.updatedAt,
        }));

        const archDiagrams = diagramsResult.data ?? [];

        const scenarioDiagrams = (scenariosResult.data ?? []).map((s) => ({
          id: s.id,
          modelId: s.modelId,
          type: s.scenarioType as DiagramTypeValue,
          name: s.name,
          description: s.description,
          viewport: { x: 0, y: 0, zoom: 1 },
          elementLayouts: [],
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));

        const classDiagrams = (classDiagramsResult.data ?? []).map((d) => ({
          id: d.id,
          modelId: d.modelId,
          type: "CDB" as const,
          name: d.name,
          description: d.description,
          viewport: d.viewport,
          elementLayouts: d.elementLayouts,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }));

        return {
          model,
          elements: archElements,
          diagrams: [...archDiagrams, ...scenarioDiagrams, ...classDiagrams],
          archElements,
          classElements,
          archDiagrams,
          scenarioDiagrams,
          classDiagrams,
        };
      }),
    );

    return ok({
      project,
      modelData,
    });
  } catch (error) {
    return fail(error);
  }
}
