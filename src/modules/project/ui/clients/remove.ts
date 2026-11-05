import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { remove } from "../../presentation/server-actions/remove";
import { GET_ALL_PROJECTS_KEY } from "./get-all";

export function useRemoveProject() {
  const queryClient = useQueryClient();

  return useServerMutation<boolean, number>({
    mutationFn: remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_ALL_PROJECTS_KEY });
    },
  });
}
