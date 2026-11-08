"use client";

import { Home } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Suspense } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/modules/shared/ui/components/ui/breadcrumb";
import { NewProjectButton } from "./new-project-button";
import { SearchInput } from "./search-input";

type ProjectToolbarProps = {
  searchParams?: Promise<{ search?: string }>;
};

export function ProjectToolbar({ searchParams }: ProjectToolbarProps) {
  return (
    <div className="sticky bg-background top-0 z-10 border-b">
      <div className="px-6 py-4">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create and manage your architecture models
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Suspense fallback={<div></div>}>
              <SearchInput params={searchParams} />
            </Suspense>
            <NewProjectButton />
          </div>
        </div>
      </div>
    </div>
  );
}
