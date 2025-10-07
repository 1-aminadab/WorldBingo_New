import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../components/ui/ThemeProvider';

import { ReportStorageManager } from '../../utils/reportStorage';
import { CashReport, CashTransaction } from '../../types';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { FilterPeriod, getDateRange, isDateInRange, formatDateForDisplay, getDaysCount } from '../../utils/dateUtils';

const { width, height } = Dimensions.get('window');

export const TransactionReport: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }

      return () => {
        // Show tab bar again when leaving
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
              marginBottom: 42
            }
          });
        }
      };
    }, [navigation, theme])
  );
  const [allCashReports, setAllCashReports] = useState<CashReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CashReport[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit'>('all');
  
  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  
  // Form states
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    reason: '',
    description: ''
  });
  const [summaryStats, setSummaryStats] = useState({
    totalCredit: 1000, // Default 1000 coin deposit
    totalDebit: 0,
    netBalance: 1000, // Start with 1000 coins
    transactionCount: 0,
    dateRange: '',
    daysCount: 0
  });

  const loadReports = async () => {
    setIsRefreshing(true);
    try {
      const cashData = await ReportStorageManager.getCashReports();
      setAllCashReports(cashData.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error('Error loading cash reports:', error);
      Alert.alert('Error', 'Failed to load cash reports');
    } finally {
      setIsRefreshing(false);
    }
  };

  const applyDateFilter = () => {
    const dateRange = getDateRange(selectedPeriod, 
      customStartDate && customEndDate 
        ? { startDate: customStartDate, endDate: customEndDate } 
        : undefined
    );

    const filtered = allCashReports.filter(report => 
      isDateInRange(report.date, dateRange)
    );

    setFilteredReports(filtered);

    // Calculate filtered stats
    const stats = {
      totalCredit: 1000, // Start with default 1000 coins
      totalDebit: 0,
      transactionCount: 0,
    };

    filtered.forEach(report => {
      stats.totalCredit += report.totalCredit;
      stats.totalDebit += report.totalDebit;
      stats.transactionCount += report.transactions.length;
    });

    const daysCount = getDaysCount(dateRange);
    
    setSummaryStats({
      totalCredit: stats.totalCredit,
      totalDebit: stats.totalDebit,
      netBalance: stats.totalCredit - stats.totalDebit,
      transactionCount: stats.transactionCount,
      dateRange: `${formatDateForDisplay(dateRange.startDate)} - ${formatDateForDisplay(dateRange.endDate)}`,
      daysCount
    });
  };

  const handleFilterChange = (period: FilterPeriod, customRange?: { startDate: Date; endDate: Date }) => {
    setSelectedPeriod(period);
    if (customRange) {
      setCustomStartDate(customRange.startDate);
      setCustomEndDate(customRange.endDate);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (allCashReports.length > 0) {
      applyDateFilter();
    }
  }, [allCashReports, selectedPeriod, customStartDate, customEndDate]);

  const formatCurrency = (amount: number) => `${Math.round(amount)} Coins`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAddBalance = () => {
    setTransactionForm({
      amount: '',
      reason: '',
      description: ''
    });
    setShowTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    if (transactionForm.amount || transactionForm.reason || transactionForm.description) {
      setShowWarningModal(true);
    } else {
      setShowTransactionModal(false);
    }
  };

  const handleConfirmClose = () => {
    setShowWarningModal(false);
    setShowTransactionModal(false);
    setTransactionForm({
      amount: '',
      reason: '',
      description: ''
    });
  };

  const handleSubmitTransaction = async () => {
    const amount = Math.round(parseFloat(transactionForm.amount));
    
    if (isNaN(amount) || !transactionForm.reason.trim()) {
      Alert.alert('Error', 'Please fill in amount and reason');
      return;
    }

    try {
      // Always create positive transactions (credit) for coin purchases
      await ReportStorageManager.addCashTransaction({
        type: 'credit',
        amount,
        reason: transactionForm.reason,
        description: transactionForm.description || 'Coin purchase'
      });
      
      setShowTransactionModal(false);
      setShowSuccessModal(true);
      loadReports();
      
      setTransactionForm({
        amount: '',
        reason: '',
        description: ''
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const showBalanceInput = (type: 'debit' | 'credit') => {
    Alert.prompt(
      `${type === 'credit' ? 'Add' : 'Deduct'} Coins`,
      'Enter amount and reason (format: amount,reason)',
      async (input) => {
        if (input) {
          const [amountStr, ...reasonParts] = input.split(',');
          const amount = Math.round(parseFloat(amountStr.trim()));
          const reason = reasonParts.join(',').trim();
          
          if (isNaN(amount) || !reason) {
            Alert.alert('Error', 'Invalid format. Use: amount,reason');
            return;
          }

          try {
            // Only allow coin purchases (credit) to add to balance
            // Game transactions should always be debit (negative)
            const transactionType = type === 'credit' && reason.toLowerCase().includes('purchase') ? 'credit' : 'debit';
            
            await ReportStorageManager.addCashTransaction({
              type: transactionType,
              amount,
              reason: reason.toLowerCase().includes('game') ? 'game' : reason,
              description: `Manual ${transactionType === 'credit' ? 'coin purchase' : 'coin deduction'}`
            });
            loadReports();
          } catch (error) {
            Alert.alert('Error', 'Failed to add balance');
          }
        }
      }
    );
  };

  const renderTransactionItem = (transaction: CashTransaction) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionContent}>
        <View style={[
          styles.transactionTypeIcon,
          { backgroundColor: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.transactionTypeText}>
            {transaction.type === 'credit' ? '+' : '-'}
          </Text>
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionDescription, { color: theme.colors.text }]}>
            {transaction.reason === 'game_profit' ? 'Game' : transaction.reason}
          </Text>
          <Text style={[styles.transactionCategory, { color: theme.colors.textSecondary }]}>
            {new Date(transaction.timestamp).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} • {transaction.description}
          </Text>
        </View>
        
        <Text style={[
          styles.transactionAmount,
          { color: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
        ]}>
          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.surface} barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={loadReports} />
        }
      >
        {/* Unified Compact Filter Section */}
        <View style={[styles.unifiedFilterCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.filterRow}>
            <View style={styles.dateFilterSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.colors.textSecondary }]}>Period:</Text>
              <TouchableOpacity
                style={[styles.compactDateButton, { borderColor: theme.colors.border }]}
                onPress={() => {
                  // Use the existing DateRangeFilter modal logic
                  setShowDateFilterModal(true);
                }}
              >
                <Text style={[styles.compactDateText, { color: theme.colors.text }]}>
                  {selectedPeriod === 'today' ? 'Today' :
                   selectedPeriod === 'yesterday' ? 'Yesterday' :
                   selectedPeriod === 'this_week' ? 'This Week' :
                   selectedPeriod === 'last_week' ? 'Last Week' :
                   selectedPeriod === 'this_month' ? 'This Month' :
                   selectedPeriod === 'last_month' ? 'Last Month' :
                   selectedPeriod === 'custom' ? 'Custom' : 'Today'}
                </Text>
                <View style={styles.compactDateIcon}>
                  <Text style={{ color: theme.colors.primary, fontSize: 12 }}>📅</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.typeFilterSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.colors.textSecondary }]}>Type:</Text>
              <View style={styles.typeFilterChips}>
                {['all', 'credit', 'debit'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.compactTypeChip,
                      {
                        backgroundColor: transactionFilter === filter ? theme.colors.primary : 'transparent',
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => setTransactionFilter(filter as 'all' | 'credit' | 'debit')}
                  >
                    <Text style={[
                      styles.compactTypeText,
                      { color: transactionFilter === filter ? 'white' : theme.colors.text }
                    ]}>
                      {filter === 'all' ? 'All' : filter === 'credit' ? 'In' : 'Out'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Compact Balance Section */}
        <View style={[styles.compactBalanceCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Current Balance</Text>
              <Text style={[styles.balanceAmount, { color: theme.colors.text }]}>
                {formatCurrency(summaryStats.netBalance)}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.compactAddButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddBalance}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Transactions List */}
        {filteredReports.length > 0 ? (
          <View style={styles.transactionsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recent Transactions ({filteredReports.reduce((sum, report) => sum + report.transactions.length, 0)})
            </Text>
            
            {filteredReports.map(report => (
              <View key={report.date} style={[styles.compactDailyCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.compactDayHeader}>
                  <Text style={[styles.compactDayDate, { color: theme.colors.text }]}>
                    {formatDate(report.date)}
                  </Text>
                  <Text style={[styles.compactDaySummary, { color: theme.colors.textSecondary }]}>
                    {report.transactions.length} txn • {formatCurrency(report.netBalance)}
                  </Text>
                </View>
                
                <View style={styles.transactionsList}>
                  {report.transactions
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .filter(transaction => {
                      if (transactionFilter === 'all') return true;
                      return transaction.type === transactionFilter;
                    })
                    .map(renderTransactionItem)}
                </View>
              </View>
            ))}            
          </View>
        ) : (
          <View style={[styles.emptyStateCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No transactions yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Add your first transaction to get started
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Transaction Modal */}
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseTransactionModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <StatusBar backgroundColor={theme.colors.surface} barStyle="light-content" />
          
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity onPress={handleCloseTransactionModal} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Purchase Coins</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Amount */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.colors.text }]}>Amount (Coins)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Enter amount"
                placeholderTextColor={theme.colors.textSecondary}
                value={transactionForm.amount}
                onChangeText={(text) => setTransactionForm(prev => ({ ...prev, amount: text }))}
                keyboardType="numeric"
              />
            </View>

            {/* Reason */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.colors.text }]}>Reason</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Enter reason (e.g., Top-up, Referral, Bonus)"
                placeholderTextColor={theme.colors.textSecondary}
                value={transactionForm.reason}
                onChangeText={(text) => setTransactionForm(prev => ({ ...prev, reason: text }))}
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.colors.text }]}>Description (Optional)</Text>
              <TextInput
                style={[styles.formInputMultiline, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Additional details..."
                placeholderTextColor={theme.colors.textSecondary}
                value={transactionForm.description}
                onChangeText={(text) => setTransactionForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.modalFooterButton, styles.cancelButton, { backgroundColor: '#ef4444' }]}
              onPress={handleCloseTransactionModal}
            >
              <Text style={styles.modalFooterButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalFooterButton, styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubmitTransaction}
            >
              <Text style={styles.modalFooterButtonText}>Purchase Coins</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.overlayModal}>
          <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>Coins Purchased!</Text>
            <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>
              Your coins have been successfully added to your balance.
            </Text>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.overlayModal}>
          <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={[styles.warningTitle, { color: theme.colors.text }]}>Cancel Purchase?</Text>
            <Text style={[styles.warningMessage, { color: theme.colors.textSecondary }]}>
              Are you sure you want to cancel this coin purchase?
            </Text>
            <View style={styles.warningButtons}>
              <TouchableOpacity
                style={[styles.warningButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => setShowWarningModal(false)}
              >
                <Text style={[styles.warningButtonText, { color: theme.colors.text }]}>Continue Purchase</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.warningButton, { backgroundColor: '#ef4444' }]}
                onPress={handleConfirmClose}
              >
                <Text style={styles.warningButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Filter Modal */}
      <Modal
        visible={showDateFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateFilterModal(false)}
      >
        <View style={styles.overlayModal}>
          <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 0, maxWidth: 320, width: '90%' }]}>
            <View style={[styles.dateModalHeader, { backgroundColor: theme.colors.surface }]}>
              <Text style={styles.dateModalTitle}>Select Period</Text>
              <TouchableOpacity onPress={() => setShowDateFilterModal(false)}>
                <Text style={styles.dateModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateModalContent}>
              {[
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'this_week', label: 'This Week' },
                { value: 'last_week', label: 'Last Week' },
                { value: 'this_month', label: 'This Month' },
                { value: 'last_month', label: 'Last Month' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dateModalOption,
                    {
                      backgroundColor: selectedPeriod === option.value ? theme.colors.primary + '20' : 'transparent',
                      borderColor: selectedPeriod === option.value ? theme.colors.primary : 'transparent',
                    }
                  ]}
                  onPress={() => {
                    handleFilterChange(option.value as FilterPeriod);
                    setShowDateFilterModal(false);
                  }}
                >
                  <Text style={[
                    styles.dateModalOptionText,
                    { color: selectedPeriod === option.value ? theme.colors.primary : theme.colors.text }
                  ]}>
                    {option.label}
                  </Text>
                  {selectedPeriod === option.value && (
                    <Text style={[styles.dateModalCheck, { color: theme.colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 8,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
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
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  netBalanceCard: {
    flex: 0.6,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
  addBalanceButton: {
    flex: 0.4,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  addBalanceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionLeft: {
    flex: 1,
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
  dailyReportCard: {
    marginBottom: 16,
  },
  dailyReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dailyReportDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  dailyReportSummary: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreTransactionsText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 20,
  },
  periodSummary: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  periodSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 50,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  formInputMultiline: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  modalFooterButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalFooterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    // Additional cancel button styles if needed
  },
  submitButton: {
    // Additional submit button styles if needed
  },
  
  // Overlay Modal Styles
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Success Modal Styles
  successModal: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Warning Modal Styles
  warningModal: {
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  warningButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  warningButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  warningButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Compact UI Styles
  unifiedFilterCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  dateFilterSection: {
    flex: 1,
  },
  typeFilterSection: {
    flex: 1,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  compactDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
  },
  compactDateText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  compactDateIcon: {
    marginLeft: 6,
  },
  typeFilterChips: {
    flexDirection: 'row',
    gap: 4,
  },
  compactTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
    minHeight: 32,
    justifyContent: 'center',
  },
  compactTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  compactBalanceCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  compactAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },


  compactDailyCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  compactDayDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactDaySummary: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionsList: {
    gap: 4,
  },
  transactionTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },

  emptyStateCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Date Modal Styles
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dateModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  dateModalClose: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    padding: 4,
  },
  dateModalContent: {
    padding: 8,
  },
  dateModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
    borderWidth: 1,
  },
  dateModalOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateModalCheck: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 