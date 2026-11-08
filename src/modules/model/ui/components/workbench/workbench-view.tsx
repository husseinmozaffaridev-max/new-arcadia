"use client";

import { notFound, useParams } from "next/navigation";
import { Spinner } from "@/modules/shared/ui/components/ui/spinner";
import { useGetWorkbenchData } from "../../clients/get-workbench-data";
import { Workbench } from "./workbench";

type WorkbenchViewProps = {
  projectId?: string;
  params?: Promise<{ id: string }>;
};

export function WorkbenchView({
  projectId: propProjectId,
}: WorkbenchViewProps = {}) {
  const routeParams = useParams<{ id: string }>();
  const id = propProjectId ?? routeParams?.id;

  const { data, isLoading, isError } = useGetWorkbenchData(id);

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
      projectId={String(data.project.id)}
      modelData={data.modelData}
      projectName={data.project.name}
      permissions={data.project.permissions}
    />
  );
}
