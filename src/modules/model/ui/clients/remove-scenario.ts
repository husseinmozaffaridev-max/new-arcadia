import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { removeScenario } from "../../presentation/server-actions/remove-scenario";

export function useRemoveScenario() {
  const queryClient = useQueryClient();
  return useServerMutation({
    mutationFn: (payload: { id: string }) => removeScenario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
