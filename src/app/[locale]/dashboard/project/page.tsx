"use client";

import { Suspense } from "react";
import { ProjectListSection } from "@/modules/project/ui/components/project-list-section";
import { ProjectListSkeleton } from "@/modules/project/ui/components/project-list-skeleton";
import { ProjectToolbar } from "@/modules/project/ui/components/project-toolbar";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <ProjectToolbar />
      <div className="p-6">
        <Suspense fallback={<ProjectListSkeleton />}>
          <ProjectListSection />
        </Suspense>
      </div>
    </div>
  );
}
