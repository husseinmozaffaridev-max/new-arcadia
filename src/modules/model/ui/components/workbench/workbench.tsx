"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import {
  GitMerge,
  Home,
  PanelBottom,
  PanelLeft,
  PanelRight,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { isProjectLayer } from "@/modules/project/domain/constants/permissions";
import { canAny } from "@/modules/project/domain/services/permissions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/modules/shared/ui/components/ui/breadcrumb";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/modules/shared/ui/components/ui/resizable";
import { Spinner } from "@/modules/shared/ui/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/modules/shared/ui/components/ui/tooltip";
import { cn } from "@/modules/shared/ui/libs/cn";
import { resolveDiagramLayer } from "../../helpers/diagram";
import { getLayerInfo } from "../../helpers/layer";
import {
  type PanelVisibility,
  useWorkbenchStore,
} from "../../stores/workbench";
import type {
  ClassDiagramData,
  ClassElementData,
} from "../../types/class-diagram";
import type { Diagram } from "../../types/diagram";
import type { Element } from "../../types/element";
import type { LayerValue } from "../../types/layer";
import type { Model } from "../../types/model";
import { ArcadiaInfoModal } from "../arcadia-info-modal";
import { EditorArea } from "./editor-area";
import { ExplorerPanel } from "./explorer-panel";
import { LayerSwitcher } from "./layer-switcher";
import { OutlinePanel } from "./outline-panel";
import { PalettePanel } from "./palette-panel";
import { PropertiesPanel } from "./properties-panel";
import { SemanticBrowserPanel } from "./semantic-browser-panel";
import { TransitionWizard } from "./transition-wizard";
import { ValidationPanel } from "./validation-panel";

const MembersSheet = dynamic(() =>
  import("@/modules/project/ui/components/members-sheet").then(
    (mod) => mod.MembersSheet,
  ),
);

export type WorkbenchModelData = {
  model: Model;
  /** Merged arch + class elements (backward-compatible) */
  elements: Element[];
  /** Merged arch + class diagrams (backward-compatible) */
  diagrams: Diagram[];
  /** Architecture-only elements */
  archElements: Element[];
  /** Class diagram elements (raw ClassElementData) */
  classElements: ClassElementData[];
  /** Architecture-only diagrams */
  archDiagrams: Diagram[];
  /** Scenario diagrams (OIS, SS, LS, PS) */
  scenarioDiagrams: Diagram[];
  /** Class diagrams (CDB) */
  classDiagrams: Diagram[];
};

export type WorkbenchProps = {
  projectId: string;
  projectName: string;
  modelData: WorkbenchModelData[];
  /** Permissions of the requesting user (RBAC). */
  permissions?: string[];
};

