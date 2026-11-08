"use client";

import { Suspense } from "react";
import { TraceHeaderBreadcrumb } from "@/modules/model/ui/components/trace-header-breadcrumb";
import { TraceLayerPairList } from "@/modules/model/ui/components/trace-layer-pair-list";
import { Skeleton } from "@/modules/shared/ui/components/ui/skeleton";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <Suspense fallback={<Skeleton className="w-full h-8" />}>
        <TraceHeaderBreadcrumb />
      </Suspense>
      <Suspense fallback={<Skeleton className="w-full h-32" />}>
        <TraceLayerPairList />
      </Suspense>
    </div>
  );
}
