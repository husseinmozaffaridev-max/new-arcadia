"use client";

import { useGetMe } from "@/modules/auth/ui/clients/get-me";
import { ProfileSkeleton } from "@/modules/auth/ui/components/profile-skeleton";
import { ProfileView } from "@/modules/auth/ui/views/profile";

export default function ProfilePage() {
  const { data: user, isLoading } = useGetMe();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return <ProfileView user={user} />;
}
