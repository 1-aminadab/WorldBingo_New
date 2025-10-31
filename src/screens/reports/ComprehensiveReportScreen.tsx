import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import ReportService, { ShopReport, ReportSummary, CompanyBalance, DateRange } from '../../services/reportService';
import ReportExportService, { ExportData } from '../../utils/reportExport';
import { useReportStore, formatCurrency, getDateRangeText } from '../../store/reportStore';
import { Calendar, Download, Filter, TrendingUp, TrendingDown, DollarSign, Users, FileText } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ComprehensiveReportScreen: React.FC = () => {
  const { theme } = useTheme();
  
  // Store state management (similar to web global variables)
  const {
    shopReports,
    reportSummary,
    companyBalances,
    selectedDateRange,
    isLoading,
    setShopReports,
    setReportSummary,
    setCompanyBalances,
    setSelectedDateRange,
    setLoading,
    updateLastUpdated,
    cacheReportData,
    getCachedReport
  } = useReportStore();
  
  // Local state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Date ranges from service
  const dateRanges = ReportService.getDateRanges();

  // Load initial data
  useEffect(() => {
    loadReportData();
    loadCompanyBalances();
  }, []);

  const loadReportData = async (dateRangeKey: string = selectedDateRange) => {
    try {
      setLoading(true);
      
      // Check cache first (similar to web caching strategy)
      const cachedData = getCachedReport(dateRangeKey);
      if (cachedData) {
        setShopReports(cachedData.shops);
        setReportSummary(cachedData.summary);
        setLoading(false);
        return;
      }
      
      // Fetch fresh data if not cached
      const dateRange = dateRanges[dateRangeKey as keyof typeof dateRanges];
      const data = await ReportService.getReportData(dateRange);
      
      // Update store with fresh data
      setShopReports(data.shops);
      setReportSummary(data.summary);
      
      // Cache the data for future use
      cacheReportData(dateRangeKey, data.shops, data.summary);
      updateLastUpdated();
      
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyBalances = async () => {
    try {
      const balances = await ReportService.getCompanyBalances();
      setCompanyBalances(balances);
    } catch (error) {
      console.error('Error loading company balances:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadReportData(), loadCompanyBalances()]);
    setRefreshing(false);
  }, [selectedDateRange]);

  const handleDateRangeChange = async (dateRangeKey: string) => {
    setSelectedDateRange(dateRangeKey);
    setShowDatePicker(false);
    await loadReportData(dateRangeKey);
  };

  const handleExport = () => {
    if (!reportSummary || !companyBalances || shopReports.length === 0) {
      Alert.alert('No Data', 'Please load report data before exporting.');
      return;
    }

    const exportData: ExportData = {
      shops: shopReports,
      summary: reportSummary,
      balances: companyBalances,
      dateRange: selectedDateRange
    };

    ReportExportService.showExportOptions(exportData);
  };

  // Render summary cards
  const renderSummaryCards = () => {
    if (!reportSummary) return null;

    const summaryItems = [
      {
        title: 'Net Profit',
        value: ReportService.formatCurrency(reportSummary.netProfit),
        icon: <TrendingUp size={24} color={theme.colors.primary} />,
        trend: 'up'
      },
      {
        title: 'Total Commission',
        value: ReportService.formatCurrency(reportSummary.totalCommission),
        icon: <DollarSign size={24} color={theme.colors.primary} />,
        trend: 'up'
      },
      {
        title: 'Total Games',
        value: reportSummary.totalGame.toString(),
        icon: <FileText size={24} color={theme.colors.primary} />,
        trend: 'neutral'
      },
      {
        title: 'RTP Margin',
        value: `${reportSummary.rtpMargin.toFixed(2)}%`,
        icon: <TrendingDown size={24} color={theme.colors.textSecondary} />,
        trend: 'down'
      }
    ];

    return (
      <View style={styles.summaryContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Summary Overview</Text>
        <View style={styles.summaryGrid}>
          {summaryItems.map((item, index) => (
            <View key={index} style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.summaryCardHeader}>
                {item.icon}
                <Text style={[styles.summaryCardTitle, { color: theme.colors.textSecondary }]}>
                  {item.title}
                </Text>
              </View>
              <Text style={[styles.summaryCardValue, { color: theme.colors.text }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render balance cards
  const renderBalanceCards = () => {
    if (!companyBalances) return null;

    return (
      <View style={styles.balanceContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Current Balances</Text>
        <View style={styles.balanceGrid}>
          <View style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.balanceCardTitle, { color: theme.colors.textSecondary }]}>Company</Text>
            <Text style={[styles.balanceCardValue, { color: theme.colors.primary }]}>
              {ReportService.formatCurrency(companyBalances.company)}
            </Text>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.balanceCardTitle, { color: theme.colors.textSecondary }]}>Agents</Text>
            <Text style={[styles.balanceCardValue, { color: theme.colors.text }]}>
              {ReportService.formatCurrency(companyBalances.agent)}
            </Text>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.balanceCardTitle, { color: theme.colors.textSecondary }]}>Shops</Text>
            <Text style={[styles.balanceCardValue, { color: theme.colors.text }]}>
              {ReportService.formatCurrency(companyBalances.shop)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render detailed metrics
  const renderDetailedMetrics = () => {
    if (!reportSummary) return null;

    const metrics = [
      { label: 'Total Pay-in', value: ReportService.formatCurrency(reportSummary.totalPayin) },
      { label: 'Total Pay-out', value: ReportService.formatCurrency(reportSummary.totalPayout) },
      { label: 'Total Tickets', value: reportSummary.totalTicket.toString() },
      { label: 'Cancelled Games', value: reportSummary.cancelledGame.toString() },
      { label: 'Total Refunds', value: ReportService.formatCurrency(reportSummary.totalRefund) },
      { label: 'Shop Profit', value: ReportService.formatCurrency(reportSummary.totalShopProfit) },
      { label: 'Agent Profit', value: ReportService.formatCurrency(reportSummary.totalAgentProfit) },
      { label: 'Total Bonus', value: ReportService.formatCurrency(reportSummary.totalBonus) },
    ];

    return (
      <View style={styles.metricsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Detailed Metrics</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={[styles.metricItem, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                {metric.label}
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render shop reports table
  const renderShopReports = () => {
    if (shopReports.length === 0) return null;

    return (
      <View style={styles.shopReportsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Shop Performance</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.tableHeaderText, styles.shopNameColumn]}>Shop</Text>
              <Text style={styles.tableHeaderText}>Pay-in</Text>
              <Text style={styles.tableHeaderText}>Pay-out</Text>
              <Text style={styles.tableHeaderText}>Games</Text>
              <Text style={styles.tableHeaderText}>Tickets</Text>
              <Text style={styles.tableHeaderText}>Profit</Text>
            </View>
            
            {/* Table Rows */}
            {shopReports.map((shop, index) => (
              <View 
                key={shop.id} 
                style={[
                  styles.tableRow, 
                  { backgroundColor: index % 2 === 0 ? theme.colors.surface : theme.colors.background }
                ]}
              >
                <Text style={[styles.tableCellText, styles.shopNameColumn, { color: theme.colors.text }]}>
                  {shop.name}
                </Text>
                <Text style={[styles.tableCellText, { color: theme.colors.text }]}>
                  {ReportService.formatNumberWithCommas(shop.totalPayin)}
                </Text>
                <Text style={[styles.tableCellText, { color: theme.colors.text }]}>
                  {ReportService.formatNumberWithCommas(shop.totalPayout)}
                </Text>
                <Text style={[styles.tableCellText, { color: theme.colors.text }]}>
                  {shop.gameCompleted}
                </Text>
                <Text style={[styles.tableCellText, { color: theme.colors.text }]}>
                  {shop.totalTicket}
                </Text>
                <Text style={[styles.tableCellText, { color: theme.colors.primary }]}>
                  {ReportService.formatNumberWithCommas(shop.shopProfit)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Date picker modal
  const renderDatePickerModal = () => (
    <Modal
      visible={showDatePicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Date Range</Text>
          
          {Object.keys(dateRanges).map((rangeKey) => (
            <TouchableOpacity
              key={rangeKey}
              style={[
                styles.dateRangeOption,
                { 
                  backgroundColor: selectedDateRange === rangeKey 
                    ? theme.colors.primary + '20' 
                    : 'transparent',
                  borderColor: theme.colors.border
                }
              ]}
              onPress={() => handleDateRangeChange(rangeKey)}
            >
              <Text style={[
                styles.dateRangeText,
                { 
                  color: selectedDateRange === rangeKey 
                    ? theme.colors.primary 
                    : theme.colors.text 
                }
              ]}>
                {rangeKey}
              </Text>
            </TouchableOpacity>
          ))}
          
          <Button
            title="Cancel"
            onPress={() => setShowDatePicker(false)}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Comprehensive Report
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#fff" />
            <Text style={styles.headerButtonText}>{selectedDateRange}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.textSecondary }]}
            onPress={handleExport}
          >
            <Download size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <LoadingSpinner 
            size="large" 
            text="Generating Report, Please Wait..."
          />
        ) : (
          <>
            {renderBalanceCards()}
            {renderSummaryCards()}
            {renderDetailedMetrics()}
            {renderShopReports()}
            {/* Footer with last updated info */}
            {reportSummary && (
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  Data range: {getDateRangeText(selectedDateRange)}
                </Text>
                {useReportStore.getState().lastUpdated && (
                  <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                    Last updated: {new Date(useReportStore.getState().lastUpdated!).toLocaleString()}
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {renderDatePickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  
  // Balance Cards
  balanceContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  balanceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  balanceCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Summary Cards
  summaryContainer: {
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Metrics
  metricsContainer: {
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    width: (width - 48) / 2,
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Shop Reports Table
  shopReportsContainer: {
    marginBottom: 20,
  },
  tableContainer: {
    minWidth: width - 32,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  shopNameColumn: {
    flex: 2,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tableCellText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 64,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateRangeOption: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateRangeText: {
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 16,
  },

  // Footer
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
});

export default ComprehensiveReportScreen;