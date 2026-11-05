import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import { removeProjectMember } from "../../presentation/server-actions/remove-member";

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useServerMutation<boolean, { projectId: number; userId: number }>({
    mutationFn: removeProjectMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", variables.projectId],
      });
    },
  });
}
