"use server";

import { fail, type IRes, ok } from "@/modules/shared/utils/response";
import { updateTag } from "next/cache";
import { ConnectionPolicy } from "../../domain/policies/connection";
import type { ElementTypeValue } from "../../domain/value-objects/element-type";
import type { LayerValue } from "../../domain/value-objects/layer";
import type { TraceLinkTypeValue } from "../../domain/value-objects/relationship-type";
import { connectElements } from "./connect-elements";
import { createElement } from "./create-element";
import { createModel } from "./create-model";
import { createTraceLink } from "./create-trace-link";
import { getModelsByProjectId } from "./get-models-by-project-id";
import { getRelationshipsByModelId } from "./get-relationships-by-model-id";

export type TransitionMapping = {
  sourceElementId: string;
  targetType: ElementTypeValue;
  targetName: string;
  traceType: TraceLinkTypeValue;
};

export type TransitionLayerPayload = {
  projectId: string;
  sourceModelId: string;
  sourceLayer: LayerValue;
  targetLayer: LayerValue;
  targetModelName: string;
  mappings: TransitionMapping[];
};

export type TransitionLayerResponse = {
  targetModelId: string;
  createdElements: number;
  createdTraceLinks: number;
  createdDiagrams: number;
  createdRelationships: number;
};

/**
 * transitionLayer
 *
 * گذار از یک لایه Arcadia به لایه بعدی (OA→SA→LA→PA).
 * مطابق با متدولوژی Arcadia و رفتار Capella:
 * - برای هر نگاشت: یک المنت در لایه مقصد می‌سازد و یک trace link از نوع
 *   Realization بین المنت جدید (مبدأ trace) و المنت قدیمی (مقصد trace) ایجاد می‌کند.
 * - روابطی را که هر دو سرِ آن‌ها گذار کرده‌اند — در صورت مجاز بودن در لایه جدید — بازسازی می‌کند.
 * - طبق متدولوژی Arcadia/Capella، دیاگرام‌ها به عنوان نماهای محلی هرگز جابجا یا کپی نمی‌شوند.
 */
export async function transitionLayer(
  payload: TransitionLayerPayload,
): Promise<IRes<TransitionLayerResponse>> {
  try {
    const {
      projectId,
      sourceModelId,
      sourceLayer,
      targetLayer,
      targetModelName,
      mappings,
    } = payload;

    if (mappings.length === 0) {
      throw new Error("No elements selected to transition");
    }

    // ۱) مدل لایه مقصد را پیدا یا ایجاد کن + داده‌های روابط لایه مبدأ را بخوان
    const [modelsRes, sourceRelationshipsRes] =
      await Promise.all([
        getModelsByProjectId(projectId),
        getRelationshipsByModelId(sourceModelId),
      ]);
    if (!modelsRes.success) throw new Error(modelsRes.message);

    let targetModelId = modelsRes.data.find((m) => m.layer === targetLayer)?.id;

    if (!targetModelId) {
      const created = await createModel({
        projectId,
        layer: targetLayer,
        name: targetModelName || `${targetLayer} Model`,
      });
      if (!created.success) throw new Error(created.message);
      targetModelId = created.data.id;
    }

    // ۲) برای هر نگاشت: المنت جدید + trace link
    let createdElements = 0;
    let createdTraceLinks = 0;

    /** شناسه هر المنتِ مبدأ → (شناسه و نوعِ) المنت جدید در لایه مقصد */
    const transitioned = new Map<
      string,
      { id: string; type: ElementTypeValue }
    >();

    for (const mapping of mappings) {
      const elementRes = await createElement({
        type: mapping.targetType,
        layer: targetLayer,
        modelId: targetModelId,
        name: mapping.targetName,
      });
      if (!elementRes.success) throw new Error(elementRes.message);
      createdElements += 1;
      transitioned.set(mapping.sourceElementId, {
        id: elementRes.data.id,
        type: mapping.targetType,
      });

      const traceRes = await createTraceLink({
        projectId,
        type: mapping.traceType,
        // المنت جدید (لایه مقصد) المنت قدیمی (لایه مبدأ) را realize می‌کند
        sourceModelId: targetModelId,
        sourceLayer: targetLayer,
        sourceElementId: elementRes.data.id,
        targetModelId: sourceModelId,
        targetLayer: sourceLayer,
        targetElementId: mapping.sourceElementId,
      });
      if (traceRes.success) createdTraceLinks += 1;
    }

    // ۳) روابطی که هر دو سرشان گذار کرده‌اند را در لایه مقصد بساز
    let createdRelationships = 0;

    for (const relationship of sourceRelationshipsRes.data ?? []) {
      const source = transitioned.get(relationship.sourceElementId);
      const target = transitioned.get(relationship.targetElementId);
      if (!source || !target) continue;

      const relationshipType = ConnectionPolicy.resolveTransitionType(
        source.type,
        target.type,
        relationship.type,
      );
      if (!relationshipType) continue;

      const connectRes = await connectElements({
        modelId: targetModelId,
        sourceElementId: source.id,
        targetElementId: target.id,
        relationshipType,
        name: relationship.name,
        description: relationship.description,
        properties: relationship.properties,
      });
      if (connectRes.success) createdRelationships += 1;
    }

    updateTag(`get-models-by-project-id-${projectId}`);
    updateTag(`get-elements-by-model-id-${targetModelId}`);
    updateTag(`get-relationships-by-model-id-${targetModelId}`);

    return ok({
      targetModelId,
      createdElements,
      createdTraceLinks,
      createdDiagrams: 0,
      createdRelationships,
    });
  } catch (error) {
    return fail(error);
  }
}
