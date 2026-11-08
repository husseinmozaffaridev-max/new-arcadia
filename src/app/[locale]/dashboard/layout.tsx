"use client";

import { Suspense, type ReactNode } from "react";
import { useGetMe } from "@/modules/auth/ui/clients/get-me";
import { UserMenu } from "@/modules/auth/ui/components/user-menu";
import { HeaderLogo } from "@/modules/shared/ui/components/common/header-logo";
import { ThemeToggle } from "@/modules/shared/ui/components/common/theme-toggle";
import { Skeleton } from "@/modules/shared/ui/components/ui/skeleton";

type Props = {
  children: ReactNode;
};

function UserMenuSection() {
  const { data: user, isLoading } = useGetMe();

  if (isLoading) {
    return <Skeleton className="size-7 rounded-full" />;
  }

  return <UserMenu user={user} />;
}

export default function Layout({ children }: Props) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 px-4">
        <HeaderLogo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="w-px h-4 bg-border/60 mx-1" />
          <Suspense fallback={<Skeleton className="size-7 rounded-full" />}>
            <UserMenuSection />
          </Suspense>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
