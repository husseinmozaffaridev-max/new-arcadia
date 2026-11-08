"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useCallback, useMemo } from "react";
import {
  Avatar,
  AvatarFallback,
} from "@/modules/shared/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/shared/ui/components/ui/dropdown-menu";
import type { GetMeResponse } from "../../application/use-cases/get-me";
import { useGetMe } from "../clients/get-me";
import { useLogout } from "../clients/logout";

type Props = {
  /** User prefetched on the server so the avatar renders on first paint. */
  user?: GetMeResponse;
};

export function UserMenu({ user: prefetchedUser }: Props) {
  const { data: user } = useGetMe({ initialData: prefetchedUser });
  const logout = useLogout();
  const router = useRouter();

  const abbr = useMemo(() => {
    if (user?.name?.trim()) {
      const [name, family] = user.name.split(" ");
      if (!name && !family) {
        return "U";
      }

      const nameAbbr = name.charAt(0).toUpperCase();
      const familyAbbr = family?.charAt(0).toUpperCase() ?? "";
      return name && family ? `${nameAbbr}${familyAbbr}` : nameAbbr;
    }

    return "U";
  }, [user?.name]);

  const handleLogout = useCallback(() => {
    logout.mutate(undefined, {
      onSuccess() {
        router.replace("/auth/login");
      },
    });
  }, [logout, router]);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] font-medium">
              {abbr}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          <p className="font-medium text-sm">{user.name}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
