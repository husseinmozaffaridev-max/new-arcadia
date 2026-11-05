"use client";

import { useSearchParams } from "next/navigation";
import { useGetAllProjects } from "../clients/get-all";
import { ProjectCardWrapper } from "./project-card-wrapper";
import { ProjectListEmpty } from "./project-list-empty";
import { ProjectListSkeleton } from "./project-list-skeleton";

type ProjectListSectionProps = {
  searchParams?: Promise<{ search?: string }>;
};

export function ProjectListSection({}: ProjectListSectionProps = {}) {
  const { data: projects, isLoading } = useGetAllProjects();
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  if (isLoading) {
    return <ProjectListSkeleton />;
  }

  const allProjects = projects ?? [];

  const filteredProjects = search
    ? allProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : allProjects;

  if (allProjects.length === 0) {
    return (
      <ProjectListEmpty
        showCreateButton
        title="No projects yet"
        description="Create your first project to start designing system architectures."
      />
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <ProjectListEmpty
        title="No results found"
        description={`No projects match "${search}". Try a different search term.`}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredProjects.map((project) => (
        <ProjectCardWrapper key={project.id} project={project} />
      ))}
    </div>
  );
}
