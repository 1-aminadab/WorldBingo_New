import { ApiError } from '../types';

export class ApiErrorHandler {
  static isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'success' in error && error.success === false;
  }

  static getErrorMessage(error: any): string {
    if (this.isApiError(error)) {
      return error.message || 'An unexpected error occurred';
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unexpected error occurred';
  }

  static getErrorCode(error: any): number {
    if (this.isApiError(error)) {
      return error.statusCode || 0;
    }
    return 0;
  }

  static isNetworkError(error: any): boolean {
    if (this.isApiError(error)) {
      return error.statusCode === 0 || error.error.includes('Network');
    }
    return false;
  }

  static isAuthenticationError(error: any): boolean {
    if (this.isApiError(error)) {
      return error.statusCode === 401;
    }
    return false;
  }

  static isValidationError(error: any): boolean {
    if (this.isApiError(error)) {
      return error.statusCode === 400 || error.statusCode === 422;
    }
    return false;
  }

  static isServerError(error: any): boolean {
    if (this.isApiError(error)) {
      return error.statusCode >= 500;
    }
    return false;
  }

  static handleError(error: any): {
    message: string;
    code: number;
    type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  } {
    const message = this.getErrorMessage(error);
    const code = this.getErrorCode(error);
    
    let type: 'network' | 'auth' | 'validation' | 'server' | 'unknown' = 'unknown';
    
    if (this.isNetworkError(error)) {
      type = 'network';
    } else if (this.isAuthenticationError(error)) {
      type = 'auth';
    } else if (this.isValidationError(error)) {
      type = 'validation';
    } else if (this.isServerError(error)) {
      type = 'server';
    }
    
    return { message, code, type };
  }
}

export const errorHandler = ApiErrorHandler;