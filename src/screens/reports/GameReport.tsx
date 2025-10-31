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
} from 'react-native';
import { ArrowLeft, TrendingUp, Users, DollarSign, Target, Clock, Trophy, BarChart3, Gamepad2, Zap } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { useGameReportStore } from '../../store/gameReportStore';

import { ReportStorageManager } from '../../utils/reportStorage';
import { GameReport as GameReportType, GameReportEntry } from '../../types';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { FilterPeriod, getDateRange, isDateInRange, formatDateForDisplay, getDaysCount } from '../../utils/dateUtils';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/numberFormat';
import { setTabBarVisibility, restoreTabBar } from '../../utils/tabBarStyles';

export const GameReport: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { currentReport, fetchCurrentUserReport } = useGameReportStore();

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisibility(navigation, false);

      return () => {
        // Show tab bar again when leaving
        restoreTabBar(navigation);
      };
    }, [navigation])
  );
  const [allGameReports, setAllGameReports] = useState<GameReportType[]>([]);
  const [filteredReports, setFilteredReports] = useState<GameReportType[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalGames: 0,
    totalCardsSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageRTP: 0,
    winRate: 0,
    dateRange: '',
    daysCount: 0,
    payinAmount: 0,
    payoutAmount: 0,
    profitAmount: 0
  });

  const loadReports = async () => {
    setIsRefreshing(true);
    try {
      const userId = user?.userId || user?.id; // Get userId from auth store (handle both formats)
      console.log('🎮 Loading game reports for user:', userId);
      const gameData = await ReportStorageManager.getGameReports(userId);
      console.log('🎮 Loaded game reports:', gameData.length);
      setAllGameReports(gameData.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error('Error loading game reports:', error);
      Alert.alert('Error', 'Failed to load game reports');
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

    const filtered = allGameReports.filter(report => 
      isDateInRange(report.date, dateRange)
    );

    setFilteredReports(filtered);

    // Calculate filtered stats
    const stats = {
      totalGames: 0,
      totalCardsSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalWins: 0,
      totalRTP: 0,
    };

    filtered.forEach(report => {
      stats.totalGames += report.totalGames;
      stats.totalCardsSold += report.totalCardsSold;
      stats.totalRevenue += report.totalCollectedAmount;
      stats.totalProfit += report.totalProfit;
      stats.totalRTP += (report.rtpPercentage * report.totalGames);
      
      report.games.forEach(game => {
        if (game.winnerFound) stats.totalWins += 1;
      });
    });

    const daysCount = getDaysCount(dateRange);
    const averageRTP = stats.totalGames > 0 ? stats.totalRTP / stats.totalGames : 0;
    const payinAmount = stats.totalRevenue; // Total money collected without RTP consideration
    const payoutAmount = stats.totalRevenue * (averageRTP / 100); // Total money paid out based on RTP
    const profitAmount = payinAmount - payoutAmount; // Payin - Payout
    
    setSummaryStats({
      totalGames: stats.totalGames,
      totalCardsSold: stats.totalCardsSold,
      totalRevenue: stats.totalRevenue,
      totalProfit: stats.totalProfit,
      averageRTP: averageRTP,
      winRate: stats.totalGames > 0 ? (stats.totalWins / stats.totalGames) * 100 : 0,
      dateRange: `${formatDateForDisplay(dateRange.startDate)} - ${formatDateForDisplay(dateRange.endDate)}`,
      daysCount,
      payinAmount,
      payoutAmount,
      profitAmount
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
    if (allGameReports.length > 0) {
      applyDateFilter();
    }
  }, [allGameReports, selectedPeriod, customStartDate, customEndDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderGameEntry = (entry: GameReportEntry) => (
    <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionDate, { color: theme.colors.textSecondary }]}>
          Game #{entry.gameNumber}
        </Text>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Duration:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {entry.gameDurationMinutes} min
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Cards Sold:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {entry.cardsSold}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Collected:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {formatCurrency(entry.collectedAmount)}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Profit:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {formatCurrency(entry.profitAmount)}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Pattern:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.textSecondary }]}>
            {entry.pattern}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Numbers Called:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.textSecondary }]}>
            {entry.totalNumbersCalled}/75
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            RTP:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.textSecondary }]}>
            {entry.rtpPercentage}%
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>Game Report</Text>
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

        {/* Dynamic Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.primaryStatCard, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.statRow}>
              <View style={styles.statIconContainer}>
                <Gamepad2 size={20} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.primaryStatValue}>{summaryStats.totalGames}</Text>
                <Text style={styles.primaryStatLabel}>Games Played</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.primaryStatCard, { backgroundColor: '#10B981' }]}>
            <View style={styles.statRow}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={20} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.primaryStatValue}>{formatCurrency(summaryStats.profitAmount)}</Text>
                <Text style={styles.primaryStatLabel}>Total Profit</Text>
              </View>
            </View>
          </View>
          
        </View>

        {/* Secondary Stats Row */}
        <View style={styles.secondaryStatsRow}>
          <View style={[styles.secondaryStatCard, { backgroundColor: theme.colors.surface }]}>
            <DollarSign size={16} color="#10B981" />
            <Text style={[styles.secondaryStatValue, { color: theme.colors.text }]}>{formatCurrency(summaryStats.payinAmount)}</Text>
          </View>
          
          <View style={[styles.secondaryStatCard, { backgroundColor: theme.colors.surface }]}>
            <Target size={16} color="#EF4444" />
            <Text style={[styles.secondaryStatValue, { color: theme.colors.text }]}>{formatCurrency(summaryStats.payoutAmount)}</Text>
          </View>
          
        </View>

        {/* Game Reports */}
        {filteredReports.length > 0 ? (
          <View style={styles.reportsContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Trophy size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Game Reports</Text>
              </View>
              <View style={styles.counterItem}>
                <Users size={16} color={theme.colors.primary} />
                <Text style={[styles.counterText, { color: theme.colors.text }]}>{filteredReports.reduce((sum, r) => sum + r.totalCardsSold, 0)}</Text>
              </View>
            </View>
            
            {filteredReports.map(report => (
              <View key={report.date} style={styles.dateSection}>
                <View style={[styles.dateBanner, { backgroundColor: theme.colors.primary + '15', borderLeftColor: theme.colors.primary }]}>
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>{formatDate(report.date)}</Text>
                  <View style={styles.dateSummary}>
                    <View style={styles.dateMetric}>
                      <Gamepad2 size={12} color={theme.colors.textSecondary} />
                      <Text style={[styles.dateMetricText, { color: theme.colors.textSecondary }]}>{report.totalGames}</Text>
                    </View>
                    <View style={styles.dateMetric}>
                      <DollarSign size={12} color="#10B981" />
                      <Text style={[styles.dateMetricText, { color: theme.colors.textSecondary }]}>{formatCurrency(report.totalProfit)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.gamesList}>
                  {report.games
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((game, index) => (
                    <View key={`${report.date}-${index}`} style={[styles.gameCard, { backgroundColor: theme.colors.surface }]}>
                      <View style={styles.gameHeader}>
                        <View style={[styles.gameNumberBadge, { backgroundColor: theme.colors.primary }]}>
                          <Text style={styles.gameNumberText}>#{game.gameNumber}</Text>
                        </View>
                        <View style={styles.gameDuration}>
                          <Clock size={10} color={theme.colors.textSecondary} />
                          <Text style={[styles.gameDurationText, { color: theme.colors.textSecondary }]}>{game.gameDurationMinutes}m</Text>
                        </View>
                      </View>
                      
                      <View style={styles.gameMetrics}>
                        <View style={styles.gameMetricRow}>
                          <View style={styles.gameMetric}>
                            <Users size={10} color={theme.colors.textSecondary} />
                            <Text style={[styles.gameMetricLabel, { color: theme.colors.textSecondary }]}>{game.cardsSold}</Text>
                          </View>
                          <Text style={[styles.gamePattern, { color: theme.colors.primary }]}>{game.pattern}</Text>
                        </View>
                        
                        <View style={styles.gameAmounts}>
                          <Text style={[styles.gameAmount, { color: '#10B981' }]}>{formatCurrency(game.collectedAmount)}</Text>
                          <Text style={[styles.gameProfit, { color: theme.colors.primary }]}>+{formatCurrency(game.profitAmount)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Gamepad2 size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Games Yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Start playing to see your game statistics
            </Text>
          </View>
        )}
      </ScrollView>

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
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: 24,
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
  sessionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sessionItem: {
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  performanceContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
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
  moreGamesText: {
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
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
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

  // Modern Dynamic UI Styles
  
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
    alignItems: 'center',
  },
  primaryStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    marginBottom: 4,
  },
  primaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  secondaryStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  secondaryStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  secondaryStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  reportsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  dateSection: {
    marginBottom: 20,
  },
  dateBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateSummary: {
    flexDirection: 'row',
    gap: 16,
  },
  dateMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateMetricText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  gamesList: {
    gap: 8,
  },
  gameCard: {
    width: '100%',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gameNumberText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  gameDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gameDurationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  gameMetrics: {
    gap: 6,
  },
  gameMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gameMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  gamePattern: {
    fontSize: 10,
    fontWeight: '600',
  },
  gameAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  gameProfit: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 11,
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

  // Modal Styles
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
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