import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { createDiagram } from "../../presentation/server-actions/create-diagram";

export function useCreateDiagram() {
  const queryClient = useQueryClient();
  return useServerMutation({
    mutationFn: createDiagram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
