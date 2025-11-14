import { CoinApiService } from '../api/services/coin';
import { CoinStorageManager } from '../utils/coinStorage';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client/base';
import { useCoinSyncStore } from '../store/coinSyncStore';

export interface CoinSyncResult {
  success: boolean;
  message: string;
  localBefore: number;
  backendCoins: number;
  localAfter: number;
  settled: number;
  error?: string;
  requiresLogin?: boolean;
}

/**
 * Coin Synchronization Service
 * Handles the two-step process of syncing coins between backend and local storage
 */
export class CoinSyncService {
  /**
   * Check if user is authenticated and has valid token for sync
   */
  static async validateAuthentication(): Promise<{ isValid: boolean; message: string }> {
    const authStore = useAuthStore.getState();
    
    console.log('🔐 Validating authentication for coin sync...');
    console.log('🔐 Is authenticated:', authStore.isAuthenticated);
    console.log('🔐 Is guest:', authStore.isGuest);
    console.log('🔐 User ID:', authStore.getUserId());
    
    // Ensure token is loaded before checking
    await apiClient.ensureTokenLoaded();
    const token = apiClient.getAuthToken();
    
    console.log('🔐 Auth token available:', !!token);
    
    if (!token) {
      console.error('❌ No authentication token found');
      return {
        isValid: false,
        message: 'Authentication required. Please log in to sync coins.'
      };
    }
    
    if (authStore.isGuest) {
      console.error('❌ User is in guest mode');
      return {
        isValid: false,
        message: 'Account required. Please create an account or sign in to sync coins.'
      };
    }
    
    if (!authStore.isAuthenticated) {
      console.error('❌ User is not authenticated');
      return {
        isValid: false,
        message: 'Authentication expired. Please log in again to sync coins.'
      };
    }
    
    console.log('✅ Authentication validation passed');
    return {
      isValid: true,
      message: 'Authentication valid'
    };
  }
  /**
   * Synchronize coins with backend using the two-step process:
   * 1. GET backend coin balance and add to local storage
   * 2. POST to settle backend coins to 0
   */
  static async syncCoins(): Promise<CoinSyncResult> {
    const debugId = Math.random().toString(36).substr(2, 9);
    console.log(`🔄 [${debugId}] ===== STARTING COIN SYNC =====`);
    console.log(`🔄 [${debugId}] Timestamp: ${new Date().toISOString()}`);
    
    // Set loading state
    const coinSyncStore = useCoinSyncStore.getState();
    coinSyncStore.setLoading(true, 'Syncing coins...');
    
    // Pre-check authentication
    const authValidation = await this.validateAuthentication();
    if (!authValidation.isValid) {
      console.error(`❌ [${debugId}] Authentication validation failed: ${authValidation.message}`);
      
      const authStore = useAuthStore.getState();
      const userId = authStore.getUserId();
      let localBefore = 0;
      
      try {
        localBefore = await CoinStorageManager.getCoins(userId);
      } catch (error) {
        console.error(`❌ [${debugId}] Failed to get local balance during auth failure:`, error);
      }
      
      // Clear loading state on auth failure
      coinSyncStore.setLoading(false, authValidation.message);
      
      return {
        success: false,
        message: authValidation.message,
        localBefore,
        backendCoins: 0,
        localAfter: localBefore,
        settled: 0,
        error: authValidation.message,
        requiresLogin: true,
      };
    }
    
    try {
      // Get current user ID and auth state
      const authStore = useAuthStore.getState();
      const userId = authStore.getUserId();
      const user = authStore.user;
      const isAuthenticated = authStore.isAuthenticated;
      
      console.log(`👤 [${debugId}] User ID: ${userId}`);
      console.log(`👤 [${debugId}] Is Authenticated: ${isAuthenticated}`);
      console.log(`👤 [${debugId}] User Object:`, user ? {
        id: user.id,
        userId: user.userId,
        name: user.name,
        phoneNumber: user.phoneNumber
      } : 'null');
      
      // Step 0: Get current local balance
      console.log(`💰 [${debugId}] Step 0: Getting current local balance...`);
      const localBefore = await CoinStorageManager.getCoins(userId);
      console.log(`💰 [${debugId}] Current local balance: ${localBefore}`);

      // Step 1: Get backend coin balance
      console.log(`📡 [${debugId}] Step 1: Retrieving backend coin balance...`);
      console.log(`📡 [${debugId}] Making API call to GET /api/v1/coin/`);
      
      const balanceResponse = await CoinApiService.getCoinBalance();
      
      console.log(`📡 [${debugId}] Backend response:`, {
        success: balanceResponse.success,
        statusCode: balanceResponse.statusCode,
        coin: balanceResponse.data?.coin,
        updatedAt: balanceResponse.data?.updatedAt,
        lastSettlementAt: balanceResponse.data?.lastSettlementAt,
        lastSettlementAmount: balanceResponse.data?.lastSettlementAmount
      });
      
      if (!balanceResponse.success) {
        console.error(`❌ [${debugId}] Backend balance request failed:`, balanceResponse);
        throw new Error(`Failed to retrieve backend coin balance: ${balanceResponse.statusCode}`);
      }

      const backendCoins = balanceResponse.data?.coin || 0;
      console.log(`🏦 [${debugId}] Backend coins found: ${backendCoins}`);

      // Step 2: Add backend coins to local storage
      if (backendCoins > 0) {
        console.log(`💰 [${debugId}] Adding ${backendCoins} coins to local storage...`);
        const newBalance = await CoinStorageManager.addCoins(backendCoins, userId);
        console.log(`💰 [${debugId}] Local storage updated. New balance: ${newBalance}`);
      } else {
        console.log(`💰 [${debugId}] No backend coins to add (amount: ${backendCoins})`);
      }

      // Get updated local balance
      const localAfter = await CoinStorageManager.getCoins(userId);
      console.log(`💰 [${debugId}] Final local balance: ${localAfter}`);
      console.log(`💰 [${debugId}] Balance change: ${localBefore} → ${localAfter} (diff: +${localAfter - localBefore})`);

      // Step 3: ALWAYS settle backend coins to 0 to ensure clean state
      console.log(`📡 [${debugId}] Step 2: Settling backend coins to zero...`);
      console.log(`📡 [${debugId}] Note: Always calling settle to ensure backend is at 0, regardless of initial amount`);
      console.log(`📡 [${debugId}] Making API call to POST /api/v1/coin/settle`);
      
      let settledAmount = 0;
      try {
        const settleResponse = await CoinApiService.settleCoin();
        
        console.log(`📡 [${debugId}] Settle response:`, {
          success: settleResponse.success,
          statusCode: settleResponse.statusCode,
          message: settleResponse.message,
          settled: settleResponse.data?.settled,
          remaining: settleResponse.data?.remaining
        });
        
        if (!settleResponse.success) {
          console.warn(`⚠️ [${debugId}] Failed to settle backend coins`);
          console.warn(`⚠️ [${debugId}] Settle error:`, settleResponse);
          // Continue execution - this is not critical if coins were already added locally
        } else {
          settledAmount = settleResponse.data?.settled || 0;
          console.log(`✅ [${debugId}] Successfully settled ${settledAmount} coins on backend`);
          console.log(`✅ [${debugId}] Backend remaining coins: ${settleResponse.data?.remaining || 0}`);
        }
      } catch (settleError: any) {
        console.error(`❌ [${debugId}] Settle operation failed:`, {
          type: settleError.constructor?.name,
          message: settleError.message,
          statusCode: settleError.statusCode,
          details: settleError.details
        });
        console.warn(`⚠️ [${debugId}] Continuing despite settle failure - local coins are still valid`);
        // Don't throw here - settle failure is not critical for user experience
      }

      const result: CoinSyncResult = {
        success: true,
        message: backendCoins > 0 
          ? `Successfully synced ${backendCoins} coins from backend and settled ${settledAmount} coins`
          : `No new coins to add. Your balance is already up to date.`,
        localBefore,
        backendCoins,
        localAfter,
        settled: settledAmount,
      };

      console.log(`✅ [${debugId}] ===== COIN SYNC COMPLETED =====`);
      console.log(`✅ [${debugId}] Final result:`, result);
      
      // Clear loading state on success
      coinSyncStore.setLoading(false, result.message);
      
      return result;

    } catch (error: any) {
      console.error(`❌ [${debugId}] ===== COIN SYNC FAILED =====`);
      console.error(`❌ [${debugId}] Error type:`, error.constructor.name);
      console.error(`❌ [${debugId}] Error message:`, error.message);
      console.error(`❌ [${debugId}] Error stack:`, error.stack);
      console.error(`❌ [${debugId}] Full error object:`, error);
      
      // Check if this is an authentication error
      const isAuthError = error.statusCode === 401 || 
                         error.message?.includes('No token provided') ||
                         error.message?.includes('Unauthorized') ||
                         error.message?.includes('Authentication');
      
      console.log(`🔐 [${debugId}] Is authentication error: ${isAuthError}`);
      
      // Get current local balance for error response
      const authStore = useAuthStore.getState();
      const userId = authStore.getUserId();
      let localBefore = 0;
      
      try {
        localBefore = await CoinStorageManager.getCoins(userId);
        console.log(`💰 [${debugId}] Local balance during error: ${localBefore}`);
      } catch (localError) {
        console.error(`❌ [${debugId}] Failed to get local balance during error:`, localError);
      }

      const errorResult = {
        success: false,
        message: isAuthError 
          ? 'Authentication required. Please log in to sync coins.'
          : 'Failed to sync coins with backend',
        localBefore,
        backendCoins: 0,
        localAfter: localBefore,
        settled: 0,
        error: error.message || 'Unknown error occurred',
        requiresLogin: isAuthError,
      };

      console.error(`❌ [${debugId}] Error result:`, errorResult);
      
      // Clear loading state on error
      coinSyncStore.setLoading(false, errorResult.message);
      
      return errorResult;
    }
  }

