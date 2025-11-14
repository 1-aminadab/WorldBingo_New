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
      const userIdString = typeof data.userId === 'string' ? data.userId : data.userId?.toString();
      
      // Save to local storage with userId
      await ReportStorageManager.addCashTransaction({
        type: data.type === 'payin' ? 'debit' : 'credit',
        amount: data.amount,
        reason: data.type, // Keep the original type as reason (payin/payout)
        description: data.description,
        userId: userIdString // Pass userId to ensure data isolation
      });
      
      
      // Return success response with local data
      return {
        success: true,
        data: {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: typeof data.userId === 'string' ? parseInt(data.userId) : data.userId,
          gameId: data.gameId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          timestamp: new Date().toISOString(),
          status: 'completed'
        } as Transaction,
        message: 'Transaction saved to local storage'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all transactions from local storage
   */
  public async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    try {
      
      const cashReports = await ReportStorageManager.getCashReports();
      const transactions: Transaction[] = [];
      
      // Convert cash reports to transactions format
      cashReports.forEach(report => {
        report.transactions.forEach(transaction => {
          if (transaction.userId) {
            transactions.push({
              id: `${report.id}_${transaction.id}`,
              userId: parseInt(transaction.userId),
              gameId: `game_${transaction.id}`,
              type: transaction.type === 'debit' ? 'payin' : 'payout',
              amount: transaction.amount,
              description: transaction.description || '',
              timestamp: transaction.timestamp.toISOString(),
              status: 'completed'
            } as Transaction);
          }
        });
      });

      return {
        success: true,
        data: transactions,
        message: 'Transactions fetched from local storage'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transactions by user ID from local storage
   */
  public async getTransactionsByUserId(userId: number): Promise<ApiResponse<Transaction[]>> {
    try {
      
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
              description: transaction.description || '',
              timestamp: transaction.timestamp.toISOString(),
              status: 'completed'
            } as Transaction);
          }
        });
      });

      return {
        success: true,
        data: transactions,
        message: 'User transactions fetched from local storage'
      };
    } catch (error) {
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

      return {
        payinTransaction: payinResponse.data!,
        payoutTransaction
      };
    } catch (error) {
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
          const transactionDate = new Date(transaction.timestamp);
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

      return summary;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const transactionApiService = TransactionLocalService.getInstance();
export default transactionApiService;