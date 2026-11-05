import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { createClassElement } from "../../presentation/server-actions/create-class-element";

export function useCreateClassElement() {
  const queryClient = useQueryClient();
  return useServerMutation({
    mutationFn: createClassElement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbench-data"] });
    },
  });
}
