import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import type { UpdateProjectMemberRoleResponse } from "../../application/ports/project";
import type { UpdateProjectMemberRoleDTOProps } from "../../presentation/dtos/update-member-role";
import { updateProjectMemberRole } from "../../presentation/server-actions/update-member-role";

export function useUpdateProjectMemberRole() {
  const queryClient = useQueryClient();

  return useServerMutation<
    UpdateProjectMemberRoleResponse,
    UpdateProjectMemberRoleDTOProps
  >({
    mutationFn: updateProjectMemberRole,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", variables.projectId],
      });
    },
  });
}
