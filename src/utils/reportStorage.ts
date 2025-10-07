import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameReport, CashReport, GameReportEntry, CashTransaction, CashTransactionReason } from '../types';

const GAME_REPORTS_KEY = 'game_reports';
const CASH_REPORTS_KEY = 'cash_reports';

export class ReportStorageManager {
  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Game Reports
  static async getGameReports(): Promise<GameReport[]> {
    try {
      const data = await AsyncStorage.getItem(GAME_REPORTS_KEY);
      if (!data) return [];
      return JSON.parse(data).map((report: any) => ({
        ...report,
        games: report.games.map((game: any) => ({
          ...game,
          timestamp: new Date(game.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error loading game reports:', error);
      return [];
    }
  }

  static async saveGameReports(reports: GameReport[]): Promise<void> {
    try {
      await AsyncStorage.setItem(GAME_REPORTS_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving game reports:', error);
    }
  }

  static async getTodaysGameReport(): Promise<GameReport | null> {
    const reports = await this.getGameReports();
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
  }): Promise<void> {
    const reports = await this.getGameReports();
    const todayDate = this.getTodayDateString();
    
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
        games: []
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
      winnerFound: gameData.winnerFound
    };

    todaysReport.games.push(gameEntry);
    todaysReport.totalGames += 1;
    todaysReport.totalCardsSold += gameData.cardsSold;
    todaysReport.totalCollectedAmount += gameData.collectedAmount;
    todaysReport.totalProfit += profitAmount;

    await this.saveGameReports(reports);
    
    // Auto-add profit to cash report
    await this.addCashTransaction({
      type: 'credit',
      amount: profitAmount,
      reason: 'game_profit',
      description: `Profit from Game #${gameEntry.gameNumber}`
    });
  }

  static async getGameReportByDate(date: string): Promise<GameReport | null> {
    const reports = await this.getGameReports();
    return reports.find(report => report.date === date) || null;
  }

  static async getGameReportsInDateRange(startDate: string, endDate: string): Promise<GameReport[]> {
    const reports = await this.getGameReports();
    return reports.filter(report => report.date >= startDate && report.date <= endDate);
  }

  // Cash Reports
  static async getCashReports(): Promise<CashReport[]> {
    try {
      const data = await AsyncStorage.getItem(CASH_REPORTS_KEY);
      if (!data) return [];
      return JSON.parse(data).map((report: any) => ({
        ...report,
        transactions: report.transactions.map((transaction: any) => ({
          ...transaction,
          timestamp: new Date(transaction.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error loading cash reports:', error);
      return [];
    }
  }

  static async saveCashReports(reports: CashReport[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CASH_REPORTS_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving cash reports:', error);
    }
  }

  static async getTodaysCashReport(): Promise<CashReport | null> {
    const reports = await this.getCashReports();
    const todayDate = this.getTodayDateString();
    return reports.find(report => report.date === todayDate) || null;
  }

  static async addCashTransaction(transactionData: {
    type: 'debit' | 'credit';
    amount: number;
    reason: string;
    description?: string;
  }): Promise<void> {
    const reports = await this.getCashReports();
    const todayDate = this.getTodayDateString();
    
    let todaysReport = reports.find(report => report.date === todayDate);
    
    if (!todaysReport) {
      todaysReport = {
        id: this.generateId(),
        date: todayDate,
        transactions: [],
        totalDebit: 0,
        totalCredit: 0,
        netBalance: 0
      };
      reports.push(todaysReport);
    }

    const transaction: CashTransaction = {
      id: this.generateId(),
      timestamp: new Date(),
      type: transactionData.type,
      amount: transactionData.amount,
      reason: transactionData.reason,
      description: transactionData.description
    };

    todaysReport.transactions.push(transaction);
    
    if (transaction.type === 'debit') {
      todaysReport.totalDebit += transaction.amount;
    } else {
      todaysReport.totalCredit += transaction.amount;
    }
    
    todaysReport.netBalance = todaysReport.totalCredit - todaysReport.totalDebit;

    await this.saveCashReports(reports);
  }

  static async getCashReportByDate(date: string): Promise<CashReport | null> {
    const reports = await this.getCashReports();
    return reports.find(report => report.date === date) || null;
  }

  static async getCashReportsInDateRange(startDate: string, endDate: string): Promise<CashReport[]> {
    const reports = await this.getCashReports();
    return reports.filter(report => report.date >= startDate && report.date <= endDate);
  }

  static async updateCashTransaction(transactionId: string, updates: Partial<CashTransaction>): Promise<void> {
    const reports = await this.getCashReports();
    
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
        
        await this.saveCashReports(reports);
        break;
      }
    }
  }

  static async deleteCashTransaction(transactionId: string): Promise<void> {
    const reports = await this.getCashReports();
    
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
        
        await this.saveCashReports(reports);
        break;
      }
    }
  }

  // Utility methods
  static async clearAllReports(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([GAME_REPORTS_KEY, CASH_REPORTS_KEY]);
    } catch (error) {
      console.error('Error clearing reports:', error);
    }
  }

  static async exportReportsData(): Promise<{ gameReports: GameReport[], cashReports: CashReport[] }> {
    const [gameReports, cashReports] = await Promise.all([
      this.getGameReports(),
      this.getCashReports()
    ]);
    
    return { gameReports, cashReports };
  }

  static async importReportsData(data: { gameReports: GameReport[], cashReports: CashReport[] }): Promise<void> {
    await Promise.all([
      this.saveGameReports(data.gameReports),
      this.saveCashReports(data.cashReports)
    ]);
  }

  // Summary statistics
  static async getGameSummaryStats(startDate?: string, endDate?: string): Promise<{
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
      reports = await this.getGameReportsInDateRange(startDate, endDate);
    } else {
      reports = await this.getGameReports();
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

  static async getCashSummaryStats(startDate?: string, endDate?: string): Promise<{
    totalCredit: number;
    totalDebit: number;
    netBalance: number;
    transactionCount: number;
  }> {
    let reports: CashReport[];
    
    if (startDate && endDate) {
      reports = await this.getCashReportsInDateRange(startDate, endDate);
    } else {
      reports = await this.getCashReports();
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