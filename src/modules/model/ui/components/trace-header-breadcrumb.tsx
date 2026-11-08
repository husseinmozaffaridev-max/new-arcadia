"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GitMerge } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { getProjectById } from "@/modules/project/presentation/server-actions/get-by-id";
import { Button } from "@/modules/shared/ui/components/ui/button";
import { Skeleton } from "@/modules/shared/ui/components/ui/skeleton";
import { getTraceLinksByProjectId } from "../../presentation/server-actions/get-trace-links-by-project-id";

type TraceHeaderBreadcrumbProps = {
  params?: Promise<{ id: string }>;
};

export function TraceHeaderBreadcrumb({}: TraceHeaderBreadcrumbProps = {}) {
  const routeParams = useParams<{ id: string }>();
  const projectId = routeParams?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["trace-header-breadcrumb", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const [project, traceLinks] = await Promise.all([
        getProjectById(+projectId),
        getTraceLinksByProjectId(projectId),
      ]);
      return { project, traceLinks };
    },
    enabled: Boolean(projectId),
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-6xl mx-auto w-full">
        <Skeleton className="w-full h-8" />
      </div>
    );
  }

  const { project, traceLinks } = data;

  return (
    <div className="flex items-start gap-4">
      <Button variant="ghost" size="icon" className="size-4 mt-0.5" asChild>
        <Link href={`/dashboard/project/${projectId}`}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold">Traceability Matrix</h1>
        {project?.data?.name && (
          <p className="mt-1 text-sm text-muted-foreground">
            {project.data.name}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <GitMerge className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {traceLinks?.data?.length ?? 0} links
        </span>
      </div>
    </div>
  );
}
