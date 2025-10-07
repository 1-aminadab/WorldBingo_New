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
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../components/ui/ThemeProvider';

import { ReportStorageManager } from '../../utils/reportStorage';
import { GameReport as GameReportType, GameReportEntry } from '../../types';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { FilterPeriod, getDateRange, isDateInRange, formatDateForDisplay, getDaysCount } from '../../utils/dateUtils';

export const GameReport: React.FC = () => {
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
      const gameData = await ReportStorageManager.getGameReports();
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

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} Birr`;
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
        {/* Compact Date Filter */}
        <View style={[styles.compactDateFilter, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Period:</Text>
          <TouchableOpacity
            style={[styles.compactDateButton, { borderColor: theme.colors.border }]}
            onPress={() => setShowDateFilterModal(true)}
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
            <Text style={{ color: theme.colors.primary, fontSize: 12 }}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Compact Key Statistics */}
        <View style={[styles.compactStatsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.compactStatsTitle, { color: theme.colors.text }]}>Statistics</Text>
          
          <View style={styles.compactStatsGrid}>
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatValue, { color: theme.colors.primary }]}>
                {summaryStats.totalGames}
              </Text>
              <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
                Games
              </Text>
            </View>
            
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatValue, { color: theme.colors.primary }]}>
                {summaryStats.totalCardsSold}
              </Text>
              <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
                Cards
              </Text>
            </View>
            
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatValue, { color: '#10B981' }]}>
                {formatCurrency(summaryStats.payinAmount)}
              </Text>
              <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
                Pay-in
              </Text>
            </View>
            
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatValue, { color: '#EF4444' }]}>
                {formatCurrency(summaryStats.payoutAmount)}
              </Text>
              <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
                Pay-out
              </Text>
            </View>
            
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatValue, { color: theme.colors.primary }]}>
                {formatCurrency(summaryStats.profitAmount)}
              </Text>
              <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
                Profit
              </Text>
            </View>
            
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatValue, { color: theme.colors.primary }]}>
                {summaryStats.averageRTP.toFixed(1)}%
              </Text>
              <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
                RTP
              </Text>
            </View>
          </View>
        </View>

        {/* Compact Game Reports */}
        {filteredReports.length > 0 ? (
          <View style={styles.reportsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Game Reports ({filteredReports.reduce((sum, r) => sum + r.totalGames, 0)} games)
            </Text>
            
            {filteredReports.map(report => (
              <View key={report.date} style={[styles.compactDailyCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.compactDayHeader}>
                  <Text style={[styles.compactDayDate, { color: theme.colors.text }]}>
                    {formatDate(report.date)}
                  </Text>
                  <Text style={[styles.compactDaySummary, { color: theme.colors.textSecondary }]}>
                    {report.totalGames} games • {formatCurrency(report.totalProfit)}
                  </Text>
                </View>
                
                <View style={styles.compactGamesList}>
                  {report.games
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((game, index) => (
                    <View key={`${report.date}-${index}`} style={styles.compactGameItem}>
                      <View style={styles.compactGameHeader}>
                        <Text style={[styles.compactGameNumber, { color: theme.colors.text }]}>
                          Game #{game.gameNumber}
                        </Text>
                        <Text style={[styles.compactGameDuration, { color: theme.colors.textSecondary }]}>
                          {game.gameDurationMinutes}m
                        </Text>
                      </View>
                      
                      <View style={styles.compactGameStats}>
                        <View style={styles.compactGameStatRow}>
                          <Text style={[styles.compactGameStatLabel, { color: theme.colors.textSecondary }]}>
                            Cards: {game.cardsSold} • Pattern: {game.pattern}
                          </Text>
                        </View>
                        <View style={styles.compactGameStatRow}>
                          <Text style={[styles.compactGameStatValue, { color: '#10B981' }]}>
                            {formatCurrency(game.collectedAmount)}
                          </Text>
                          <Text style={[styles.compactGameStatValue, { color: theme.colors.primary }]}>
                            Profit: {formatCurrency(game.profitAmount)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyStateCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.emptyIcon}>🎮</Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No game reports yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Play some games to see detailed reports here
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

  // Compact UI Styles
  compactDateFilter: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
  },
  compactDateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
  },
  compactDateText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  compactStatsCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  compactStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactStatItem: {
    width: '31%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  compactStatValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },

  reportsContainer: {
    marginBottom: 24,
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
  compactGamesList: {
    gap: 6,
  },
  compactGameItem: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    padding: 8,
  },
  compactGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactGameNumber: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactGameDuration: {
    fontSize: 11,
  },
  compactGameStats: {
    gap: 2,
  },
  compactGameStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactGameStatLabel: {
    fontSize: 11,
    flex: 1,
  },
  compactGameStatValue: {
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