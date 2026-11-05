"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, use, useCallback } from "react";
import { Input } from "@/modules/shared/ui/components/ui/input";

type SearchInputProps = {
  params?: Promise<{ search?: string }>;
};

export function SearchInput({ params }: SearchInputProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const paramValue = params ? use(params).search : undefined;
  const defaultValue = paramValue ?? searchParams.get("search") ?? "";

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        defaultValue={defaultValue}
        className="pl-9 pr-9 w-64"
        aria-label="Search projects"
        placeholder="Search projects..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      {defaultValue && (
        <button
          type="button"
          onClick={() => handleSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
