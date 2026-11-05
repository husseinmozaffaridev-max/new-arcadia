import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { removeElement } from "../../presentation/server-actions/remove-element";

export function useRemoveElement() {
  const queryClient = useQueryClient();
  return useServerMutation({
    mutationFn: removeElement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
