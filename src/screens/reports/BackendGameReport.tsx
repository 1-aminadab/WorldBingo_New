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
} from 'react-native';
import { ArrowLeft, RefreshCw, TrendingUp, DollarSign, Hash, Target } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { useGameReportStore, getReportSummary, formatCurrency, formatPercentage } from '../../store/gameReportStore';
import { useAuthStore } from '../../store/authStore';

export const BackendGameReport: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { 
    currentReport, 
    isLoading, 
    error, 
    fetchCurrentUserReport,
    loadFromLocalStorage,
    clearError 
  } = useGameReportStore();

  const [refreshing, setRefreshing] = useState(false);

  // Load from local storage on initial mount for instant display
  React.useEffect(() => {
    console.log('📱 Loading report from local storage on mount...');
    loadFromLocalStorage();
  }, []);

  // Fetch/sync data when screen focuses (loads from local storage first, then syncs with backend)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        console.log('🔄 Screen focused, syncing report data...');
        fetchCurrentUserReport();
      }
    }, [fetchCurrentUserReport, user?.id])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCurrentUserReport();
    } catch (error) {
      console.error('Error refreshing report:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleErrorDismiss = () => {
    clearError();
  };

  const reportSummary = getReportSummary(currentReport);

  const StatCard = ({ icon: Icon, title, value, color, subtitle }: {
    icon: any;
    title: string;
    value: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
          {title}
        </Text>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>
          {value}
        </Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backend Game Report</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={handleErrorDismiss}>
              <Text style={[styles.errorDismiss, { color: theme.colors.error }]}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading report data...
            </Text>
          </View>
        )}

        {/* Report Content */}
        {currentReport && (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Game Statistics
              </Text>
              
              <View style={styles.statsGrid}>
                <StatCard
                  icon={Hash}
                  title="Total Games"
                  value={currentReport.numberOfGames.toString()}
                  color={theme.colors.primary}
                />
                
                <StatCard
                  icon={Target}
                  title="Total Cards"
                  value={currentReport.numberOfCards.toString()}
                  color={theme.colors.secondary}
                />
                
                <StatCard
                  icon={DollarSign}
                  title="Total Pay-in"
                  value={formatCurrency(currentReport.totalPayin)}
                  color={theme.colors.success}
                />
                
                <StatCard
                  icon={TrendingUp}
                  title="Total Payout"
                  value={formatCurrency(currentReport.totalPayout)}
                  color={theme.colors.warning}
                />
              </View>
            </View>

            {/* Analysis Section */}
            {reportSummary && (
              <View style={styles.analysisContainer}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Performance Analysis
                </Text>
                
                <View style={styles.analysisGrid}>
                  <StatCard
                    icon={TrendingUp}
                    title="Net Profit/Loss"
                    value={formatCurrency(reportSummary.profit)}
                    color={reportSummary.profit >= 0 ? theme.colors.success : theme.colors.error}
                    subtitle={reportSummary.profit >= 0 ? 'Profit' : 'Loss'}
                  />
                  
                  <StatCard
                    icon={Target}
                    title="Profit Margin"
                    value={formatPercentage(reportSummary.profitMargin)}
                    color={theme.colors.primary}
                  />
                  
                  <StatCard
                    icon={Hash}
                    title="Avg Pay-in/Game"
                    value={formatCurrency(reportSummary.averagePayinPerGame)}
                    color={theme.colors.secondary}
                  />
                  
                  <StatCard
                    icon={DollarSign}
                    title="Avg Payout/Game"
                    value={formatCurrency(reportSummary.averagePayoutPerGame)}
                    color={theme.colors.warning}
                  />
                </View>
              </View>
            )}

            {/* Raw Data Section */}
            <View style={styles.rawDataContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Raw Report Data
              </Text>
              
              <View style={[styles.rawDataCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.rawDataText, { color: theme.colors.textSecondary }]}>
                  {JSON.stringify(currentReport, null, 2)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* No Data State */}
        {!currentReport && !isLoading && !error && (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
              No game report data available.
            </Text>
            <Text style={[styles.noDataSubtext, { color: theme.colors.textSecondary }]}>
              Play some games to see your statistics here.
            </Text>
          </View>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  errorDismiss: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  analysisContainer: {
    marginBottom: 24,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rawDataContainer: {
    marginBottom: 24,
  },
  rawDataCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rawDataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});