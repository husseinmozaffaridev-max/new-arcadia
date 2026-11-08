import type { IUseCase } from "@/modules/shared/application/interfaces/use-case";
import { resolveErrorMessage } from "@/modules/shared/utils/resolve-error-message";
import { User } from "../../domain/entities/user";
import type { IUserRepository } from "../ports/user";

export type ChangePasswordPayload = {
  token: string;
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type ChangePasswordResponse = {
  id: number;
  name: string;
  username: string;
  createdAt: string;
  updatedAt: string;
};

export class ChangePasswordUseCase
  implements IUseCase<ChangePasswordPayload, ChangePasswordResponse>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResponse> {
    try {
      const response = await this.userRepository.changePassword({
        token: payload.token,
        current_password: payload.current_password,
        password: payload.password,
        password_confirmation: payload.password_confirmation,
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
      throw new Error(resolveErrorMessage(error, "Error changing password"));
    }
  }
}
