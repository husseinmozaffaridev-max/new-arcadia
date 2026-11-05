"use client";

import { ProjectListSection } from "@/modules/project/ui/components/project-list-section";
import { ProjectToolbar } from "@/modules/project/ui/components/project-toolbar";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <ProjectToolbar />
      <div className="p-6">
        <ProjectListSection />
      </div>
    </div>
  );
}
