import { apiClient } from '../client/base';
import { API_ENDPOINTS } from '../config';
import {
  LoginRequest,
  LoginResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ApiResponse,
} from '../types';

export class AuthApiService {
  /**
   * Login with phone number and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      console.log('Login API Response ====================================');
      console.log('Full Response:', JSON.stringify(response, null, 2));
      console.log('====================================');
      
      // Check statusCode instead of success field (200-299 are successful)
      const isSuccess = response.statusCode && response.statusCode >= 200 && response.statusCode < 300;
      
      // Handle response where token/user might be at root level or in data field
      // TypeScript workaround: cast to any first to access dynamic properties
      const responseData = response as any;
      const token = responseData.token || responseData.data?.token;
      const user = responseData.user || responseData.data?.user;
      const requiresOtp = responseData.requiresOtp || responseData.data?.requiresOtp;
      
      console.log('Extracted values:', { token: !!token, user: !!user, requiresOtp });
      
      // Store token if login is successful and doesn't require OTP
      if (isSuccess && token && !requiresOtp) {
        console.log('Storing auth token...');
        await apiClient.setAuthToken(token);
      }

      return {
        success: isSuccess || false,
        message: response.message || 'Login processed',
        statusCode: response.statusCode,
        data: {
          token,
          user,
          requiresOtp,
        },
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * Verify OTP after login or registration
   */
  async verifyOtp(otpData: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.VERIFY_OTP,
        otpData
      );

      // Check statusCode instead of success field (200-299 are successful)
      const isSuccess = response.statusCode && response.statusCode >= 200 && response.statusCode < 300;

      // Handle response where token/user might be at root level or in data field
      const responseData = response as any;
      const token = responseData.token || responseData.data?.token;
      const user = responseData.user || responseData.data?.user;

      // Store token if verification is successful
      if (isSuccess && token) {
        await apiClient.setAuthToken(token);
      }

      return {
        success: isSuccess || false,
        message: response.message,
        statusCode: response.statusCode,
        data: {
          token: token!,
          user: user!,
        },
      };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: error.message || 'OTP verification failed',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );

      // Check statusCode instead of success field (200-299 are successful)
      const isSuccess = response.statusCode && response.statusCode >= 200 && response.statusCode < 300;

      // Handle response where user might be at root level or in data field
      const responseData = response as any;
      const user = responseData.user || responseData.data?.user;
      const requiresOtp = responseData.requiresOtp || responseData.data?.requiresOtp;

      return {
        success: isSuccess || false,
        message: response.message,
        statusCode: response.statusCode,
        data: {
          user,
          requiresOtp,
        },
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiClient.post<void>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data
      );

      // Check statusCode instead of success field (200-299 are successful)
      const isSuccess = response.statusCode && response.statusCode >= 200 && response.statusCode < 300;

      return {
        success: isSuccess || false,
        message: response.message,
        statusCode: response.statusCode,
      };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send password reset',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const response = await apiClient.post<void>(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        data
      );

      // Check statusCode instead of success field (200-299 are successful)
      const isSuccess = response.statusCode && response.statusCode >= 200 && response.statusCode < 300;

      return {
        success: isSuccess || false,
        message: response.message,
        statusCode: response.statusCode,
      };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: error.message || 'Password reset failed',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    try {
      const response = await apiClient.post<{ token: string }>(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN
      );

      // Update stored token
      if (response.success && response.data?.token) {
        await apiClient.setAuthToken(response.data.token);
      }

      return response;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      // Clear token on refresh failure
      await apiClient.clearAuthToken();
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
      
      // Always clear token on logout, regardless of API response
      await apiClient.clearAuthToken();
      
      return response;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear token even if logout API fails
      await apiClient.clearAuthToken();
      
      return {
        success: true, // Consider logout successful even if API fails
        message: 'Logged out successfully',
      };
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!apiClient.getAuthToken();
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return apiClient.getAuthToken();
  }
}

// Export singleton instance
export const authApiService = new AuthApiService();
export default authApiService;