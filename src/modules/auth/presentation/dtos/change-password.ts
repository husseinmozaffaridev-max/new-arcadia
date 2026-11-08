export type ChangePasswordDTOProps = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export class ChangePasswordDTO {
  public readonly current_password: string;
  public readonly password: string;
  public readonly password_confirmation: string;

  private constructor(props: ChangePasswordDTOProps) {
    this.current_password = props.current_password;
    this.password = props.password;
    this.password_confirmation = props.password_confirmation;
  }

  static create(data: ChangePasswordDTOProps): ChangePasswordDTO {
    const current_password = ChangePasswordDTO.validateCurrentPassword(
      data.current_password,
    );
    const password = ChangePasswordDTO.validatePassword(data.password);
    const password_confirmation =
      ChangePasswordDTO.validatePasswordConfirmation(
        data.password_confirmation,
        data.password,
      );

    return new ChangePasswordDTO({
      current_password,
      password,
      password_confirmation,
    });
  }

  private static validateCurrentPassword(password: string): string {
    if (!password) {
      throw new Error("Current password is required.");
    }
    return password;
  }

  private static validatePassword(password: string): string {
    if (!password) {
      throw new Error("New password is required.");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    return password;
  }

  private static validatePasswordConfirmation(
    confirmation: string,
    password: string,
  ): string {
    if (!confirmation) {
      throw new Error("Password confirmation is required.");
    }
    if (confirmation !== password) {
      throw new Error("Password confirmation does not match.");
    }
    return confirmation;
  }
}
