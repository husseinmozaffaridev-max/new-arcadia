"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import { getProjectById } from "@/modules/project/presentation/server-actions/get-by-id";
import { Spinner } from "@/modules/shared/ui/components/ui/spinner";
import { getClassDiagramsByModelId } from "../../../presentation/server-actions/get-class-diagrams-by-model-id";
import { getClassElementsByModelId } from "../../../presentation/server-actions/get-class-elements-by-model-id";
import { getDiagramsByModelId } from "../../../presentation/server-actions/get-diagrams-by-model-id";
import { getElementsByModelId } from "../../../presentation/server-actions/get-elements-by-model-id";
import { getModelsByProjectId } from "../../../presentation/server-actions/get-models-by-project-id";
import { getScenariosByModelId } from "../../../presentation/server-actions/get-scenarios-by-model-id";
import type {
  ClassElementData,
  ClassElementTypeValue,
  ClassStatus,
} from "../../types/class-diagram";
import type { DiagramTypeValue } from "../../types/diagram";
import { Workbench, type WorkbenchModelData } from "./workbench";

type WorkbenchViewProps = {
  projectId?: string;
  params?: Promise<{ id: string }>;
};

export function WorkbenchView({
  projectId: propProjectId,
}: WorkbenchViewProps = {}) {
  const routeParams = useParams<{ id: string }>();
  const id = propProjectId ?? routeParams?.id;
  const projectIdNum = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["workbench-data", id],
    queryFn: async () => {
      if (!Number.isFinite(projectIdNum) || projectIdNum <= 0) {
        throw new Error("Invalid project ID");
      }

      const [projectResult, modelsResult] = await Promise.all([
        getProjectById(projectIdNum),
        getModelsByProjectId(id!),
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

          // Map scenario diagrams from separate repository to Diagram shape
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

          // Map class diagrams to the same Diagram shape as architecture diagrams
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

      return {
        project,
        modelData,
      };
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    notFound();
  }

  return (
    <Workbench
      projectId={id!}
      modelData={data.modelData}
      projectName={data.project.name}
      permissions={data.project.permissions}
    />
  );
}
