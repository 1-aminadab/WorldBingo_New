import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../components/ui/ThemeProvider';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 100,
    description: 'Coin Purchase',
    date: 'Today',
    category: 'Purchase',
  },
  {
    id: '2',
    type: 'income',
    amount: 50,
    description: 'Watch Ad Reward',
    date: 'Yesterday',
    category: 'Reward',
  },
  {
    id: '3',
    type: 'expense',
    amount: 25,
    description: 'Game Entry Fee',
    date: '2 days ago',
    category: 'Game',
  },
  {
    id: '4',
    type: 'income',
    amount: 200,
    description: 'Tournament Win',
    date: '3 days ago',
    category: 'Prize',
  },
  {
    id: '5',
    type: 'income',
    amount: 75,
    description: 'Referral Bonus',
    date: '1 week ago',
    category: 'Referral',
  },
  {
    id: '6',
    type: 'expense',
    amount: 30,
    description: 'Premium Features',
    date: '1 week ago',
    category: 'Upgrade',
  },
];

export const TransactionReport: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const totalIncome = mockTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netGain = totalIncome - totalExpense;

  const renderTransactionItem = (transaction: Transaction) => (
    <View
      key={transaction.id}
      style={[
        styles.transactionItem,
        { backgroundColor: theme.colors.card },
      ]}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.categoryIcon,
            {
              backgroundColor:
                transaction.type === 'income' ? '#10B981' : '#EF4444',
            },
          ]}
        >
          <Text style={styles.categoryIconText}>
            {transaction.type === 'income' ? '📈' : '📉'}
          </Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionDescription, { color: theme.colors.text }]}>
            {transaction.description}
          </Text>
          <Text style={[styles.transactionCategory, { color: theme.colors.textSecondary }]}>
            {transaction.category} • {transaction.date}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            {
              color: transaction.type === 'income' ? '#10B981' : '#EF4444',
            },
          ]}
        >
          {transaction.type === 'income' ? '+' : '-'}{transaction.amount} Birr
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💸 Transaction Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryAmount}>+{totalIncome} Birr</Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.summaryAmount}>-{totalExpense} Birr</Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: netGain >= 0 ? '#10B981' : '#EF4444' }]}>
            <Text style={styles.summaryLabel}>Net Gain</Text>
            <Text style={styles.summaryAmount}>
              {netGain >= 0 ? '+' : ''}{netGain} Birr
            </Text>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Transactions
          </Text>
          
          {mockTransactions.map(renderTransactionItem)}
        </View>

        {/* Statistics */}
        <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            📊 Transaction Statistics
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {mockTransactions.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total Transactions
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {mockTransactions.filter(t => t.type === 'income').length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Income Transactions
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {mockTransactions.filter(t => t.type === 'expense').length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Expense Transactions
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
                {Math.round((totalIncome / (totalIncome + totalExpense)) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Income Ratio
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  transactionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 