import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import type { AddProjectMemberResponse } from "../../application/ports/project";
import type { AddProjectMemberDTOProps } from "../../presentation/dtos/add-member";
import { addProjectMember } from "../../presentation/server-actions/add-member";

export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useServerMutation<AddProjectMemberResponse, AddProjectMemberDTOProps>({
    mutationFn: addProjectMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", variables.projectId],
      });
    },
  });
}
