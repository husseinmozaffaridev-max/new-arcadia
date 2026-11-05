"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/modules/shared/ui/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="flex max-w-sm flex-col gap-1.5">
        <p className="text-base font-semibold">Page not found</p>
        <p className="text-sm text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard/project">Back to dashboard</Link>
      </Button>
    </div>
  );
}
