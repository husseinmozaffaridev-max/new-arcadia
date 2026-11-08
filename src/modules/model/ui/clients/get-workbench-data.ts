import { useServerQuery } from "@/modules/shared/ui/hooks/use-query";
import { getWorkbenchData } from "../../presentation/server-actions/get-workbench-data";

export const getWorkbenchDataKey = (projectId?: string) => [
  "workbench-data",
  projectId,
];

export function useGetWorkbenchData(projectId?: string) {
  return useServerQuery({
    enabled: Boolean(projectId),
    queryKey: getWorkbenchDataKey(projectId),
    queryFn: () => getWorkbenchData(projectId as string),
  });
}
