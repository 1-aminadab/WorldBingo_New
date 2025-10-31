// Debug script to test transaction storage/retrieval
const { ReportStorageManager } = require('./src/utils/reportStorage');

async function debugTransactions() {
  console.log('=== DEBUG TRANSACTION STORAGE ===');
  
  // Test with different user ID formats
  const testUserId1 = "123";
  const testUserId2 = "+251987654321";
  
  // Add test transactions
  console.log('\n1. Adding test transactions...');
  await ReportStorageManager.addCashTransaction({
    type: 'debit',
    amount: 100,
    reason: 'payin',
    description: 'Test game start',
    userId: testUserId1
  });
  
  await ReportStorageManager.addCashTransaction({
    type: 'debit', 
    amount: 50,
    reason: 'payin',
    description: 'Test game start 2',
    userId: testUserId2
  });
  
  // Retrieve with exact same IDs
  console.log('\n2. Retrieving with exact same user IDs...');
  const reports1 = await ReportStorageManager.getCashReports(testUserId1);
  const reports2 = await ReportStorageManager.getCashReports(testUserId2);
  
  console.log(`Reports for userId1 (${testUserId1}):`, reports1.length);
  console.log(`Reports for userId2 (${testUserId2}):`, reports2.length);
  
  // Retrieve all reports (no filter)
  console.log('\n3. Retrieving all reports...');
  const allReports = await ReportStorageManager.getCashReports();
  console.log('All reports:', allReports.length);
  
  // Show detailed report structures
  allReports.forEach((report, index) => {
    console.log(`Report ${index + 1}:`, {
      id: report.id,
      date: report.date,
      userId: report.userId,
      transactionCount: report.transactions.length,
      transactions: report.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        reason: t.reason,
        userId: t.userId
      }))
    });
  });
}

debugTransactions().catch(console.error);