export function Workbench({
  projectId,
  projectName,
  modelData,
  permissions,
}: WorkbenchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const panels = useWorkbenchStore((s) => s.panels);
  const currentProjectId = useWorkbenchStore((s) => s.projectId);
  const openTab = useWorkbenchStore((s) => s.openTab);
  const resetForProject = useWorkbenchStore((s) => s.resetForProject);
  const currentLayer = useWorkbenchStore((s) => s.currentLayer);
  const setCurrentLayer = useWorkbenchStore((s) => s.setCurrentLayer);

  const [transitionModel, setTransitionModel] = useState<Model | null>(null);

  useEffect(() => {
    if (currentProjectId !== projectId) {
      resetForProject(projectId, projectName);
    }
  }, [projectId, projectName, currentProjectId, resetForProject]);

  const setProjectPermissions = useWorkbenchStore(
    (s) => s.setProjectPermissions,
  );
  const permissionsResolved = useWorkbenchStore((s) => s.permissionsResolved);

  useEffect(() => {
    setProjectPermissions(permissions ?? []);
  }, [permissions, setProjectPermissions]);

  /**
   * RBAC: layers the requesting user may read. The store resolves this
   * fail-closed, so nothing renders before the API answer is known.
   */
  const visibleLayers = useWorkbenchStore(
    useShallow((s): LayerValue[] => s.visibleLayers()),
  );

  /**
   * RBAC: only models whose layer the requester may read. The explorer,
   * deep links and layer switching all read from this list, so a hidden
   * layer (e.g. System Analysis for an OA-only member) never surfaces.
   */
  const visibleModelData = useMemo(
    () =>
      modelData.filter(
        (d) =>
          !isProjectLayer(d.model.layer) ||
          visibleLayers.includes(d.model.layer),
      ),
    [modelData, visibleLayers],
  );

  // Keep the workbench on a readable layer, prioritizing layers with existing models
  useEffect(() => {
    if (!permissionsResolved) return;

    if (visibleLayers.includes(currentLayer)) {
      const currentHasModel = visibleModelData.some(
        (d) => d.model.layer === currentLayer,
      );
      if (!currentHasModel && visibleModelData.length > 0) {
        const firstWithModel = visibleModelData[0].model.layer;
        setCurrentLayer(firstWithModel);
      }
      return;
    }

    const firstWithModel = visibleModelData.find((d) =>
      visibleLayers.includes(d.model.layer),
    )?.model.layer;
    const [fallback] = visibleLayers;
    const target = firstWithModel ?? fallback;
    if (target) setCurrentLayer(target);
  }, [
    permissionsResolved,
    visibleLayers,
    visibleModelData,
    currentLayer,
    setCurrentLayer,
  ]);

  const deepLinkDiagramId = searchParams.get("diagram");
  const openedDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    if (!permissionsResolved) return;
    if (!deepLinkDiagramId) return;
    if (openedDeepLinkRef.current === deepLinkDiagramId) return;

    for (const { model, diagrams } of visibleModelData) {
      const diagram = diagrams.find((d) => d.id === deepLinkDiagramId);

      if (diagram) {
        openedDeepLinkRef.current = deepLinkDiagramId;

        openTab({
          diagramId: diagram.id,
          modelId: model.id,
          name: diagram.name,
          type: diagram.type,
          layer: resolveDiagramLayer(diagram.type, model.layer),
        });

        break;
      }
    }
  }, [permissionsResolved, deepLinkDiagramId, visibleModelData, openTab]);

  const handleLayerChange = (layer: LayerValue, modelId: string) => {
    setCurrentLayer(layer);

    const layerData = visibleModelData.find((d) => d.model.layer === layer);
    if (layerData && layerData.diagrams.length > 0) {
      const diagram = layerData.diagrams[0];
      openTab({
        diagramId: diagram.id,
        modelId: layerData.model.id,
        name: diagram.name,
        type: diagram.type,
        layer: resolveDiagramLayer(diagram.type, layerData.model.layer),
      });
    }
  };

  const allModels = useMemo(
    () => visibleModelData.map((d) => d.model),
    [visibleModelData],
  );

  const queryClient = useQueryClient();
  const refreshTree = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    router.refresh();
  }, [queryClient, router]);

  const showRightDock = panels.outline || panels.semantic || panels.validation;

  // RBAC: never paint the workbench before the project's permissions are known.
  if (!permissionsResolved) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-full min-h-0 flex-col bg-background">
        <WorkbenchMenuBar projectName={projectName} />

        <LayerSwitcher
          models={allModels}
          layers={visibleLayers}
          currentLayer={currentLayer}
          onLayerChange={handleLayerChange}
          onTransition={setTransitionModel}
        />

        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
        >
          {panels.explorer && (
            <>
              <ResizablePanel
                id="explorer"
                defaultSize={300}
                minSize={100}
                maxSize={400}
                collapsible
                className="min-w-0"
              >
                <ExplorerPanel
                  projectId={projectId}
                  modelData={visibleModelData}
                  onTreeChanged={refreshTree}
                  onTransition={setTransitionModel}
                />
              </ResizablePanel>

              <ResizeHandle />
            </>
          )}

          <ResizablePanel id="center" minSize={30} className="min-w-0">
            <ResizablePanelGroup orientation="vertical" className="min-h-0">
              <ResizablePanel id="editor-row" minSize={30} className="min-h-0">
                <ResizablePanelGroup
                  orientation="horizontal"
                  className="min-h-0"
                >
                  <ResizablePanel id="canvas" minSize={40} className="min-w-0">
                    <EditorArea />
                  </ResizablePanel>

                  <ResizeHandle />

                  <ResizablePanel
                    id="palette"
                    minSize={100}
                    maxSize={400}
                    defaultSize={300}
                    className="min-w-0"
                  >
                    <PalettePanel modelData={visibleModelData} />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>

              {panels.properties && (
                <>
                  <ResizeHandle />

                  <ResizablePanel
                    id="properties"
                    minSize={100}
                    maxSize={400}
                    defaultSize={200}
                    collapsible
                    className="min-h-0"
                  >
                    <PropertiesPanel projectId={projectId} />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {showRightDock && (
            <>
              <ResizeHandle />

              <ResizablePanel
                id="right-dock"
                defaultSize={100}
                minSize={100}
                maxSize={300}
                collapsible
                className="min-w-0"
              >
                <RightDock panels={panels} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {transitionModel && (
          <TransitionWizard
            open={!!transitionModel}
            onOpenChange={(open) => !open && setTransitionModel(null)}
            projectId={projectId}
            sourceModel={transitionModel}
            sourceElements={
              modelData.find((m) => m.model.id === transitionModel.id)
                ?.elements ?? []
            }
            onCompleted={() => {
              setTransitionModel(null);
              refreshTree();
            }}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}

function RightDock({ panels }: { panels: PanelVisibility }) {
  const openPanels: Array<"outline" | "semantic" | "validation"> = [];
  if (panels.outline) openPanels.push("outline");
  if (panels.semantic) openPanels.push("semantic");
  if (panels.validation) openPanels.push("validation");

  if (openPanels.length === 0) return null;

  if (openPanels.length === 1) {
    if (openPanels[0] === "outline") return <OutlinePanel />;
    if (openPanels[0] === "semantic") return <SemanticBrowserPanel />;
    return <ValidationPanel />;
  }

  return (
    <ResizablePanelGroup orientation="vertical">
      {openPanels.includes("outline") && (
        <ResizablePanel id="outline" defaultSize={500}>
          <OutlinePanel />
        </ResizablePanel>
      )}

      {openPanels.includes("outline") &&
        (openPanels.includes("semantic") ||
          openPanels.includes("validation")) && <ResizeHandle />}

      {openPanels.includes("semantic") && (
        <ResizablePanel id="semantic">
          <SemanticBrowserPanel />
        </ResizablePanel>
      )}

      {openPanels.includes("semantic") && openPanels.includes("validation") && (
        <ResizeHandle />
      )}

      {openPanels.includes("validation") && (
        <ResizablePanel id="validation">
          <ValidationPanel />
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}

function ResizeHandle({ className }: { className?: string }) {
  return (
    <ResizableHandle
      withHandle
      className={cn(
        "bg-border transition-colors hover:bg-primary/40 data-resize-handle-active:bg-primary",
        className,
      )}
    />
  );
}

function WorkbenchMenuBar({ projectName }: { projectName: string }) {
  const panels = useWorkbenchStore((s) => s.panels);
  const projectId = useWorkbenchStore((s) => s.projectId);
  const togglePanel = useWorkbenchStore((s) => s.togglePanel);
  const projectPermissions = useWorkbenchStore((s) => s.projectPermissions);
  const permissionsResolved = useWorkbenchStore((s) => s.permissionsResolved);
  const activeTab = useWorkbenchStore((s) =>
    s.tabs.find((t) => t.diagramId === s.activeDiagramId),
  );
  const currentLayer = useWorkbenchStore((s) => s.currentLayer);
  const layer = getLayerInfo(activeTab?.layer ?? currentLayer);
  const [membersOpen, setMembersOpen] = useState(false);

  // RBAC: the Members page is only reachable with a member-management grant.
  const canOpenMembers =
    permissionsResolved &&
    canAny(projectPermissions, ["manageMembers", "addMembers"]);

  const toggles: {
    key: keyof PanelVisibility;
    label: string;
    icon: typeof PanelLeft;
  }[] = [
    { key: "explorer", label: "Project Explorer", icon: PanelLeft },
    { key: "properties", label: "Properties", icon: PanelBottom },
    { key: "outline", label: "Outline", icon: PanelRight },
    { key: "semantic", label: "Semantic Browser", icon: Workflow },
    { key: "validation", label: "Validation", icon: ShieldCheck },
  ];

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted/40 px-3">
      <Breadcrumb className="flex-1 min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/project">Projects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/project/${projectId}`}>
                {projectName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{layer.label}</BreadcrumbPage>
          </BreadcrumbItem>
          {activeTab && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeTab.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1">
        <ArcadiaInfoModal projectId={projectId} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/dashboard/project/${projectId}/traces`}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Traceability Matrix"
            >
              <GitMerge className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Traceability Matrix</TooltipContent>
        </Tooltip>
        {canOpenMembers && projectId && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setMembersOpen(true)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                  aria-label="Members"
                >
                  <Users className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Members</TooltipContent>
            </Tooltip>
            <MembersSheet
              open={membersOpen}
              onOpenChange={setMembersOpen}
              projectId={Number(projectId)}
              projectName={projectName}
              permissions={projectPermissions}
            />
          </>
        )}
        <div className="w-px h-4 bg-border mx-1" />
        {toggles.map(({ key, label, icon: Icon }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => togglePanel(key)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  panels[key]
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
                aria-pressed={panels[key]}
                aria-label={`Toggle ${label}`}
              >
                <Icon className="size-4" />
              </button>
            </TooltipTrigger>

            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
