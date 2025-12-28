export type UserRole = "DRIVER" | "PASSENGER" | "ADMIN";

// BE returns snake_case keys: user_id, user_name, phone, role (see AuthRepository JSON)
export type User = {
  user_id: number;
  user_name: string;
  phone: string;
  role: UserRole;
  rating?: number;
};

export type ApiBase = {
  success: boolean;
  message?: string;
};

export type LoginResponse = ApiBase & { user?: User };
export type RegisterResponse = ApiBase & { user?: User };
export type LogoutResponse = ApiBase & { user_id?: number | null; message?: string; success: boolean };
