export type GetMePayload = {
  token: string;
};

export type GetMeResponse = {
  id: number;
  name: string;
  username: string;
  created_at: Date;
  updated_at: Date;
};

export type UpdateMePayload = {
  token: string;
  name: string;
};

export type UpdateMeResponse = {
  id: number;
  name: string;
  username: string;
  created_at: Date;
  updated_at: Date;
};

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
  created_at: Date;
  updated_at: Date;
};

export type LogoutPayload = {
  token: string;
};

export interface IUserRepository {
  getMe(payload: GetMePayload): Promise<GetMeResponse>;
  updateMe(payload: UpdateMePayload): Promise<UpdateMeResponse>;
  changePassword(
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResponse>;
  logout(payload: LogoutPayload): Promise<void>;
}
