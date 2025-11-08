import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Coin Storage Manager
 * Manages coin balances per user in local storage
 */
export class CoinStorageManager {
  private static getCoinKey(userId?: string): string {
    return userId ? `coins_${userId}` : 'coins_GUEST';
  }

  /**
   * Get coin balance for a user
   */
  static async getCoins(userId?: string): Promise<number> {
    const debugId = Math.random().toString(36).substr(2, 9);
    console.log(`💰 [${debugId}] === GET COINS FROM LOCAL STORAGE ===`);
    
    try {
      const key = this.getCoinKey(userId);
      console.log(`💰 [${debugId}] Storage key: ${key}`);
      console.log(`💰 [${debugId}] User ID: ${userId || 'GUEST'}`);
      
      const coinsStr = await AsyncStorage.getItem(key);
      console.log(`💰 [${debugId}] Raw storage value: ${coinsStr}`);
      
      if (coinsStr !== null) {
        const coins = parseFloat(coinsStr);
        console.log(`💰 [${debugId}] Parsed coins: ${coins}`);
        console.log(`💰 [${debugId}] ✅ Loaded ${coins} coins for user ${userId || 'GUEST'}`);
        return coins;
      }
      
      // First time user - initialize with 0 coins
      console.log(`💰 [${debugId}] No existing coins found - new user`);
      console.log(`💰 [${debugId}] Initializing ${userId || 'GUEST'} with 0 coins`);
      
      await this.setCoins(0, userId);
      console.log(`💰 [${debugId}] ✅ New user initialized with 0 coins`);
      return 0;
    } catch (error) {
      console.error(`💰 [${debugId}] ❌ Error loading coins:`, error);
      console.error(`💰 [${debugId}] Returning 0 as fallback`);
      return 0;
    }
  }

  /**
   * Set coin balance for a user
   */
  static async setCoins(amount: number, userId?: string): Promise<void> {
    const debugId = Math.random().toString(36).substr(2, 9);
    console.log(`💰 [${debugId}] === SET COINS IN LOCAL STORAGE ===`);
    
    try {
      const key = this.getCoinKey(userId);
      const finalAmount = Math.max(0, amount); // Ensure non-negative
      
      console.log(`💰 [${debugId}] Storage key: ${key}`);
      console.log(`💰 [${debugId}] User ID: ${userId || 'GUEST'}`);
      console.log(`💰 [${debugId}] Input amount: ${amount}`);
      console.log(`💰 [${debugId}] Final amount (non-negative): ${finalAmount}`);
      
      await AsyncStorage.setItem(key, finalAmount.toString());
      console.log(`💰 [${debugId}] ✅ Set ${finalAmount} coins for user ${userId || 'GUEST'}`);
    } catch (error) {
      console.error(`💰 [${debugId}] ❌ Error saving coins:`, error);
    }
  }

  /**
   * Add coins to user balance
   */
  static async addCoins(amount: number, userId?: string): Promise<number> {
    const debugId = Math.random().toString(36).substr(2, 9);
    console.log(`💰 [${debugId}] === ADD COINS TO LOCAL STORAGE ===`);
    
    try {
      console.log(`💰 [${debugId}] User ID: ${userId || 'GUEST'}`);
      console.log(`💰 [${debugId}] Amount to add: ${amount}`);
      
      const currentCoins = await this.getCoins(userId);
      console.log(`💰 [${debugId}] Current balance: ${currentCoins}`);
      
      const newBalance = currentCoins + amount;
      console.log(`💰 [${debugId}] Calculating new balance: ${currentCoins} + ${amount} = ${newBalance}`);
      
      await this.setCoins(newBalance, userId);
      console.log(`💰 [${debugId}] ✅ Added ${amount} coins: ${currentCoins} → ${newBalance} (User: ${userId || 'GUEST'})`);
      return newBalance;
    } catch (error) {
      console.error(`💰 [${debugId}] ❌ Error adding coins:`, error);
      console.log(`💰 [${debugId}] Fallback: returning current balance`);
      return await this.getCoins(userId);
    }
  }

  /**
   * Deduct coins from user balance
   */
  static async deductCoins(amount: number, userId?: string): Promise<{ success: boolean; newBalance: number }> {
    try {
      const currentCoins = await this.getCoins(userId);
      
      if (currentCoins < amount) {
        console.log(`❌ Insufficient coins: ${currentCoins} < ${amount} (User: ${userId || 'GUEST'})`);
        return { success: false, newBalance: currentCoins };
      }
      
      const newBalance = currentCoins - amount;
      await this.setCoins(newBalance, userId);
      console.log(`💰 Deducted ${amount} coins: ${currentCoins} → ${newBalance} (User: ${userId || 'GUEST'})`);
      return { success: true, newBalance };
    } catch (error) {
      console.error('Error deducting coins:', error);
      return { success: false, newBalance: await this.getCoins(userId) };
    }
  }

  /**
   * Clear all coin data (for testing/debugging)
   */
  static async clearAllCoins(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const coinKeys = keys.filter(key => key.startsWith('coins_'));
      await AsyncStorage.multiRemove(coinKeys);
      console.log('💰 Cleared all coin data');
    } catch (error) {
      console.error('Error clearing coin data:', error);
    }
  }

  /**
   * Get all user coin balances (for admin/debugging)
   */
  static async getAllBalances(): Promise<Record<string, number>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const coinKeys = keys.filter(key => key.startsWith('coins_'));
      const balances: Record<string, number> = {};
      
      for (const key of coinKeys) {
        const userId = key.replace('coins_', '');
        const coins = await this.getCoins(userId === 'GUEST' ? undefined : userId);
        balances[userId] = coins;
      }
      
      return balances;
    } catch (error) {
      console.error('Error getting all balances:', error);
      return {};
    }
  }

  /**
   * Add 1000 bonus coins to a user (temporary utility)
   */
  static async addBonusCoins(userId?: string): Promise<number> {
    try {
      console.log('🎁 Adding 1000 bonus coins...');
      return await this.addCoins(1000, userId);
    } catch (error) {
      console.error('Error adding bonus coins:', error);
      return await this.getCoins(userId);
    }
  }
}

export default CoinStorageManager;


