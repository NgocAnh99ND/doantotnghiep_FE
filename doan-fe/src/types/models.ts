export type UserRole = "DRIVER" | "PASSENGER" | "ADMIN";

// BE returns snake_case keys: user_id, user_name, phone, role (see AuthRepository JSON)
export type User = {
  user_id: number;
  user_name: string;
  phone: string;
  role: "DRIVER" | "PASSENGER";
  rating?: number;
  passenger_id?: number | null;
};

export type ApiBase = {
  success: boolean;
  message?: string;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  user?: User;
  passenger_id?: number | null; // ✅ thêm
};

export type RegisterResponse = {
  success: boolean;
  message?: string;
  user?: User;
  passenger_id?: number | null; // ✅ thêm
};

export type LogoutResponse = {
  success: boolean;
  message?: string;
};
