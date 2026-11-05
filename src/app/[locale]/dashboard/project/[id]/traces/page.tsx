"use client";

import { TraceHeaderBreadcrumb } from "@/modules/model/ui/components/trace-header-breadcrumb";
import { TraceLayerPairList } from "@/modules/model/ui/components/trace-layer-pair-list";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <TraceHeaderBreadcrumb />
      <TraceLayerPairList />
    </div>
  );
}
