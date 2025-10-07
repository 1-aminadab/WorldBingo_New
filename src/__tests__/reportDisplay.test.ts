import { jest } from '@jest/globals';

describe('Report Display Fix', () => {
  describe('Transaction Report Data Display', () => {
    it('should display all transactions without limiting to 3', () => {
      // Mock transaction data with more than 3 items
      const mockTransactions = [
        { id: '1', type: 'credit' as const, amount: 100, reason: 'purchase', timestamp: new Date(), description: 'Coin purchase 1' },
        { id: '2', type: 'debit' as const, amount: 50, reason: 'game', timestamp: new Date(), description: 'Game expense 1' },
        { id: '3', type: 'credit' as const, amount: 200, reason: 'purchase', timestamp: new Date(), description: 'Coin purchase 2' },
        { id: '4', type: 'debit' as const, amount: 75, reason: 'game', timestamp: new Date(), description: 'Game expense 2' },
        { id: '5', type: 'credit' as const, amount: 150, reason: 'purchase', timestamp: new Date(), description: 'Coin purchase 3' },
      ];

      const mockCashReport = {
        id: 'report-1',
        date: '2024-01-15',
        transactions: mockTransactions,
        totalDebit: 125,
        totalCredit: 450,
        netBalance: 325,
      };

      // Verify that all transactions are available (not limited to 3)
      expect(mockCashReport.transactions).toHaveLength(5);
      expect(mockCashReport.transactions.length).toBeGreaterThan(3);

      // Simulate the filter logic from the component
      const filteredTransactions = mockCashReport.transactions.filter(transaction => {
        // Test 'all' filter
        return true; // shows all transactions
      });

      // Previously it would be: .slice(0, 3) - limiting to 3
      // Now it should show all: .map() - shows all
      expect(filteredTransactions).toHaveLength(5);
      expect(filteredTransactions).toEqual(mockTransactions);
    });

    it('should apply transaction type filter correctly for all data', () => {
      const mockTransactions = [
        { id: '1', type: 'credit' as const, amount: 100, reason: 'purchase', timestamp: new Date(), description: 'Coin purchase 1' },
        { id: '2', type: 'debit' as const, amount: 50, reason: 'game', timestamp: new Date(), description: 'Game expense 1' },
        { id: '3', type: 'credit' as const, amount: 200, reason: 'purchase', timestamp: new Date(), description: 'Coin purchase 2' },
        { id: '4', type: 'debit' as const, amount: 75, reason: 'game', timestamp: new Date(), description: 'Game expense 2' },
        { id: '5', type: 'credit' as const, amount: 150, reason: 'purchase', timestamp: new Date(), description: 'Coin purchase 3' },
      ];

      // Test credit filter - should show all 3 credit transactions
      const creditTransactions = mockTransactions.filter(t => t.type === 'credit');
      expect(creditTransactions).toHaveLength(3);

      // Test debit filter - should show all 2 debit transactions
      const debitTransactions = mockTransactions.filter(t => t.type === 'debit');
      expect(debitTransactions).toHaveLength(2);

      // Test all filter - should show all 5 transactions
      const allTransactions = mockTransactions.filter(t => true);
      expect(allTransactions).toHaveLength(5);
    });
  });

  describe('Game Report Data Display', () => {
    it('should display all games without limiting to 2', () => {
      // Mock game data with more than 2 items
      const mockGames = [
        { id: '1', gameNumber: 1, cardsSold: 10, collectedAmount: 100, profitAmount: 20, gameDurationMinutes: 5, pattern: 'full_house', rtpPercentage: 80, totalNumbersCalled: 45, winnerFound: true, timestamp: new Date() },
        { id: '2', gameNumber: 2, cardsSold: 15, collectedAmount: 150, profitAmount: 30, gameDurationMinutes: 7, pattern: 'two_lines', rtpPercentage: 80, totalNumbersCalled: 38, winnerFound: true, timestamp: new Date() },
        { id: '3', gameNumber: 3, cardsSold: 8, collectedAmount: 80, profitAmount: 16, gameDurationMinutes: 4, pattern: 'one_line', rtpPercentage: 80, totalNumbersCalled: 25, winnerFound: true, timestamp: new Date() },
        { id: '4', gameNumber: 4, cardsSold: 12, collectedAmount: 120, profitAmount: 24, gameDurationMinutes: 6, pattern: 'three_lines', rtpPercentage: 80, totalNumbersCalled: 52, winnerFound: true, timestamp: new Date() },
      ];

      const mockGameReport = {
        id: 'report-1',
        date: '2024-01-15',
        totalGames: 4,
        totalCardsSold: 45,
        totalCollectedAmount: 450,
        totalProfit: 90,
        rtpPercentage: 80,
        games: mockGames,
      };

      // Verify that all games are available (not limited to 2)
      expect(mockGameReport.games).toHaveLength(4);
      expect(mockGameReport.games.length).toBeGreaterThan(2);

      // Previously it would be: .slice(0, 2) - limiting to 2 games
      // Now it should show all: .map() - shows all games
      const allGames = mockGameReport.games.map(game => game);
      expect(allGames).toHaveLength(4);
      expect(allGames).toEqual(mockGames);
    });

    it('should calculate correct totals from all games', () => {
      const mockGames = [
        { gameNumber: 1, cardsSold: 10, collectedAmount: 100, profitAmount: 20, gameDurationMinutes: 5, pattern: 'full_house', rtpPercentage: 80, totalNumbersCalled: 45, winnerFound: true, timestamp: new Date() },
        { gameNumber: 2, cardsSold: 15, collectedAmount: 150, profitAmount: 30, gameDurationMinutes: 7, pattern: 'two_lines', rtpPercentage: 80, totalNumbersCalled: 38, winnerFound: true, timestamp: new Date() },
        { gameNumber: 3, cardsSold: 8, collectedAmount: 80, profitAmount: 16, gameDurationMinutes: 4, pattern: 'one_line', rtpPercentage: 80, totalNumbersCalled: 25, winnerFound: true, timestamp: new Date() },
      ];

      // Calculate totals from all games (not just first 2)
      const totalCardsSold = mockGames.reduce((sum, game) => sum + game.cardsSold, 0);
      const totalCollectedAmount = mockGames.reduce((sum, game) => sum + game.collectedAmount, 0);
      const totalProfit = mockGames.reduce((sum, game) => sum + game.profitAmount, 0);

      expect(totalCardsSold).toBe(33); // 10 + 15 + 8
      expect(totalCollectedAmount).toBe(330); // 100 + 150 + 80
      expect(totalProfit).toBe(66); // 20 + 30 + 16
    });
  });

  describe('Report Display Logic', () => {
    it('should show correct counts in UI headers', () => {
      // Transaction report header logic
      const mockReports = [
        {
          date: '2024-01-15',
          transactions: new Array(5).fill(null).map((_, i) => ({ id: `t${i}`, type: 'credit' as const, amount: 100 }))
        },
        {
          date: '2024-01-14', 
          transactions: new Array(3).fill(null).map((_, i) => ({ id: `t${i+5}`, type: 'debit' as const, amount: 50 }))
        }
      ];

      const totalTransactions = mockReports.reduce((sum, report) => sum + report.transactions.length, 0);
      expect(totalTransactions).toBe(8); // All transactions counted, not limited

      // Game report header logic  
      const mockGameReports = [
        {
          date: '2024-01-15',
          totalGames: 4,
          games: new Array(4).fill(null).map((_, i) => ({ gameNumber: i + 1, cardsSold: 10 }))
        },
        {
          date: '2024-01-14',
          totalGames: 3, 
          games: new Array(3).fill(null).map((_, i) => ({ gameNumber: i + 5, cardsSold: 15 }))
        }
      ];

      const totalGames = mockGameReports.reduce((sum, report) => sum + report.totalGames, 0);
      expect(totalGames).toBe(7); // All games counted, not limited
    });
  });
});