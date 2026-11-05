"use client";

import { Suspense } from "react";
import { WorkbenchView } from "@/modules/model/ui/components/workbench/workbench-view";
import { Spinner } from "@/modules/shared/ui/components/ui/spinner";

function WorkbenchLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<WorkbenchLoading />}>
      <WorkbenchView />
    </Suspense>
  );
}
