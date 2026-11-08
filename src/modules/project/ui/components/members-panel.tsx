"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
} from "@/modules/shared/ui/components/ui/avatar";
import { Badge } from "@/modules/shared/ui/components/ui/badge";
import { Button } from "@/modules/shared/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/shared/ui/components/ui/dropdown-menu";
import { Skeleton } from "@/modules/shared/ui/components/ui/skeleton";
import type { ProjectMemberData } from "../../application/ports/project";
import type { ProjectRoleDefinition } from "../../domain/constants/permissions";
import { filterAssignableRoles } from "../../domain/services/permissions";
import { canPerform } from "../../domain/services/resource-action";
import { useProjectMembers } from "../clients/get-members";
import { useProjectRoles } from "../clients/get-roles";
import { useRemoveProjectMember } from "../clients/remove-member";
import { AddMemberDialog } from "../components/add-member-dialog";
import { EditMemberRoleDialog } from "../components/edit-member-role-dialog";
import { ProjectMemberBadge } from "../components/project-member-role";
import {
  RemoveMemberDialog,
  type RemoveMemberDialogData,
} from "../components/remove-member-dialog";

type MembersPanelProps = {
  projectId: number;
  projectName: string;
  permissions: readonly string[];
  /** The requesting user, used to block self-removal. */
  currentUserId: number | null;
  /** "page" = standalone route; "sheet" = embedded in the members side panel. */
  variant?: "page" | "sheet";
  /** Server-prefetched members so the route renders without a client round-trip. */
  initialMembers?: ProjectMemberData[];
  /** Server-prefetched role definitions. */
  initialRoles?: ProjectRoleDefinition[];
};

function getInitials(name: string, username: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("");
  return (initials || Array.from(username).slice(0, 2).join("")).toUpperCase();
}

function MembersPanelSkeleton() {
  return (
    <div className="divide-y divide-border/60 rounded-xl border bg-card">
      {Array.from({ length: 4 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
        <div key={i} className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
            <div className="flex gap-1.5 pt-0.5">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="size-8 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function MembersPanel({
  projectId,
  projectName,
  permissions,
  currentUserId,
  variant = "page",
  initialMembers,
  initialRoles,
}: MembersPanelProps) {
  const t = useTranslations("project.members");
  const queryClient = useQueryClient();

  const membersQuery = useProjectMembers(projectId, initialMembers);
  const rolesQuery = useProjectRoles(initialRoles);

  const members = membersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const canManage = canPerform(permissions, "member", "manage");
  const canAdd = canPerform(permissions, "member", "create");

  // Inviter ceiling: only roles whose permissions fit within ours.
  const assignableRoles = useMemo(
    () => filterAssignableRoles(permissions, roles),
    [permissions, roles],
  );

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectMemberData | null>(null);
  const [removeTarget, setRemoveTarget] =
    useState<RemoveMemberDialogData | null>(null);

  const removeMember = useRemoveProjectMember();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
  };

  // RBAC: how many members can still manage other members. Removing or
  // demoting the last one would lock every remaining member out of the
  // project's member management.
  const managerCount = members.filter((member) =>
    canPerform(member.permissions, "member", "manage"),
  ).length;

  const isSelf = (member: ProjectMemberData) =>
    currentUserId !== null && member.userId === currentUserId;

  const isLastManager = (member: ProjectMemberData) =>
    canPerform(member.permissions, "member", "manage") && managerCount <= 1;

  const loading = membersQuery.isLoading || rolesQuery.isLoading;
  const failed =
    (membersQuery.isError && membersQuery.data === undefined) ||
    (rolesQuery.isError && rolesQuery.data === undefined);

  if (!canManage && !canAdd) {
    return (
      <div className={variant === "sheet" ? "p-4" : "p-6"}>
        <p className="text-sm text-muted-foreground">{t("noAccess")}</p>
      </div>
    );
  }

  const addButton = canAdd ? (
    <Button
      onClick={() => setAddOpen(true)}
      className="touch-manipulation any-pointer-coarse:min-h-11"
    >
      <UserPlus className="size-4" />
      {t("add")}
    </Button>
  ) : null;

  return (
    <div
      className={
        variant === "sheet"
          ? "flex flex-col gap-4 p-4"
          : "mx-auto flex w-full max-w-4xl flex-col gap-6 p-6"
      }
    >
      {variant === "page" ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("backToProject")}
                className="relative size-8 touch-manipulation after:absolute after:-inset-1.5 after:content-['']"
                asChild
              >
                <Link href={`/dashboard/project/${projectId}`}>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">
                {t("title", { name: projectName })}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          {addButton}
        </div>
      ) : (
        <div className="flex items-center justify-end">{addButton}</div>
      )}

      {loading ? (
        <MembersPanelSkeleton />
      ) : failed ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("loadError")}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 touch-manipulation"
            onClick={() => {
              membersQuery.refetch();
              rolesQuery.refetch();
            }}
          >
            <RotateCcw className="size-3.5" />
            {t("retry")}
          </Button>
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-6 py-12">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/10 bg-linear-to-br from-primary/10 to-primary/5">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium">{t("empty")}</p>
          <p className="text-xs text-muted-foreground">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-xl border bg-card">
          {members.map((member) => {
            const self = isSelf(member);
            const lastManager = isLastManager(member);
            const canEditMember = canManage && !lastManager;
            const canRemoveMember = canManage && !lastManager && !self;
            const hasActions = canEditMember || canRemoveMember;

            return (
              <div
                key={member.userId}
                className="flex items-start gap-3 px-4 py-4 sm:px-5"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(member.name, member.username)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium leading-tight">
                        <span className="truncate">{member.name}</span>
                        {self && (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[11px] font-normal"
                          >
                            {t("you")}
                          </Badge>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        @{member.username}
                        {variant === "page" && member.joinedAt && (
                          <>
                            {" · "}
                            {t("joinedAt")} {member.joinedAt}
                          </>
                        )}
                      </p>
                    </div>

                    {canManage &&
                      (hasActions ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`${t("actions")} — ${member.name}`}
                              className="relative size-8 shrink-0 touch-manipulation after:absolute after:-inset-2 after:content-['']"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {canEditMember && (
                              <DropdownMenuItem
                                onClick={() => setEditTarget(member)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                {t("changeRole")}
                              </DropdownMenuItem>
                            )}
                            {canEditMember && canRemoveMember && (
                              <DropdownMenuSeparator />
                            )}
                            {canRemoveMember && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setRemoveTarget({
                                    userId: member.userId,
                                    name: member.name,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("remove")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : lastManager ? (
                        <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                          {t("lastAdmin")}
                        </span>
                      ) : null)}
                  </div>

                  <div className="mt-2">
                    <ProjectMemberBadge roles={member.roles} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        assignableRoles={assignableRoles}
        onSuccess={refresh}
      />

      <EditMemberRoleDialog
        member={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        projectId={projectId}
        assignableRoles={assignableRoles}
        onSuccess={refresh}
      />

      <RemoveMemberDialog
        target={removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={(userId) =>
          new Promise<void>((resolve, reject) => {
            removeMember.mutate(
              { projectId, userId },
              {
                onSuccess: (data) => {
                  toast.success(data.message);
                  refresh();
                  resolve();
                },
                onError: (error) => {
                  toast.error(error.message);
                  reject(error);
                },
              },
            );
          })
        }
      />
    </div>
  );
}
