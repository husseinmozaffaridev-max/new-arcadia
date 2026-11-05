import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { removeClassElement } from "../../presentation/server-actions/remove-class-element";

type RemoveClassElementVariables = { id: string; modelId: string };

export function useRemoveClassElement() {
  const queryClient = useQueryClient();
  return useServerMutation<boolean, RemoveClassElementVariables>({
    mutationFn: ({ id, modelId }) => removeClassElement({ id, modelId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
