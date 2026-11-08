"use client";

import {
  ArrowRight,
  Calendar,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { canPerform } from "@/modules/project/domain/services/resource-action";
import { Badge } from "@/modules/shared/ui/components/ui/badge";
import { Button } from "@/modules/shared/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/shared/ui/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/modules/shared/ui/components/ui/tooltip";
import { cn } from "@/modules/shared/ui/libs/cn";
import type { Project } from "../types/project";

const MAX_VISIBLE_ROLES = 2;

const LAYER_COLORS: Record<string, { dot: string; badge: string }> = {
  OA: {
    dot: "bg-blue-500",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60",
  },
  SA: {
    dot: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60",
  },
  LA: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
  },
  PA: {
    dot: "bg-purple-500",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800/60",
  },
};

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onMembers: (project: Project) => void;
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onMembers,
}: ProjectCardProps) {
  const t = useTranslations("project");
  const tc = useTranslations("common");
  const locale = useLocale();
  const canEditProject = canPerform(project.permissions, "project", "edit");
  const canDeleteProject = canPerform(project.permissions, "project", "delete");
  const canManageMembers =
    canPerform(project.permissions, "member", "create") ||
    canPerform(project.permissions, "member", "manage");
  const date = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(project.updatedAt));
  const visibleRoles = project.roles.slice(0, MAX_VISIBLE_ROLES);
  const hiddenRoles = project.roles.slice(MAX_VISIBLE_ROLES);
  const hiddenRoleLabels = hiddenRoles.map((role) => t(`roles.${role}`));

  return (
    <div className="group relative h-full transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link
        href={`/dashboard/project/${project.id}`}
        className="flex h-full flex-col rounded-xl border bg-card p-5 touch-manipulation transition-[box-shadow,border-color] duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
      >
        {/* Icon */}
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10">
          <Layers className="h-5 w-5 text-primary" />
        </div>

        {/* Title + description */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          {project.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">
              {t("noDescription")}
            </p>
          )}
        </div>

        {/* Layer indicators */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {Object.entries(LAYER_COLORS).map(([layer, colors]) => (
            <div
              key={layer}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border",
                colors.badge,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
              {layer}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex shrink-0 items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {t("role")}:
            </span>
            {visibleRoles.map((role) => (
              <Badge key={role} variant="secondary" className="text-[11px]">
                {t(`roles.${role}`)}
              </Badge>
            ))}
            {hiddenRoles.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    aria-label={`${t("moreRoles", {
                      count: hiddenRoles.length,
                    })}: ${hiddenRoleLabels.join(", ")}`}
                    className="cursor-default text-[11px]"
                  >
                    +{hiddenRoles.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{hiddenRoleLabels.join(", ")}</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {date}
            </span>
            <div className="flex shrink-0 items-center gap-1 font-medium text-primary opacity-0 transition-opacity any-pointer-coarse:opacity-100 group-hover:opacity-100">
              {t("open")}
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </Link>

      {/* Card actions sit outside the link so the card stays a single valid,
          keyboard-friendly target. Always visible on touch devices. */}
      {(canEditProject || canDeleteProject) && (
        <div className="absolute top-5 right-5 flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label={t("actions")}
                className="relative h-8 w-8 rounded-lg cursor-pointer touch-manipulation opacity-0 transition-opacity after:absolute after:-inset-1.5 after:content-[''] any-pointer-coarse:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {canManageMembers && (
                <DropdownMenuItem onSelect={() => onMembers(project)}>
                  {t("membersLink")}
                </DropdownMenuItem>
              )}
              {canManageMembers && (canEditProject || canDeleteProject) && (
                <DropdownMenuSeparator />
              )}
              {canEditProject && (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="h-4 w-4 mr-2" /> {t("editProject")}
                </DropdownMenuItem>
              )}
              {canEditProject && canDeleteProject && <DropdownMenuSeparator />}
              {canDeleteProject && (
                <DropdownMenuItem
                  onClick={() => onDelete(project)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> {tc("delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
