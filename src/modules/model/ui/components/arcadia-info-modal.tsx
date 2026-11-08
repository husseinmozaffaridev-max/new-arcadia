"use client";

import {
  ArrowRight,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronRight,
  GitBranchPlus,
  GitMerge,
  Layers,
  Lightbulb,
  Puzzle,
  Search,
  Shapes,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/modules/shared/ui/components/ui/badge";
import { Button } from "@/modules/shared/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/modules/shared/ui/components/ui/dialog";
import { Input } from "@/modules/shared/ui/components/ui/input";
import { ScrollArea } from "@/modules/shared/ui/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shared/ui/components/ui/tabs";
import { cn } from "@/modules/shared/ui/libs/cn";
import { DIAGRAMS_BY_LAYER } from "../constants/diagram";
import { ELEMENT_VISUAL, ELEMENTS_BY_LAYER } from "../constants/element";
import { LAYER_COLORS, OFFERED_LAYERS } from "../constants/layer";
import { getElementTypeInfo } from "../helpers/element";
import type { LayerValue } from "../types/layer";

export function ArcadiaInfoModal({ projectId }: { projectId: string | null }) {
  const t = useTranslations("arcadiaGuide");

  const [open, setOpen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<LayerValue | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<
    "diagrams" | "elements" | "features"
  >("diagrams");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{t("title")}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {activeTab !== "features" && (
          <>
            {/* Layer Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedLayer === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLayer("ALL")}
                className="h-7 text-xs"
              >
                {t("allLayers")}
              </Button>
              {OFFERED_LAYERS.map((layer) => {
                const colors = LAYER_COLORS[layer.value];
                return (
                  <Button
                    key={layer.value}
                    variant={
                      selectedLayer === layer.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedLayer(layer.value)}
                    className={cn(
                      "h-7 text-xs",
                      selectedLayer === layer.value &&
                        `${colors.activeBg} ${colors.text} border ${colors.border}`,
                    )}
                  >
                    {layer.value}
                  </Button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-9 pl-9 pr-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "diagrams" | "elements" | "features")
          }
        >
          <TabsList className="h-auto p-1 bg-muted/50">
            <TabsTrigger
              value="diagrams"
              className={cn(
                "flex-1 gap-2 h-9 text-sm font-medium transition-all cursor-pointer  data-[state=active]:text-white",
              )}
            >
              <Layers className="h-4 w-4" />
              {t("diagrams")}
            </TabsTrigger>
            <TabsTrigger
              value="elements"
              className={cn(
                "flex-1 gap-2 h-9 text-sm font-medium transition-all cursor-pointer data-[state=active]:text-white",
              )}
            >
              <Shapes className="h-4 w-4" />
              {t("elements")}
            </TabsTrigger>
            <TabsTrigger
              value="features"
              className={cn(
                "flex-1 gap-2 h-9 text-sm font-medium transition-all cursor-pointer data-[state=active]:text-white",
              )}
            >
              <Lightbulb className="h-4 w-4" />
              {t("features")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagrams" className="mt-2 flex-1 w-full">
            <ScrollArea className="h-[50vh]">
              <DiagramList
                selectedLayer={selectedLayer}
                searchQuery={searchQuery}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="elements" className="mt-2 flex-1 w-full">
            <ScrollArea className="h-[50vh]">
              <ElementList
                selectedLayer={selectedLayer}
                searchQuery={searchQuery}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="features" className="mt-2 flex-1 w-full">
            <ScrollArea className="h-[50vh]">
              <FeatureList projectId={projectId} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Feature List ─────────────────────────────────────────────────────────────

const FEATURES: Array<{
  key: "traceability" | "validation" | "transition" | "counts";
  icon: typeof GitMerge;
}> = [
  { key: "traceability", icon: GitMerge },
  { key: "validation", icon: ShieldCheck },
  { key: "transition", icon: GitBranchPlus },
  { key: "counts", icon: Boxes },
];

function FeatureList({ projectId }: { projectId: string | null }) {
  const t = useTranslations("arcadiaGuide");

  return (
    <div className="grid gap-3 pr-4">
      {FEATURES.map(({ key, icon: Icon }) => {
        const href =
          key === "traceability" && projectId
            ? `/dashboard/project/${projectId}/traces`
            : null;

        return (
          <div
            key={key}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon className="size-3.5 text-primary" />
              </span>
              <p className="text-sm font-medium">
                {t(`featureList.${key}.label` as never)}
              </p>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {t(`featureList.${key}.desc` as never)}
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[10px] text-muted-foreground/80">
                {t(`featureList.${key}.hint` as never)}
              </p>
              {href && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-xs"
                  asChild
                >
                  <Link href={href}>
                    {t("openMatrix" as never)}
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Diagram List ──────────────────────────────────────────────────────────────

function DiagramList({
  selectedLayer,
  searchQuery,
}: {
  selectedLayer: LayerValue | "ALL";
  searchQuery: string;
}) {
  const t = useTranslations("arcadiaGuide");
  const layers =
    selectedLayer === "ALL"
      ? OFFERED_LAYERS
      : OFFERED_LAYERS.filter((l) => l.value === selectedLayer);

  const query = searchQuery.toLowerCase().trim();

  const allFiltered = layers.flatMap((layer) => {
    const diagramTypes = DIAGRAMS_BY_LAYER[layer.value];
    if (query) {
      return diagramTypes.filter((dv) => {
        const label = t(`diagramTypes.${dv}.label` as never).toLowerCase();
        const desc = t(`diagramTypes.${dv}.desc` as never).toLowerCase();
        return (
          label.includes(query) ||
          desc.includes(query) ||
          dv.toLowerCase().includes(query)
        );
      });
    }
    return diagramTypes;
  });

  if (query && allFiltered.length === 0) {
    return (
      <EmptyState icon={Search} message={t("noResults")} query={searchQuery} />
    );
  }

  return (
    <div className="space-y-6 pr-4">
      {layers.map((layer) => {
        const diagramTypes = DIAGRAMS_BY_LAYER[layer.value];
        const colors = LAYER_COLORS[layer.value];

        const filteredTypes = query
          ? diagramTypes.filter((dv) => {
              const label = t(
                `diagramTypes.${dv}.label` as never,
              ).toLowerCase();
              const desc = t(`diagramTypes.${dv}.desc` as never).toLowerCase();
              return (
                label.includes(query) ||
                desc.includes(query) ||
                dv.toLowerCase().includes(query)
              );
            })
          : diagramTypes;

        if (filteredTypes.length === 0) return null;

        return (
          <div key={layer.value} className="space-y-3">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                colors.bg,
              )}
            >
              <Badge
                variant="outline"
                className={cn("text-xs font-bold", colors.text, colors.border)}
              >
                {layer.value}
              </Badge>
              <span className={cn("text-sm font-semibold", colors.text)}>
                {t(`layers.${layer.value}` as never)}
              </span>
            </div>

            <div className="grid gap-3 pl-2">
              {filteredTypes.map((diagramValue) => (
                <DiagramCard key={diagramValue} diagramValue={diagramValue} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DiagramCard({ diagramValue }: { diagramValue: string }) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("arcadiaGuide");
  const layer = OFFERED_LAYERS.find((l) =>
    DIAGRAMS_BY_LAYER[l.value].includes(diagramValue as never),
  );
  const colors = layer ? LAYER_COLORS[layer.value] : LAYER_COLORS.OA;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden transition-all",
        colors.border,
        expanded && "ring-1 ring-primary/20",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
          expanded ? "bg-muted/30" : "hover:bg-muted/50",
        )}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {diagramValue}
            </span>
            <span
              className={cn(
                "font-medium text-sm",
                expanded && "text-foreground",
              )}
            >
              {t(`diagramTypes.${diagramValue}.label` as never)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t(`diagramTypes.${diagramValue}.desc` as never)}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t bg-muted/10">
          <div className="pt-3 space-y-2.5">
            <InfoRow
              icon={<Target className="h-3.5 w-3.5" />}
              label={t("purpose")}
              value={t(`diagramTypes.${diagramValue}.purpose` as never)}
            />
            <InfoRow
              icon={<Puzzle className="h-3.5 w-3.5" />}
              label={t("contains")}
              value={t(`diagramTypes.${diagramValue}.contains` as never)}
            />
            <InfoRow
              icon={<Lightbulb className="h-3.5 w-3.5" />}
              label={t("usedFor")}
              value={t(`diagramTypes.${diagramValue}.usedFor` as never)}
            />
            <InfoRow
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              label={t("capellaEquiv")}
              value={t(`diagramTypes.${diagramValue}.capella` as never)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Element List ──────────────────────────────────────────────────────────────

function ElementList({
  selectedLayer,
  searchQuery,
}: {
  selectedLayer: LayerValue | "ALL";
  searchQuery: string;
}) {
  const t = useTranslations("arcadiaGuide");
  const layers =
    selectedLayer === "ALL"
      ? OFFERED_LAYERS
      : OFFERED_LAYERS.filter((l) => l.value === selectedLayer);

  const query = searchQuery.toLowerCase().trim();

  const allFiltered = layers.flatMap((layer) => {
    const elementTypes = ELEMENTS_BY_LAYER[layer.value];
    if (query) {
      return elementTypes.filter((ev) => {
        const label = t(`elementTypes.${ev}.label` as never).toLowerCase();
        const desc = t(`elementTypes.${ev}.desc` as never).toLowerCase();
        return (
          label.includes(query) ||
          desc.includes(query) ||
          ev.toLowerCase().includes(query)
        );
      });
    }
    return elementTypes;
  });

  if (query && allFiltered.length === 0) {
    return (
      <EmptyState icon={Search} message={t("noResults")} query={searchQuery} />
    );
  }

  return (
    <div className="space-y-6 pr-4">
      {layers.map((layer) => {
        const elementTypes = ELEMENTS_BY_LAYER[layer.value];
        const colors = LAYER_COLORS[layer.value];

        const filteredTypes = query
          ? elementTypes.filter((ev) => {
              const label = t(
                `elementTypes.${ev}.label` as never,
              ).toLowerCase();
              const desc = t(`elementTypes.${ev}.desc` as never).toLowerCase();
              return (
                label.includes(query) ||
                desc.includes(query) ||
                ev.toLowerCase().includes(query)
              );
            })
          : elementTypes;

        if (filteredTypes.length === 0) return null;

        return (
          <div key={layer.value} className="space-y-3">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                colors.bg,
              )}
            >
              <Badge
                variant="outline"
                className={cn("text-xs font-bold", colors.text, colors.border)}
              >
                {layer.value}
              </Badge>
              <span className={cn("text-sm font-semibold", colors.text)}>
                {t(`layers.${layer.value}` as never)}
              </span>
            </div>

            <div className="grid gap-3 pl-2">
              {filteredTypes.map((elementValue) => (
                <ElementCard key={elementValue} elementValue={elementValue} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ElementCard({ elementValue }: { elementValue: string }) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("arcadiaGuide");
  const visual = ELEMENT_VISUAL[elementValue as keyof typeof ELEMENT_VISUAL];

  const layerBadge = getElementTypeInfo(elementValue).layer;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden transition-all",
        expanded && "ring-1 ring-primary/20",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
          expanded ? "bg-muted/30" : "hover:bg-muted/50",
        )}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Color preview from ELEMENT_VISUAL */}
        {visual && (
          <div
            className={cn(
              "shrink-0 border-2 transition-transform",
              expanded && "scale-110",
              visual.shape === "ellipse" && "rounded-full w-8 h-8",
              visual.shape === "rounded-rectangle" && "rounded-lg w-8 h-8",
              visual.shape === "rectangle" && "rounded-sm w-8 h-8",
            )}
            style={{
              backgroundColor: visual.fillColor,
              borderColor: visual.strokeColor,
            }}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-medium text-sm",
                expanded && "text-foreground",
              )}
            >
              {t(`elementTypes.${elementValue}.label` as never)}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {layerBadge}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t(`elementTypes.${elementValue}.desc` as never)}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t bg-muted/10">
          <div className="pt-3 space-y-2.5">
            <InfoRow
              icon={<Target className="h-3.5 w-3.5" />}
              label={t("purpose")}
              value={t(`elementTypes.${elementValue}.purpose` as never)}
            />
            <InfoRow
              icon={<Lightbulb className="h-3.5 w-3.5" />}
              label={t("example")}
              value={t(`elementTypes.${elementValue}.example` as never)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  message,
  query,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  query: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">"{query}"</p>
    </div>
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2.5 text-xs">
      <span className="text-primary shrink-0 mt-0.5">{icon}</span>
      <div>
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground ml-1">{value}</span>
      </div>
    </div>
  );
}
