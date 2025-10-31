import { ApiResponse, Transaction, CreateTransactionRequest } from '../types';
import { ReportStorageManager } from '../../utils/reportStorage';

class TransactionLocalService {
  private static instance: TransactionLocalService;

  public static getInstance(): TransactionLocalService {
    if (!TransactionLocalService.instance) {
      TransactionLocalService.instance = new TransactionLocalService();
    }
    return TransactionLocalService.instance;
  }

  /**
   * Create a new transaction (saves to local storage only)
   */
  public async createTransaction(data: CreateTransactionRequest): Promise<ApiResponse<Transaction>> {
    try {
      console.log('💳 Creating transaction (local storage only):', data);
      const userIdString = typeof data.userId === 'string' ? data.userId : data.userId?.toString();
      console.log('💳 Transaction userId as string:', userIdString);
      
      // Save to local storage with userId
      await ReportStorageManager.addCashTransaction({
        type: data.type === 'payin' ? 'debit' : 'credit',
        amount: data.amount,
        reason: data.type, // Keep the original type as reason (payin/payout)
        description: data.description,
        userId: userIdString // Pass userId to ensure data isolation
      });
      
      console.log('💾 Transaction saved to local storage for user:', data.userId?.toString());
      
      // Return success response with local data
      return {
        success: true,
        data: {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: data.userId,
          gameId: data.gameId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Transaction,
        message: 'Transaction saved to local storage'
      };
    } catch (error) {
      console.error('❌ Failed to save transaction to local storage:', error);
      throw error;
    }
  }

  /**
   * Get all transactions from local storage
   */
  public async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    try {
      console.log('💳 Fetching all transactions from local storage...');
      
      const cashReports = await ReportStorageManager.getCashReports();
      const transactions: Transaction[] = [];
      
      // Convert cash reports to transactions format
      cashReports.forEach(report => {
        report.transactions.forEach(transaction => {
          transactions.push({
            id: `${report.id}_${transaction.id}`,
            userId: transaction.userId ? parseInt(transaction.userId) : undefined,
            gameId: `game_${transaction.id}`,
            type: transaction.type === 'debit' ? 'payin' : 'payout',
            amount: transaction.amount,
            description: transaction.description,
            createdAt: transaction.timestamp,
            updatedAt: transaction.timestamp
          } as Transaction);
        });
      });

      console.log('✅ Transactions fetched from local storage:', transactions.length);
      return {
        success: true,
        data: transactions,
        message: 'Transactions fetched from local storage'
      };
    } catch (error) {
      console.error('❌ Failed to fetch transactions from local storage:', error);
      throw error;
    }
  }

  /**
   * Get transactions by user ID from local storage
   */
  public async getTransactionsByUserId(userId: number): Promise<ApiResponse<Transaction[]>> {
    try {
      console.log('💳 Fetching transactions for user ID from local storage:', userId);
      
      const userIdString = userId.toString();
      const cashReports = await ReportStorageManager.getCashReports(userIdString);
      const transactions: Transaction[] = [];
      
      // Convert cash reports to transactions format
      cashReports.forEach(report => {
        report.transactions.forEach(transaction => {
          if (transaction.userId === userIdString) {
            transactions.push({
              id: `${report.id}_${transaction.id}`,
              userId: parseInt(transaction.userId),
              gameId: `game_${transaction.id}`,
              type: transaction.type === 'debit' ? 'payin' : 'payout',
              amount: transaction.amount,
              description: transaction.description,
              createdAt: transaction.timestamp,
              updatedAt: transaction.timestamp
            } as Transaction);
          }
        });
      });

      console.log('✅ User transactions fetched from local storage:', transactions.length);
      return {
        success: true,
        data: transactions,
        message: 'User transactions fetched from local storage'
      };
    } catch (error) {
      console.error('❌ Failed to fetch user transactions from local storage:', error);
      throw error;
    }
  }

  /**
   * Helper method to record game-related transactions
   */
  public async recordGameTransactions(
    userId: number,
    gameId: string,
    payin: number,
    payout: number
  ): Promise<{ payinTransaction: Transaction; payoutTransaction?: Transaction }> {
    try {
      console.log('🎮 Recording game transactions:', { userId, gameId, payin, payout });
      
      // Create payin transaction
      const payinResponse = await this.createTransaction({
        userId,
        gameId,
        type: 'payin',
        amount: payin,
        description: `Payment for game ${gameId}`
      });

      let payoutTransaction: Transaction | undefined;
      
      // Create payout transaction if there's a payout
      if (payout > 0) {
        const payoutResponse = await this.createTransaction({
          userId,
          gameId,
          type: 'payout',
          amount: payout,
          description: `Payout for game ${gameId}`
        });
        payoutTransaction = payoutResponse.data!;
      }

      console.log('✅ Game transactions recorded successfully');
      return {
        payinTransaction: payinResponse.data!,
        payoutTransaction
      };
    } catch (error) {
      console.error('❌ Failed to record game transactions:', error);
      throw error;
    }
  }

  /**
   * Helper method to get transaction summary from local storage
   */
  public async getTransactionSummary(
    userId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalPayin: number;
    totalPayout: number;
    totalBonus: number;
    totalRefund: number;
    netAmount: number;
    transactionCount: number;
  }> {
    try {
      let transactions: Transaction[];
      
      if (userId) {
        const response = await this.getTransactionsByUserId(userId);
        transactions = response.data || [];
      } else {
        const response = await this.getTransactions();
        transactions = response.data || [];
      }

      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        transactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.createdAt);
          return transactionDate >= start && transactionDate <= end;
        });
      }

      const summary = transactions.reduce(
        (acc, transaction) => {
          switch (transaction.type) {
            case 'payin':
              acc.totalPayin += transaction.amount;
              break;
            case 'payout':
              acc.totalPayout += transaction.amount;
              break;
            case 'bonus':
              acc.totalBonus += transaction.amount;
              break;
            case 'refund':
              acc.totalRefund += transaction.amount;
              break;
          }
          acc.transactionCount++;
          return acc;
        },
        {
          totalPayin: 0,
          totalPayout: 0,
          totalBonus: 0,
          totalRefund: 0,
          netAmount: 0,
          transactionCount: 0
        }
      );

      summary.netAmount = summary.totalPayout + summary.totalBonus + summary.totalRefund - summary.totalPayin;

      console.log('📊 Transaction summary calculated:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Failed to calculate transaction summary:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const transactionApiService = TransactionLocalService.getInstance();
export default transactionApiService;