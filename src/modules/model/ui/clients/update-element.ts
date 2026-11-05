import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { updateElement } from "../../presentation/server-actions/update-element";

export function useUpdateElement() {
  const queryClient = useQueryClient();
  return useServerMutation({
    mutationFn: updateElement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
