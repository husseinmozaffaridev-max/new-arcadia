import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { removeDiagram } from "../../presentation/server-actions/remove-diagram";

export function useRemoveDiagram() {
  const queryClient = useQueryClient();
  return useServerMutation({
    mutationFn: (id: string) => removeDiagram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
