import { CoinApiService } from '../api/services/coin';
import { CoinStorageManager } from '../utils/coinStorage';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client/base';
import { useCoinSyncStore } from '../store/coinSyncStore';
import { transactionApiService } from '../api/services/transaction';

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
    
    // Ensure token is loaded before checking
    await apiClient.ensureTokenLoaded();
    const token = apiClient.getAuthToken();
    
    if (!token) {
      return {
        isValid: false,
        message: 'Authentication required. Please log in to sync coins.'
      };
    }
    
    if (authStore.isGuest) {
      return {
        isValid: false,
        message: 'Account required. Please create an account or sign in to sync coins.'
      };
    }
    
    if (!authStore.isAuthenticated) {
      return {
        isValid: false,
        message: 'Authentication expired. Please log in again to sync coins.'
      };
    }
    
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
    // Set loading state
    const coinSyncStore = useCoinSyncStore.getState();
    coinSyncStore.setLoading(true, 'Syncing...');
    
    // Pre-check authentication
    const authValidation = await this.validateAuthentication();
    if (!authValidation.isValid) {
      const authStore = useAuthStore.getState();
      const userId = authStore.getUserId();
      let localBefore = 0;
      
      try {
        localBefore = await CoinStorageManager.getCoins(userId);
      } catch (error) {
        // Handle error silently
      }
      
      // Set error status on auth failure
      coinSyncStore.setSyncStatus('error', 'Not Sync');
      
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
      
      // Step 0: Get current local balance
      const localBefore = await CoinStorageManager.getCoins(userId);

      // Step 1: Get backend coin balance
      const balanceResponse = await CoinApiService.getCoinBalance();
      
      console.log('Full response object:', JSON.stringify(balanceResponse, null, 2));
      
      if (!balanceResponse.success) {
        throw new Error(`Failed to retrieve backend coin balance: ${balanceResponse.statusCode}`);
      }

      // Extract coin value from response
      const backendCoins = (balanceResponse as any).coin || 0;

      // Step 2: ADD backend coins to current user balance (don't replace, ADD to existing)
      const balanceBeforeAdd = await CoinStorageManager.getCoins(userId);
      let balanceAfterAdd = balanceBeforeAdd;
      
      // Only add coins if backend has coins to give
      if (backendCoins > 0) {
        balanceAfterAdd = await CoinStorageManager.addCoins(backendCoins, userId);
      }
      
      // Verify the addition worked
      const verifyBalance = await CoinStorageManager.getCoins(userId);

      // Get updated local balance
      const localAfter = await CoinStorageManager.getCoins(userId);
      
      // IMPORTANT: Refresh auth store immediately after coin changes
      if (localAfter !== localBefore) {
        await authStore.loadCoins();
        
        // Get fresh auth store state AFTER refresh
        const freshAuthState = useAuthStore.getState();
        
        // Final verification across all layers
        const allLayersMatch = freshAuthState.userCoins === localAfter;
        if (!allLayersMatch) {
          // Try to force sync one more time
          freshAuthState.setCoins(localAfter);
        }
      }

      // Step 3: ONLY settle backend coins if we successfully added them to user balance
      const shouldSettleBackend = backendCoins > 0 && verifyBalance === balanceAfterAdd;
      
      let settledAmount = 0;
      let settleSuccess = true;
      
      if (shouldSettleBackend) {
        try {
          const settleResponse = await CoinApiService.settleCoin();
        
          if (settleResponse.success) {
            settledAmount = settleResponse.data?.settled || 0;
            settleSuccess = true;
          } else {
            settleSuccess = false;
            throw new Error(`Settle failed: ${settleResponse.message}`);
          }
        } catch (settleError: any) {
          settleSuccess = false;
          
          // ROLLBACK: Remove the coins we just added since settle failed
          if (backendCoins > 0) {
            try {
              // Restore the original balance by removing the added coins
              await CoinStorageManager.setCoins(localBefore, userId);
              
              // Also rollback auth store
              await authStore.loadCoins();
            } catch (rollbackError) {
              // Critical: rollback failed, log the error
              console.error('CRITICAL: Failed to rollback coins after settle failure:', rollbackError);
            }
          }
          
          // Throw error to indicate sync failure
          throw new Error(`Coin sync failed: Unable to settle backend coins. ${settleError.message}`);
        }
      }
      
      // Only consider sync successful if coins were added AND settle succeeded (or no coins to settle)
      const syncSuccess = (backendCoins === 0) || (backendCoins > 0 && settleSuccess);
      
      // Get final balance after potential rollback
      const finalBalance = await CoinStorageManager.getCoins(userId);

      if (syncSuccess) {
        // Create transaction report if coins changed (same logic as ProfileScreen manual refresh)
        const coinDifference = finalBalance - localBefore;
        
        if (coinDifference !== 0) {
          try {
            await transactionApiService.createTransaction({
              userId: userId,
              type: coinDifference > 0 ? 'payout' : 'payin',
              amount: Math.abs(coinDifference),
              description: coinDifference > 0 
                ? `Coins synced from backend (+${coinDifference.toFixed(0)} coins)`
                : `Coins synced to backend (${coinDifference.toFixed(0)} coins)`,
              gameId: `COIN_SYNC_${Date.now()}`
            });
            console.log(`📊 Transaction report created: ${coinDifference > 0 ? '+' : ''}${coinDifference.toFixed(0)} coins`);
          } catch (reportError) {
            console.error('Failed to create transaction report:', reportError);
            // Don't fail the sync operation if report creation fails
          }
        }
        
        const result: CoinSyncResult = {
          success: true,
          message: `Successfully synced coins with backend. Local balance: ${localBefore} → ${finalBalance}`,
          localBefore,
          backendCoins,
          localAfter: finalBalance,
          settled: settledAmount,
        };
        
        // Set success status
        coinSyncStore.setSyncStatus('success', 'Sync');
        
        return result;
      } else {
        // This shouldn't happen since we throw on settle failure, but just in case
        throw new Error('Sync failed due to settle error');
      }

    } catch (error: any) {
      // Check if this is an authentication error
      const isAuthError = error.statusCode === 401 || 
                         error.message?.includes('No token provided') ||
                         error.message?.includes('Unauthorized') ||
                         error.message?.includes('Authentication');
      
      // Get current local balance for error response
      const authStore = useAuthStore.getState();
      const userId = authStore.getUserId();
      let localBefore = 0;
      
      try {
        localBefore = await CoinStorageManager.getCoins(userId);
      } catch (localError) {
        // Handle error silently
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
      
      // Set error status
      coinSyncStore.setSyncStatus('error', 'Not Sync');
      
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
        return false;
      }

      // Test connectivity by trying to get coin balance
      await CoinApiService.getCoinBalance();
      return true;
    } catch (error: any) {
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
        return null;
      }

      const canSync = await this.canSync();
      if (canSync) {
        const result = await this.syncCoins();
        return result;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }
}

export default CoinSyncService;