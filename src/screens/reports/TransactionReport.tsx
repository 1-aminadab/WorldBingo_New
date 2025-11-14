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
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Plus, Minus, Calendar, CreditCard, ArrowUpRight, ArrowDownLeft, Coins } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../components/ui/ThemeProvider';

import { ReportStorageManager } from '../../utils/reportStorage';
import { CashReport, CashTransaction } from '../../types';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { FilterPeriod, getDateRange, isDateInRange, formatDateForDisplay, getDaysCount } from '../../utils/dateUtils';
import { useAuthStore } from '../../store/authStore';
import { transactionApiService } from '../../api/services/transaction';
import { formatCoins } from '../../utils/numberFormat';
import { ScreenNames } from '../../constants/ScreenNames';
import { setTabBarVisibility } from '../../utils/tabBarStyles';

const { width, height } = Dimensions.get('window');

export const TransactionReport: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, userCoins } = useAuthStore();

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisibility(navigation, false);

      // Don't restore tab bar here - let other screens handle it
      return () => {
        // No cleanup needed - other screens will manage tab bar visibility
      };
    }, [navigation])
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
    totalCredit: 0, // Only actual transactions
    totalDebit: 0,
    netBalance: 0, // Calculated from actual transactions
    transactionCount: 0,
    dateRange: '',
    daysCount: 0
  });

  const loadReports = async () => {
    setIsRefreshing(true);
    try {
      const userId = user?.userId || user?.id; // Get userId from auth store (handle both formats)
      const cashData = await ReportStorageManager.getCashReports(userId);
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
      totalCredit: 0, // Only actual transactions
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAddBalance = () => {
    const userId = user?.userId || user?.id;
    navigation.navigate(ScreenNames.PAYMENT_WEBVIEW as never);
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
      const userId = user?.userId || user?.id; // Get userId from auth store (handle both formats)
      // Always create positive transactions (credit) for coin purchases
      await ReportStorageManager.addCashTransaction({
        type: 'credit',
        amount,
        reason: transactionForm.reason,
        description: transactionForm.description || 'Coin purchase',
        userId // Pass userId to transaction
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
            const userId = user?.userId || user?.id; // Get userId from auth store (handle both formats)
            // Only allow coin purchases (credit) to add to balance
            // Game transactions should always be debit (negative)
            const transactionType = type === 'credit' && reason.toLowerCase().includes('purchase') ? 'credit' : 'debit';
            
            await ReportStorageManager.addCashTransaction({
              type: transactionType,
              amount,
              reason: reason.toLowerCase().includes('game') ? 'game' : reason,
              description: `Manual ${transactionType === 'credit' ? 'coin purchase' : 'coin deduction'}`,
              userId // Pass userId to transaction
            });
            loadReports();
          } catch (error) {
            Alert.alert('Error', 'Failed to add balance');
          }
        }
      }
    );
  };


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
        {/* Modern Date Range Picker */}
        <DateRangePicker
          selectedPeriod={selectedPeriod}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onFilterChange={handleFilterChange}
          onQuickFilterPress={() => setShowDateFilterModal(true)}
        />

        {/* Balance Hero Card */}
        <View style={[styles.balanceHeroCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.balanceHeroContent}>
            <View style={styles.balanceIconContainer}>
              <Wallet size={28} color="white" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>{formatCoins(userCoins)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBalanceBtn}
            onPress={handleAddBalance}
          >
            <Plus size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCardsRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
            <View style={styles.summaryCardContent}>
              <ArrowUpRight size={20} color="white" />
              <View style={styles.summaryCardText}>
                <Text style={styles.summaryValue}>{formatCoins(summaryStats.totalCredit)}</Text>
                <Text style={styles.summaryLabel}>Received</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#EF4444' }]}>
            <View style={styles.summaryCardContent}>
              <ArrowDownLeft size={20} color="white" />
              <View style={styles.summaryCardText}>
                <Text style={styles.summaryValue}>{formatCoins(summaryStats.totalDebit)}</Text>
                <Text style={styles.summaryLabel}>Spent</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsContainer}>
          {[
            { key: 'all', label: 'All', icon: CreditCard },
            { key: 'credit', label: 'Received', icon: ArrowUpRight },
            { key: 'debit', label: 'Spent', icon: ArrowDownLeft }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: transactionFilter === filter.key ? theme.colors.primary : theme.colors.surface,
                  borderColor: transactionFilter === filter.key ? theme.colors.primary : theme.colors.border,
                }
              ]}
              onPress={() => setTransactionFilter(filter.key as 'all' | 'credit' | 'debit')}
            >
              <filter.icon size={14} color={transactionFilter === filter.key ? 'white' : theme.colors.textSecondary} />
              <Text style={[
                styles.filterChipText,
                { color: transactionFilter === filter.key ? 'white' : theme.colors.text }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* Transactions List */}
        {filteredReports.length > 0 ? (
          <View style={styles.transactionsContainer}>
            <View style={styles.transactionsSectionHeader}>
              <View style={styles.transactionsTitleContainer}>
                <Coins size={20} color={theme.colors.primary} />
                <Text style={[styles.transactionsSectionTitle, { color: theme.colors.text }]}>Recent Transactions</Text>
              </View>
              <View style={[styles.transactionsCountBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.transactionsCountText}>{filteredReports.reduce((sum, report) => sum + report.transactions.length, 0)}</Text>
              </View>
            </View>
            
            {filteredReports.map(report => (
              <View key={report.date} style={styles.dateGroup}>
                <View style={[styles.dateHeader, { backgroundColor: theme.colors.primary + '10', borderLeftColor: theme.colors.primary }]}>
                  <View style={styles.dateInfo}>
                    <Calendar size={14} color={theme.colors.primary} />
                    <Text style={[styles.dateHeaderText, { color: theme.colors.text }]}>{formatDate(report.date)}</Text>
                  </View>
                  <View style={styles.dateStats}>
                    <View style={styles.dateStat}>
                      <Text style={[styles.dateStatValue, { color: theme.colors.textSecondary }]}>{report.transactions.length}</Text>
                      <Text style={[styles.dateStatLabel, { color: theme.colors.textSecondary }]}>txns</Text>
                    </View>
                    <View style={styles.dateStat}>
                      <Text style={[styles.dateStatValue, { color: report.netBalance >= 0 ? '#10B981' : '#EF4444' }]}>{formatCoins(Math.abs(report.netBalance))}</Text>
                      <Text style={[styles.dateStatLabel, { color: theme.colors.textSecondary }]}>net</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.transactionsFlow}>
                  {report.transactions
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .filter(transaction => {
                      if (transactionFilter === 'all') return true;
                      return transaction.type === transactionFilter;
                    })
                    .map((transaction, index) => (
                      <View key={`${report.date}-${index}`} style={[styles.transactionFlowItem, { backgroundColor: theme.colors.surface }]}>
                        <View style={[
                          styles.transactionIcon,
                          { backgroundColor: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
                        ]}>
                          {transaction.type === 'credit' ? 
                            <ArrowUpRight size={14} color="white" /> : 
                            <ArrowDownLeft size={14} color="white" />
                          }
                        </View>
                        
                        <View style={styles.transactionDetails}>
                          <Text style={[styles.transactionTitle, { color: theme.colors.text }]}>
                            {transaction.reason === 'payin' ? 'Game Start' : 
                             transaction.reason === 'payout' ? 'Game Payout' : 
                             transaction.reason === 'game_profit' ? 'Payout' :
                             transaction.reason}
                          </Text>
                          <Text style={[styles.transactionSubtitle, { color: theme.colors.textSecondary }]}>
                            {new Date(transaction.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} • {transaction.description}
                          </Text>
                        </View>
                        
                        <Text style={[
                          styles.transactionAmount,
                          { color: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
                        ]}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCoins(transaction.amount)}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            ))}            
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Coins size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Transactions Yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Start playing or add coins to see your transaction history
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
    paddingVertical: 4,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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

  // Modern Dynamic UI Styles
  
  balanceHeroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  balanceHeroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
  },
  addBalanceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryCardText: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  transactionsContainer: {
    marginBottom: 24,
  },
  transactionsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionsCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
  transactionsCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },


  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateStats: {
    flexDirection: 'row',
    gap: 16,
  },
  dateStat: {
    alignItems: 'center',
  },
  dateStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateStatLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  
  transactionsFlow: {
    gap: 8,
  },
  transactionFlowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
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

  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
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