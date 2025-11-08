import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameReport, CashReport, GameReportEntry, CashTransaction, CashTransactionReason } from '../types';

export class ReportStorageManager {
  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Generate user-specific storage keys
  private static getGameReportsKey(userId?: string): string {
    return userId ? `game_reports_${userId}` : 'game_reports_GUEST';
  }

  private static getCashReportsKey(userId?: string): string {
    return userId ? `cash_reports_${userId}` : 'cash_reports_GUEST';
  }

  // Game Reports
  static async getGameReports(userId?: string): Promise<GameReport[]> {
    try {
      const key = this.getGameReportsKey(userId);
      console.log('📊 Loading game reports with key:', key, 'for userId:', userId);
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        console.log('📊 No game reports found in storage for user:', userId);
        return [];
      }
      const reports = JSON.parse(data).map((report: any) => ({
        ...report,
        userId: userId || 'GUEST', // Add userId to the report
        games: report.games.map((game: any) => ({
          ...game,
          timestamp: new Date(game.timestamp)
        }))
      }));
      console.log('📊 Successfully loaded', reports.length, 'game reports for user:', userId);
      return reports;
    } catch (error) {
      console.error('❌ Error loading game reports for user:', userId, error);
      return [];
    }
  }

  static async saveGameReports(reports: GameReport[], userId?: string): Promise<void> {
    try {
      const key = this.getGameReportsKey(userId);
      console.log('💾 [ReportStorageManager] Saving', reports.length, 'game reports for user:', userId);
      console.log('💾 [ReportStorageManager] Storage key:', key);
      console.log('💾 [ReportStorageManager] Reports being saved:', reports.map(r => ({
        date: r.date,
        totalGames: r.totalGames,
        userId: r.userId,
        gamesCount: r.games.length
      })));
      await AsyncStorage.setItem(key, JSON.stringify(reports));
      console.log('✅ [ReportStorageManager] Game reports saved successfully for user:', userId);
    } catch (error) {
      console.error('❌ [ReportStorageManager] Error saving game reports for user:', userId, error);
    }
  }

  static async getTodaysGameReport(userId?: string): Promise<GameReport | null> {
    const reports = await this.getGameReports(userId);
    const todayDate = this.getTodayDateString();
    return reports.find(report => report.date === todayDate) || null;
  }

  static async addGameEntry(gameData: {
    cardsSold: number;
    collectedAmount: number;
    rtpPercentage: number;
    gameDurationMinutes: number;
    totalNumbersCalled: number;
    pattern: string;
    winnerFound: boolean;
    userId?: string; // Add userId to game data
    gameStatus?: 'started' | 'completed'; // Track if this is a start or completion report
    gameMode?: 'single_player' | 'multi_player'; // Track game mode
  }): Promise<string> {
    const userId = gameData.userId;
    console.log('📊 [ReportStorageManager] Adding game entry for userId:', userId);
    console.log('📊 [ReportStorageManager] Game data:', JSON.stringify(gameData, null, 2));
    const reports = await this.getGameReports(userId);
    console.log('📊 [ReportStorageManager] Existing reports count:', reports.length);
    const todayDate = this.getTodayDateString();
    console.log('📊 [ReportStorageManager] Today date:', todayDate);
    
    let todaysReport = reports.find(report => report.date === todayDate);
    
    if (!todaysReport) {
      todaysReport = {
        id: this.generateId(),
        date: todayDate,
        totalGames: 0,
        totalCardsSold: 0,
        totalCollectedAmount: 0,
        totalProfit: 0,
        rtpPercentage: gameData.rtpPercentage,
        games: [],
        userId: userId || 'GUEST' // Add userId to report
      };
      reports.push(todaysReport);
    }

    const profitAmount = gameData.collectedAmount * (100 - gameData.rtpPercentage) / 100;
    
    const gameEntry: GameReportEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      gameNumber: todaysReport.totalGames + 1,
      cardsSold: gameData.cardsSold,
      collectedAmount: gameData.collectedAmount,
      rtpPercentage: gameData.rtpPercentage,
      profitAmount,
      gameDurationMinutes: gameData.gameDurationMinutes,
      totalNumbersCalled: gameData.totalNumbersCalled,
      pattern: gameData.pattern,
      winnerFound: gameData.winnerFound,
      gameStatus: gameData.gameStatus,
      gameMode: gameData.gameMode
    };

    todaysReport.games.push(gameEntry);
    todaysReport.totalGames += 1;
    todaysReport.totalCardsSold += gameData.cardsSold;
    todaysReport.totalCollectedAmount += gameData.collectedAmount;
    todaysReport.totalProfit += profitAmount;

    console.log('📊 [ReportStorageManager] Updated today\'s report:', {
      date: todaysReport.date,
      totalGames: todaysReport.totalGames,
      totalCollectedAmount: todaysReport.totalCollectedAmount,
      totalProfit: todaysReport.totalProfit,
      gamesCount: todaysReport.games.length,
      userId: todaysReport.userId
    });
    console.log('📊 [ReportStorageManager] Latest game entry:', gameEntry);

    await this.saveGameReports(reports, userId);
    console.log('📊 [ReportStorageManager] Game entry saved successfully!');
    
    // Note: Profit is calculated and stored in the game report
    // but we don't create a profit transaction here since that would
    // represent house profit, not player transactions
    
    // Return the game entry ID for tracking
    return gameEntry.id;
  }

  static async updateGameEntry(gameEntryId: string, updateData: {
    gameDurationMinutes?: number;
    totalNumbersCalled?: number;
    winnerFound?: boolean;
    gameStatus?: 'started' | 'completed';
  }, userId?: string): Promise<void> {
    console.log('📊 [ReportStorageManager] Updating game entry:', gameEntryId, 'for userId:', userId);
    console.log('📊 [ReportStorageManager] Update data:', JSON.stringify(updateData, null, 2));
    
    const reports = await this.getGameReports(userId);
    
    for (const report of reports) {
      const gameIndex = report.games.findIndex(game => game.id === gameEntryId);
      if (gameIndex !== -1) {
        // Update the game entry
        const existingGame = report.games[gameIndex];
        report.games[gameIndex] = {
          ...existingGame,
          ...updateData
        };
        
        console.log('📊 [ReportStorageManager] Updated game entry:', report.games[gameIndex]);
        
        // Save the updated reports
        await this.saveGameReports(reports, userId);
        console.log('📊 [ReportStorageManager] Game entry updated successfully!');
        return;
      }
    }
    
    console.warn('📊 [ReportStorageManager] Game entry not found for update:', gameEntryId);
  }

  static async getGameReportByDate(date: string, userId?: string): Promise<GameReport | null> {
    const reports = await this.getGameReports(userId);
    return reports.find(report => report.date === date) || null;
  }

  static async getGameReportsInDateRange(startDate: string, endDate: string, userId?: string): Promise<GameReport[]> {
    const reports = await this.getGameReports(userId);
    return reports.filter(report => report.date >= startDate && report.date <= endDate);
  }

  // Cash Reports
  static async getCashReports(userId?: string): Promise<CashReport[]> {
    try {
      const key = this.getCashReportsKey(userId);
      console.log('💳 Loading cash reports with key:', key, 'for userId:', userId);
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        console.log('💳 No cash reports found in storage for user:', userId);
        return [];
      }
      const reports = JSON.parse(data).map((report: any) => ({
        ...report,
        userId: userId || 'GUEST', // Add userId to the report
        transactions: report.transactions.map((transaction: any) => ({
          ...transaction,
          timestamp: new Date(transaction.timestamp)
        }))
      }));
      console.log('💳 Successfully loaded', reports.length, 'cash reports for user:', userId);
      return reports;
    } catch (error) {
      console.error('❌ Error loading cash reports for user:', userId, error);
      return [];
    }
  }

  static async saveCashReports(reports: CashReport[], userId?: string): Promise<void> {
    try {
      const key = this.getCashReportsKey(userId);
      console.log('💾 Saving', reports.length, 'cash reports for user:', userId);
      await AsyncStorage.setItem(key, JSON.stringify(reports));
      console.log('✅ Cash reports saved successfully for user:', userId);
    } catch (error) {
      console.error('❌ Error saving cash reports for user:', userId, error);
    }
  }

  static async getTodaysCashReport(userId?: string): Promise<CashReport | null> {
    const reports = await this.getCashReports(userId);
    const todayDate = this.getTodayDateString();
    return reports.find(report => report.date === todayDate) || null;
  }

  static async addCashTransaction(transactionData: {
    type: 'debit' | 'credit';
    amount: number;
    reason: string;
    description?: string;
    userId?: string; // Add userId to transaction data
  }): Promise<void> {
    const userId = transactionData.userId;
    console.log('💾 Adding cash transaction for userId:', userId);
    console.log('💾 Transaction data:', JSON.stringify(transactionData, null, 2));
    const reports = await this.getCashReports(userId);
    console.log('💾 Existing reports for this user:', reports.length);
    const todayDate = this.getTodayDateString();
    
    let todaysReport = reports.find(report => report.date === todayDate);
    
    if (!todaysReport) {
      todaysReport = {
        id: this.generateId(),
        date: todayDate,
        transactions: [],
        totalDebit: 0,
        totalCredit: 0,
        netBalance: 0,
        userId: userId || 'GUEST' // Add userId to report
      };
      reports.push(todaysReport);
    }

    const transaction: CashTransaction = {
      id: this.generateId(),
      timestamp: new Date(),
      type: transactionData.type,
      amount: transactionData.amount,
      reason: transactionData.reason,
      description: transactionData.description,
      userId: userId || 'GUEST' // Add userId to each transaction
    };

    todaysReport.transactions.push(transaction);
    
    if (transaction.type === 'debit') {
      todaysReport.totalDebit += transaction.amount;
    } else {
      todaysReport.totalCredit += transaction.amount;
    }
    
    todaysReport.netBalance = todaysReport.totalCredit - todaysReport.totalDebit;

    await this.saveCashReports(reports, userId);
  }

  static async getCashReportByDate(date: string, userId?: string): Promise<CashReport | null> {
    const reports = await this.getCashReports(userId);
    return reports.find(report => report.date === date) || null;
  }

  static async getCashReportsInDateRange(startDate: string, endDate: string, userId?: string): Promise<CashReport[]> {
    const reports = await this.getCashReports(userId);
    return reports.filter(report => report.date >= startDate && report.date <= endDate);
  }

  static async updateCashTransaction(transactionId: string, updates: Partial<CashTransaction>, userId?: string): Promise<void> {
    const reports = await this.getCashReports(userId);
    
    for (const report of reports) {
      const transactionIndex = report.transactions.findIndex(t => t.id === transactionId);
      if (transactionIndex !== -1) {
        const oldTransaction = report.transactions[transactionIndex];
        const newTransaction = { ...oldTransaction, ...updates };
        
        // Recalculate totals
        if (oldTransaction.type === 'debit') {
          report.totalDebit -= oldTransaction.amount;
        } else {
          report.totalCredit -= oldTransaction.amount;
        }
        
        if (newTransaction.type === 'debit') {
          report.totalDebit += newTransaction.amount;
        } else {
          report.totalCredit += newTransaction.amount;
        }
        
        report.netBalance = report.totalCredit - report.totalDebit;
        report.transactions[transactionIndex] = newTransaction;
        
        await this.saveCashReports(reports, userId);
        break;
      }
    }
  }

  static async deleteCashTransaction(transactionId: string, userId?: string): Promise<void> {
    const reports = await this.getCashReports(userId);
    
    for (const report of reports) {
      const transactionIndex = report.transactions.findIndex(t => t.id === transactionId);
      if (transactionIndex !== -1) {
        const transaction = report.transactions[transactionIndex];
        
        // Recalculate totals
        if (transaction.type === 'debit') {
          report.totalDebit -= transaction.amount;
        } else {
          report.totalCredit -= transaction.amount;
        }
        
        report.netBalance = report.totalCredit - report.totalDebit;
        report.transactions.splice(transactionIndex, 1);
        
        await this.saveCashReports(reports, userId);
        break;
      }
    }
  }

  // Utility methods
  static async clearAllReports(userId?: string): Promise<void> {
    try {
      const gameKey = this.getGameReportsKey(userId);
      const cashKey = this.getCashReportsKey(userId);
      await AsyncStorage.multiRemove([gameKey, cashKey]);
    } catch (error) {
      console.error('Error clearing reports:', error);
    }
  }

  static async exportReportsData(userId?: string): Promise<{ gameReports: GameReport[], cashReports: CashReport[] }> {
    const [gameReports, cashReports] = await Promise.all([
      this.getGameReports(userId),
      this.getCashReports(userId)
    ]);
    
    return { gameReports, cashReports };
  }

  static async importReportsData(data: { gameReports: GameReport[], cashReports: CashReport[] }, userId?: string): Promise<void> {
    await Promise.all([
      this.saveGameReports(data.gameReports, userId),
      this.saveCashReports(data.cashReports, userId)
    ]);
  }

  // Summary statistics
  static async getGameSummaryStats(startDate?: string, endDate?: string, userId?: string): Promise<{
    totalGames: number;
    totalCardsSold: number;
    totalRevenue: number;
    totalProfit: number;
    averageRTP: number;
    averageGameDuration: number;
    winRate: number;
  }> {
    let reports: GameReport[];
    
    if (startDate && endDate) {
      reports = await this.getGameReportsInDateRange(startDate, endDate, userId);
    } else {
      reports = await this.getGameReports(userId);
    }

    const totals = reports.reduce((acc, report) => ({
      totalGames: acc.totalGames + report.totalGames,
      totalCardsSold: acc.totalCardsSold + report.totalCardsSold,
      totalRevenue: acc.totalRevenue + report.totalCollectedAmount,
      totalProfit: acc.totalProfit + report.totalProfit,
      totalGameDuration: acc.totalGameDuration + report.games.reduce((sum, game) => sum + game.gameDurationMinutes, 0),
      totalWins: acc.totalWins + report.games.filter(game => game.winnerFound).length,
      totalRTP: acc.totalRTP + (report.rtpPercentage * report.totalGames)
    }), {
      totalGames: 0,
      totalCardsSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalGameDuration: 0,
      totalWins: 0,
      totalRTP: 0
    });

    return {
      totalGames: totals.totalGames,
      totalCardsSold: totals.totalCardsSold,
      totalRevenue: totals.totalRevenue,
      totalProfit: totals.totalProfit,
      averageRTP: totals.totalGames > 0 ? totals.totalRTP / totals.totalGames : 0,
      averageGameDuration: totals.totalGames > 0 ? totals.totalGameDuration / totals.totalGames : 0,
      winRate: totals.totalGames > 0 ? (totals.totalWins / totals.totalGames) * 100 : 0
    };
  }

  static async getCashSummaryStats(startDate?: string, endDate?: string, userId?: string): Promise<{
    totalCredit: number;
    totalDebit: number;
    netBalance: number;
    transactionCount: number;
  }> {
    let reports: CashReport[];
    
    if (startDate && endDate) {
      reports = await this.getCashReportsInDateRange(startDate, endDate, userId);
    } else {
      reports = await this.getCashReports(userId);
    }

    return reports.reduce((acc, report) => ({
      totalCredit: acc.totalCredit + report.totalCredit,
      totalDebit: acc.totalDebit + report.totalDebit,
      netBalance: acc.netBalance + report.netBalance,
      transactionCount: acc.transactionCount + report.transactions.length
    }), {
      totalCredit: 0,
      totalDebit: 0,
      netBalance: 0,
      transactionCount: 0
    });
  }
}

export default ReportStorageManager;