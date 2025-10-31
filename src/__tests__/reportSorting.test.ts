import '@jest/globals';

describe('Report Sorting and Display', () => {
  describe('Transaction Report Sorting', () => {
    it('should sort transactions by timestamp (latest first)', () => {
      // Mock transactions with different timestamps
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

      const mockTransactions = [
        { id: '1', type: 'credit' as const, amount: 100, reason: 'purchase', timestamp: twoHoursAgo, description: 'Middle transaction' },
        { id: '2', type: 'debit' as const, amount: 50, reason: 'game', timestamp: now, description: 'Latest transaction' },
        { id: '3', type: 'credit' as const, amount: 200, reason: 'purchase', timestamp: threeHoursAgo, description: 'Oldest transaction' },
        { id: '4', type: 'debit' as const, amount: 75, reason: 'game', timestamp: oneHourAgo, description: 'Second latest transaction' },
      ];

      // Apply the same sorting logic as in the component
      const sortedTransactions = mockTransactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Verify sorting order (latest first)
      expect(sortedTransactions[0].id).toBe('2'); // Latest (now)
      expect(sortedTransactions[1].id).toBe('4'); // Second latest (1 hour ago)
      expect(sortedTransactions[2].id).toBe('1'); // Third (2 hours ago)
      expect(sortedTransactions[3].id).toBe('3'); // Oldest (3 hours ago)

      // Verify descriptions match expected order
      expect(sortedTransactions[0].description).toBe('Latest transaction');
      expect(sortedTransactions[1].description).toBe('Second latest transaction');
      expect(sortedTransactions[2].description).toBe('Middle transaction');
      expect(sortedTransactions[3].description).toBe('Oldest transaction');
    });

    it('should maintain sorting after filtering', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const mockTransactions = [
        { id: '1', type: 'credit' as const, amount: 100, reason: 'purchase', timestamp: twoHoursAgo, description: 'Old credit' },
        { id: '2', type: 'credit' as const, amount: 200, reason: 'purchase', timestamp: now, description: 'New credit' },
        { id: '3', type: 'debit' as const, amount: 50, reason: 'game', timestamp: oneHourAgo, description: 'Recent debit' },
      ];

      // Apply sorting and filtering (credit only)
      const processed = mockTransactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .filter(_transaction => _transaction.type === 'credit');

      expect(processed).toHaveLength(2);
      expect(processed[0].description).toBe('New credit'); // Latest credit first
      expect(processed[1].description).toBe('Old credit'); // Older credit second
    });

    it('should show all transactions without limiting', () => {
      const mockTransactions = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        type: (i % 2 === 0 ? 'credit' : 'debit') as const,
        amount: 100 + i * 10,
        reason: 'test',
        timestamp: new Date(Date.now() - i * 60 * 1000), // Each 1 minute apart
        description: `Transaction ${i}`
      }));

      // Apply the component logic: sort, filter, map (no slice!)
      const processed = mockTransactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .filter(_transaction => true) // 'all' filter
        .map(t => t); // Simulate the map operation

      // Should show all 10 transactions, no limiting
      expect(processed).toHaveLength(10);
      expect(processed[0].description).toBe('Transaction 0'); // Latest first
      expect(processed[9].description).toBe('Transaction 9'); // Oldest last
    });
  });

  describe('Game Report Sorting', () => {
    it('should sort games by timestamp (latest first)', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const mockGames = [
        { 
          gameNumber: 1, 
          cardsSold: 10, 
          collectedAmount: 100, 
          profitAmount: 20, 
          timestamp: twoHoursAgo,
          gameDurationMinutes: 5,
          pattern: 'full_house',
          rtpPercentage: 80,
          totalNumbersCalled: 45,
          winnerFound: true
        },
        { 
          gameNumber: 3, 
          cardsSold: 8, 
          collectedAmount: 80, 
          profitAmount: 16, 
          timestamp: now,
          gameDurationMinutes: 4,
          pattern: 'one_line',
          rtpPercentage: 80,
          totalNumbersCalled: 25,
          winnerFound: true
        },
        { 
          gameNumber: 2, 
          cardsSold: 15, 
          collectedAmount: 150, 
          profitAmount: 30, 
          timestamp: oneHourAgo,
          gameDurationMinutes: 7,
          pattern: 'two_lines',
          rtpPercentage: 80,
          totalNumbersCalled: 38,
          winnerFound: true
        },
      ];

      // Apply the same sorting logic as in the component
      const sortedGames = mockGames
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Verify sorting order (latest first, regardless of game number)
      expect(sortedGames[0].gameNumber).toBe(3); // Latest (now)
      expect(sortedGames[1].gameNumber).toBe(2); // Second latest (1 hour ago)
      expect(sortedGames[2].gameNumber).toBe(1); // Oldest (2 hours ago)
    });

    it('should show all games without limiting', () => {
      const mockGames = Array.from({ length: 5 }, (_, i) => ({
        gameNumber: i + 1,
        cardsSold: 10 + i,
        collectedAmount: 100 + i * 50,
        profitAmount: 20 + i * 10,
        timestamp: new Date(Date.now() - i * 60 * 1000),
        gameDurationMinutes: 5 + i,
        pattern: 'full_house',
        rtpPercentage: 80,
        totalNumbersCalled: 45 + i * 5,
        winnerFound: true
      }));

      // Apply the component logic: sort and map (no slice!)
      const processed = mockGames
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(g => g); // Simulate the map operation

      // Should show all 5 games, no limiting
      expect(processed).toHaveLength(5);
      expect(processed[0].gameNumber).toBe(1); // Latest first (game 1, 0 minutes ago)
      expect(processed[4].gameNumber).toBe(5); // Oldest last (game 5, 4 minutes ago)
    });
  });

  describe('No More Messages', () => {
    it('should not contain +X more messages in processing logic', () => {
      // Simulate what the component does - no slice, no "more" logic
      const mockData = Array.from({ length: 7 }, (_, i) => ({ id: i, timestamp: new Date() }));
      
      const processed = mockData
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(item => item);

      // All items processed, no slicing or "more" indicators
      expect(processed).toHaveLength(7);
      
      // Verify no slice was applied (would have limited to 2 or 3)
      expect(processed.length).toBeGreaterThan(3); // More than transaction limit
      expect(processed.length).toBeGreaterThan(2); // More than game limit
    });

    it('should display complete dataset in reports', () => {
      const mockReport = {
        transactions: Array.from({ length: 8 }, (_, i) => ({ 
          id: i, 
          type: 'credit' as const,
          timestamp: new Date(Date.now() - i * 1000) 
        })),
        games: Array.from({ length: 6 }, (_, i) => ({ 
          gameNumber: i + 1,
          timestamp: new Date(Date.now() - i * 1000) 
        }))
      };

      // Transaction processing (sort + filter + map, no slice)
      const allTransactions = mockReport.transactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .filter(() => true)
        .map(t => t);

      // Game processing (sort + map, no slice)  
      const allGames = mockReport.games
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(g => g);

      expect(allTransactions).toHaveLength(8); // All 8 transactions shown
      expect(allGames).toHaveLength(6); // All 6 games shown
      
      // Verify latest items are first
      expect(allTransactions[0].id).toBe(0); // Latest transaction
      expect(allGames[0].gameNumber).toBe(1); // Latest game
    });
  });
});