  /**
   * Check if user is online and can sync coins
   */
  static async canSync(): Promise<boolean> {
    try {
      // First check if authentication is valid before testing connectivity
      const authValidation = await this.validateAuthentication();
      if (!authValidation.isValid) {
        console.log('📡 Cannot sync - authentication not valid:', authValidation.message);
        return false;
      }

      // Test connectivity by trying to get coin balance
      await CoinApiService.getCoinBalance();
      return true;
    } catch (error: any) {
      // More specific error logging
      if (error.statusCode === 401) {
        console.log('📡 Cannot sync - authentication error (401)');
      } else if (error.statusCode >= 500) {
        console.log('📡 Cannot sync - backend server error');
      } else if (error.message?.includes('Network')) {
        console.log('📡 Cannot sync - network connectivity issue');
      } else {
        console.log('📡 Cannot sync - offline or backend unavailable for coin sync');
      }
      return false;
    }
  }

  /**
   * Auto-sync coins when app comes online (can be called on app focus/network change)
   */
  static async autoSync(): Promise<CoinSyncResult | null> {
    try {
      const authValidation = await this.validateAuthentication();
      if (!authValidation.isValid) {
        console.log('🪙 [AutoSync] Skipping coin sync - not authenticated');
        return null;
      }

      const canSync = await this.canSync();
      if (canSync) {
        console.log('🪙 [AutoSync] Auto-syncing coins on startup...');
        const result = await this.syncCoins();
        
        // Log only essential info for auto-sync
        if (result.success && result.backendCoins > 0) {
          console.log(`🪙 [AutoSync] ✅ Added ${result.backendCoins} coins from backend`);
        } else if (result.success) {
          console.log('🪙 [AutoSync] ✅ Coin balance up to date');
        } else {
          console.log(`🪙 [AutoSync] ❌ ${result.message}`);
        }
        
        return result;
      } else {
        console.log('🪙 [AutoSync] Skipping coin sync - offline or backend unavailable');
        return null;
      }
    } catch (error) {
      console.log('🪙 [AutoSync] Skipping coin sync - error occurred:', error);
      return null;
    }
  }
}

export default CoinSyncService;