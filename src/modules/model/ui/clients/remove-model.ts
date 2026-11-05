import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { removeModel } from "../../presentation/server-actions/remove-model";

export function useRemoveModel() {
  const queryClient = useQueryClient();
  return useServerMutation({
    mutationFn: removeModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
