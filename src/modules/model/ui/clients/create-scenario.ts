import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { createScenario } from "../../presentation/server-actions/create-scenario";

export function useCreateScenario() {
  const queryClient = useQueryClient();
  return useServerMutation({
    mutationFn: (payload: {
      modelId: string;
      name: string;
      description?: string;
      scenarioType: string;
    }) => createScenario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
