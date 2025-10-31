export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    token?: string;
    user?: ApiUser;
    requiresOtp?: boolean;
  };
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    token: string;
    user: ApiUser;
  };
}

export interface ApiUser {
  id: string;
  userId?: string;
  phoneNumber: string;
  fullName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
  isVerified?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  promoCode?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    user?: ApiUser;
    requiresOtp?: boolean;
  };
}

export interface ForgotPasswordRequest {
  phoneNumber: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  statusCode?: number;
}

export interface ResetPasswordRequest {
  phoneNumber: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  statusCode?: number;
}