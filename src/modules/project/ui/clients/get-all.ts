import { useServerQuery } from "@/modules/shared/ui/hooks/use-query";
import type { GetAllProjectsResponse } from "../../application/use-cases/get-all";
import { getAllProjects } from "../../presentation/server-actions/get-all";

export const GET_ALL_PROJECTS_KEY = ["GET_ALL_PROJECTS"];

export function useGetAllProjects() {
  return useServerQuery<GetAllProjectsResponse>({
    queryKey: GET_ALL_PROJECTS_KEY,
    queryFn: getAllProjects,
  });
}
