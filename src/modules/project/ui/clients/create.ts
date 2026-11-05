import { useQueryClient } from "@tanstack/react-query";
import { useServerMutation } from "@/modules/shared/ui/hooks/use-mutation";
import type { CreateProjectResponse } from "../../application/use-cases/create";
import type { CreateProjectDTOProps } from "../../presentation/dtos/create";
import { create } from "../../presentation/server-actions/create";
import { GET_ALL_PROJECTS_KEY } from "./get-all";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useServerMutation<CreateProjectResponse, CreateProjectDTOProps>({
    mutationFn: create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_ALL_PROJECTS_KEY });
    },
  });
}
