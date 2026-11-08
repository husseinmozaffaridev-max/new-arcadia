import type { IUseCase } from "@/modules/shared/application/interfaces/use-case";
import { resolveErrorMessage } from "@/modules/shared/utils/resolve-error-message";
import { User } from "../../domain/entities/user";
import type { IUserRepository } from "../ports/user";

export type UpdateMePayload = {
  token: string;
  name: string;
};

export type UpdateMeResponse = {
  id: number;
  name: string;
  username: string;
  createdAt: string;
  updatedAt: string;
};

export class UpdateMeUseCase
  implements IUseCase<UpdateMePayload, UpdateMeResponse>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(payload: UpdateMePayload): Promise<UpdateMeResponse> {
    try {
      const response = await this.userRepository.updateMe({
        token: payload.token,
        name: payload.name,
      });

      const user = User.reconstitute({
        id: response.id,
        name: response.name,
        username: response.username,
        createdAt: response.created_at.toString(),
        updatedAt: response.updated_at.toString(),
      });

      return user.toJSON();
    } catch (error) {
      throw new Error(resolveErrorMessage(error, "Error updating profile"));
    }
  }
}
