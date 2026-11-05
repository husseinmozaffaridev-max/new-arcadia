import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import type { UpdateProjectResponse } from "../../application/use-cases/update";
import type { UpdateProjectDTOProps } from "../../presentation/dtos/update";
import { update } from "../../presentation/server-actions/update";
import { GET_ALL_PROJECTS_KEY } from "./get-all";

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useServerMutation<UpdateProjectResponse, UpdateProjectDTOProps>({
    mutationFn: update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_ALL_PROJECTS_KEY });
    },
  });
}
