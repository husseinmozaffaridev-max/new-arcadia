"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";
import { getFragmentsByScenarioIdKey } from "../../clients/get-fragments-by-scenario-id";
import { getLifelinesByScenarioIdKey } from "../../clients/get-lifelines-by-scenario-id";
import { getMessagesByScenarioIdKey } from "../../clients/get-messages-by-scenario-id";
import { useUpdateFragment } from "../../clients/update-fragment";
import { useUpdateLifeline } from "../../clients/update-lifeline";
import { useUpdateMessage } from "../../clients/update-message";
import {
  isClassDiagramElement,
  isClassDiagramRelationship,
} from "../../helpers/class-diagram";
import { useCanvasStore } from "../../stores/canvas";
import { useScenarioSelectionStore } from "../../stores/scenario-selection";
import { useWorkbenchStore } from "../../stores/workbench";
import {
  ClassEdgeProperties,
  ClassNodeProperties,
} from "../class-properties-panel";
import { DiagramPropertiesPanel } from "../diagram-properties-panel";
import { ScenarioPropertiesPanel } from "../scenario-properties-panel";

const SCENARIO_DIAGRAM_TYPES = [
  "OIS",
  "OAS",
  "SS",
  "SAS",
  "LS",
  "LAS",
  "PS",
  "PAS",
];

/**
 * PropertiesPanel
 *
 * بسته‌بندی پنل خصوصیات برای داک پایین Workbench.
 * بسته به نوع دیاگرام فعال، پنل مناسب را نمایش می‌دهد.
 */
export function PropertiesPanel({ projectId }: { projectId: string }) {
  const activeDiagramId = useWorkbenchStore((s) => s.activeDiagramId);
  const tabs = useWorkbenchStore((s) => s.tabs);
  const queryClient = useQueryClient();
  const updateLifeline = useUpdateLifeline();
  const updateMessage = useUpdateMessage();
  const updateFragment = useUpdateFragment();

  const activeTab = tabs.find((t) => t.diagramId === activeDiagramId);
  const isScenario = SCENARIO_DIAGRAM_TYPES.includes(activeTab?.type ?? "");

  const node = useCanvasStore(
    useShallow((state) =>
      state.nodes.find((node) => node.id === state.selectedNodeId),
    ),
  );

  const edge = useCanvasStore(
    useShallow((state) =>
      state.edges.find((edge) => edge.id === state.selectedEdgeId),
    ),
  );

  const selectedLifeline = useScenarioSelectionStore((s) => s.selectedLifeline);
  const selectedMessage = useScenarioSelectionStore((s) => s.selectedMessage);
  const selectedFragment = useScenarioSelectionStore((s) => s.selectedFragment);

  if (isScenario) {
    const scenarioId = activeDiagramId ?? "";
    return (
      <ScenarioPropertiesPanel
        scenarioId={scenarioId}
        selectedLifeline={selectedLifeline}
        selectedMessage={selectedMessage}
        selectedFragment={selectedFragment}
        onUpdateLifeline={({ id, name }) => {
          updateLifeline.mutate(
            { id, name },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: getLifelinesByScenarioIdKey(scenarioId),
                });
              },
            },
          );
        }}
        onUpdateMessage={({ id, name }) => {
          updateMessage.mutate(
            { id, name },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: getMessagesByScenarioIdKey(scenarioId),
                });
              },
            },
          );
        }}
        onUpdateFragment={({ id, name, guard }) => {
          updateFragment.mutate(
            { id, name, guard },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: getFragmentsByScenarioIdKey(scenarioId),
                });
              },
            },
          );
        }}
      />
    );
  }

  if (node && isClassDiagramElement(node.data.elementType)) {
    return <ClassNodeProperties node={node} />;
  }

  if (
    edge &&
    isClassDiagramRelationship(edge.data?.relationshipType as string)
  ) {
    return <ClassEdgeProperties edge={edge} />;
  }

  return <DiagramPropertiesPanel projectId={projectId} />;
}
