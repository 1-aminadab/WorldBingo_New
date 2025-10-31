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
    try {
      const key = this.getCoinKey(userId);
      const coinsStr = await AsyncStorage.getItem(key);
      
      if (coinsStr !== null) {
        const coins = parseFloat(coinsStr);
        console.log(`💰 Loaded ${coins} coins for user ${userId || 'GUEST'}`);
        return coins;
      }
      
      // First time user - initialize with 0 coins
      console.log(`💰 New user ${userId || 'GUEST'} - initializing with 0 coins`);
      await this.setCoins(0, userId);
      return 0;
    } catch (error) {
      console.error('Error loading coins:', error);
      return 0;
    }
  }

  /**
   * Set coin balance for a user
   */
  static async setCoins(amount: number, userId?: string): Promise<void> {
    try {
      const key = this.getCoinKey(userId);
      const finalAmount = Math.max(0, amount); // Ensure non-negative
      await AsyncStorage.setItem(key, finalAmount.toString());
      console.log(`💰 Set ${finalAmount} coins for user ${userId || 'GUEST'}`);
    } catch (error) {
      console.error('Error saving coins:', error);
    }
  }

  /**
   * Add coins to user balance
   */
  static async addCoins(amount: number, userId?: string): Promise<number> {
    try {
      const currentCoins = await this.getCoins(userId);
      const newBalance = currentCoins + amount;
      await this.setCoins(newBalance, userId);
      console.log(`💰 Added ${amount} coins: ${currentCoins} → ${newBalance} (User: ${userId || 'GUEST'})`);
      return newBalance;
    } catch (error) {
      console.error('Error adding coins:', error);
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


