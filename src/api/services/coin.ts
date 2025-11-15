import { apiClient } from '../client/base';
import { API_ENDPOINTS } from '../config';
import { ApiResponse } from '../types';

// Firestore timestamp type
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

// Helper function to convert Firestore timestamp to ISO string
function firestoreTimestampToString(timestamp: FirestoreTimestamp | string): string {
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
    return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000).toISOString();
  }
  return new Date().toISOString();
}

// Types for coin API responses
export interface CoinBalanceResponse {
  success: boolean;
  coin: number;
  updatedAt: FirestoreTimestamp | string;
  lastSettlementAt: FirestoreTimestamp | string;
  lastSettlementAmount: number;
}

export interface CoinSettleResponse {
  success: boolean;
  message: string;
  settled: number;
  remaining: number;
}

/**
 * Coin API Service
 * Handles coin balance retrieval and settlement operations
 */
export class CoinApiService {
  /**
   * Get current user's coin balance from backend
   * GET /api/v1/coin/
   */
  static async getCoinBalance(): Promise<ApiResponse<CoinBalanceResponse>> {
    const debugId = Math.random().toString(36).substr(2, 9);
    console.log(`🪙 [${debugId}] === GET COIN BALANCE ===`);
    
    try {
      console.log(`🪙 [${debugId}] Endpoint: ${API_ENDPOINTS.COIN.GET_BALANCE}`);
      console.log(`🪙 [${debugId}] Auth token available: ${!!apiClient.getAuthToken()}`);
      console.log(`🪙 [${debugId}] Making GET request...`);
      
      const startTime = Date.now();
      const response = await apiClient.get<CoinBalanceResponse>(
        API_ENDPOINTS.COIN.GET_BALANCE
      );
      const endTime = Date.now();
      
      console.log(`✅ [${debugId}] Request completed in ${endTime - startTime}ms`);
      console.log(`✅ [${debugId}] Response status: ${response.statusCode}`);
      console.log(`✅ [${debugId}] Response data:`, {
        success: response.success,
        coin: response.data?.coin,
        updatedAt: response.data?.updatedAt ? firestoreTimestampToString(response.data.updatedAt) : null,
        lastSettlementAt: response.data?.lastSettlementAt ? firestoreTimestampToString(response.data.lastSettlementAt) : null,
        lastSettlementAmount: response.data?.lastSettlementAmount
      });
      
      console.log(`✅ [${debugId}] Raw timestamps:`, {
        updatedAt_raw: response.data?.updatedAt,
        lastSettlementAt_raw: response.data?.lastSettlementAt
      });
      
      return response;
    } catch (error: any) {
      console.error(`❌ [${debugId}] GET coin balance failed`);
      console.error(`❌ [${debugId}] Error type:`, error.constructor?.name);
      console.error(`❌ [${debugId}] Error message:`, error.message);
      console.error(`❌ [${debugId}] Error details:`, {
        statusCode: error.statusCode,
        success: error.success,
        details: error.details
      });
      throw error;
    }
  }

  /**
   * Settle user's coins (set backend balance to 0)
   * POST /api/v1/coin/settle
   * Atomically sets the user's coin to 0 and returns the amount settled.
   * Call this only after you've delivered value to the client.
   */
  static async settleCoin(): Promise<ApiResponse<CoinSettleResponse>> {
    const debugId = Math.random().toString(36).substr(2, 9);
    console.log(`🪙 [${debugId}] === SETTLE COINS TO ZERO ===`);
    console.log(`🪙 [${debugId}] Purpose: Atomically set backend coins to 0 after delivering value to client`);
    
    try {
      console.log(`🪙 [${debugId}] Endpoint: ${API_ENDPOINTS.COIN.SETTLE}`);
      console.log(`🪙 [${debugId}] Method: POST`);
      console.log(`🪙 [${debugId}] Request body: none (empty POST)`);
      console.log(`🪙 [${debugId}] Auth token available: ${!!apiClient.getAuthToken()}`);
      console.log(`🪙 [${debugId}] Auth token length: ${apiClient.getAuthToken()?.length || 0} chars`);
      console.log(`🪙 [${debugId}] Making POST request to settle coins...`);
      
      const startTime = Date.now();
      const response = await apiClient.post<CoinSettleResponse>(
        API_ENDPOINTS.COIN.SETTLE
      );
      const endTime = Date.now();
      
      console.log(`✅ [${debugId}] POST request completed in ${endTime - startTime}ms`);
      console.log(`✅ [${debugId}] Response status: ${response.statusCode}`);
      console.log(`✅ [${debugId}] Full response data:`, {
        success: response.success,
        message: response.message,
        settled: response.data?.settled,
        remaining: response.data?.remaining,
        statusCode: response.statusCode
      });
      
      // Additional validation
      if (response.success) {
        console.log(`✅ [${debugId}] Settle operation successful!`);
        console.log(`💰 [${debugId}] Coins settled: ${response.data?.settled || 0}`);
        console.log(`💰 [${debugId}] Remaining on backend: ${response.data?.remaining || 0}`);
        console.log(`📝 [${debugId}] Backend message: "${response.message}"`);
        
        if (response.data?.remaining && response.data.remaining > 0) {
          console.warn(`⚠️ [${debugId}] Warning: Backend still has ${response.data.remaining} coins remaining!`);
        } else {
          console.log(`✅ [${debugId}] Perfect: Backend is now at 0 coins as expected`);
        }
      } else {
        console.error(`❌ [${debugId}] Settle operation failed according to response`);
      }
      
      return response;
    } catch (error: any) {
      console.error(`❌ [${debugId}] === SETTLE COINS FAILED ===`);
      console.error(`❌ [${debugId}] Error type:`, error.constructor?.name);
      console.error(`❌ [${debugId}] Error message:`, error.message);
      console.error(`❌ [${debugId}] HTTP status:`, error.statusCode);
      console.error(`❌ [${debugId}] Full error details:`, {
        statusCode: error.statusCode,
        success: error.success,
        message: error.message,
        details: error.details,
        stack: error.stack
      });
      
      // Check for common issues
      if (error.statusCode === 401) {
        console.error(`🔐 [${debugId}] Authentication error - token may be invalid or expired`);
      } else if (error.statusCode === 404) {
        console.error(`🔍 [${debugId}] Endpoint not found - check API version or URL`);
      } else if (error.statusCode >= 500) {
        console.error(`🚨 [${debugId}] Server error - backend issue`);
      }
      
      throw error;
    }
  }
}

export default CoinApiService;