"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import { Suspense } from "react";
import { useGetMe } from "@/modules/auth/ui/clients/get-me";
import { getProjectById } from "@/modules/project/presentation/server-actions/get-by-id";
import { getProjectMembers } from "@/modules/project/presentation/server-actions/get-members";
import { getProjectRoles } from "@/modules/project/presentation/server-actions/get-roles";
import { MembersPanel } from "@/modules/project/ui/components/members-panel";
import { Skeleton } from "@/modules/shared/ui/components/ui/skeleton";

function MembersSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-xl border bg-card p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
          <div key={i} className="flex items-center justify-between px-3 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const projectId = Number(id);

  const { data: user } = useGetMe();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["project-members-page", projectId],
    queryFn: async () => {
      if (!Number.isFinite(projectId) || projectId <= 0) {
        throw new Error("Invalid project ID");
      }

      const [projectResult, membersResult, rolesResult] = await Promise.all([
        getProjectById(projectId),
        getProjectMembers({ projectId }),
        getProjectRoles(),
      ]);

      if (!projectResult.success || !projectResult.data) {
        throw new Error("Project not found");
      }

      return {
        project: projectResult.data,
        members: membersResult.data ?? [],
        roles: rolesResult.data ?? [],
      };
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <MembersSkeleton />;
  }

  if (isError || !data) {
    notFound();
  }

  return (
    <MembersPanel
      projectId={projectId}
      projectName={data.project.name}
      permissions={data.project.permissions}
      currentUserId={user?.id ?? null}
      initialMembers={data.members}
      initialRoles={data.roles}
    />
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<MembersSkeleton />}>
      <MembersContent />
    </Suspense>
  );
}
