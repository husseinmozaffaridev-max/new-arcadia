"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { isProjectLayer } from "@/modules/project/domain/constants/permissions";
import { canViewLayer } from "@/modules/project/domain/services/permissions";
import { getProjectById } from "@/modules/project/presentation/server-actions/get-by-id";
import { getElementsByModelId } from "../../presentation/server-actions/get-elements-by-model-id";
import { getModelsByProjectId } from "../../presentation/server-actions/get-models-by-project-id";
import { getTraceLinksByProjectId } from "../../presentation/server-actions/get-trace-links-by-project-id";
import { LAYER_PAIRS } from "../constants/trace-link";
import type { Element } from "../types/element";
import type { LayerValue } from "../types/layer";
import { TraceLayerPair } from "./trace-layer-pair";
import { TraceLayerPairListSkeleton } from "./trace-layer-pair-list-skeleton";

type TraceLayerPairListProps = {
  params?: Promise<{ id: string }>;
};

export function TraceLayerPairList({}: TraceLayerPairListProps = {}) {
  const routeParams = useParams<{ id: string }>();
  const projectId = routeParams?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["trace-layer-pair-list", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const [models, traceLinks, projectRes] = await Promise.all([
        getModelsByProjectId(projectId),
        getTraceLinksByProjectId(projectId),
        getProjectById(Number(projectId)).catch(() => null),
      ]);

      const permissions = projectRes?.data?.permissions ?? [];
      const modelList = models.data ?? [];
      const modelIds = modelList.map((model) => model.id);

      const elementsResults = await Promise.all(
        modelIds.map((id) => getElementsByModelId(id)),
      );

      const elementsByModelId = new Map<string, Element[]>();

      modelIds.forEach((id, index) => {
        const elements = elementsResults[index]?.data ?? [];
        elementsByModelId.set(
          id,
          elements.map((element) => ({
            id: element.id,
            name: element.name,
            type: element.type,
            modelId: element.modelId,
            updatedAt: element.updatedAt,
            createdAt: element.createdAt,
            description: element.description,
            parentId: element.parentId,
            status: element.properties.status,
          })),
        );
      });

      return {
        permissions,
        models: modelList,
        traceLinks: traceLinks.data ?? [],
        elementsByModelId,
      };
    },
    enabled: Boolean(projectId),
  });

  if (isLoading || !data || !projectId) {
    return <TraceLayerPairListSkeleton />;
  }

  const { permissions, models, traceLinks, elementsByModelId } = data;

  const canView = (layer: LayerValue) =>
    isProjectLayer(layer) ? canViewLayer(permissions, layer) : true;

  const visiblePairs = LAYER_PAIRS.filter(
    ({ upper, lower }) => canView(upper) && canView(lower),
  );

  if (visiblePairs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No layer pairs are visible with your current role.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {visiblePairs.map(({ upper, lower, label }) => (
        <TraceLayerPair
          key={label}
          upper={upper}
          lower={lower}
          label={label}
          projectId={projectId}
          models={models}
          traceLinks={traceLinks}
          elementsByModelId={elementsByModelId}
        />
      ))}
    </div>
  );
}
