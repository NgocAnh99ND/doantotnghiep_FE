// api/driver/typeds.ts

export type DriverDTO = {
  driver_id: number;
  user_name: string;
  phone: string;
  rating: number;
};

export type DriverDetailResponse =
  | { success: true; data: DriverDTO }
  | { success: false; message?: string; mess?: string; error?: string };
