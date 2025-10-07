// Report Export Utilities
// Based on the web implementation's Excel export functionality

import { ShopReport, ReportSummary, CompanyBalance } from '../services/reportService';
import RNFS from 'react-native-fs';
import { Alert, Share, Platform } from 'react-native';

export interface ExportData {
  shops: ShopReport[];
  summary: ReportSummary;
  balances: CompanyBalance;
  dateRange: string;
}

export class ReportExportService {
  private static instance: ReportExportService;

  private constructor() {}

  public static getInstance(): ReportExportService {
    if (!ReportExportService.instance) {
      ReportExportService.instance = new ReportExportService();
    }
    return ReportExportService.instance;
  }

  // Generate CSV content from shop reports (similar to web Excel export)
  private generateCSVContent(data: ExportData): string {
    const { shops, summary, balances, dateRange } = data;
    
    let csvContent = '';
    
    // Header with report info
    csvContent += `Bingo Comprehensive Report\n`;
    csvContent += `Date Range: ${dateRange}\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    // Company Balances Section
    csvContent += `Company Balances\n`;
    csvContent += `Company Balance,${balances.company.toFixed(2)} Birr\n`;
    csvContent += `Agent Balance,${balances.agent.toFixed(2)} Birr\n`;
    csvContent += `Shop Balance,${balances.shop.toFixed(2)} Birr\n\n`;
    
    // Summary Section
    csvContent += `Summary Overview\n`;
    csvContent += `Net Profit,${summary.netProfit.toFixed(2)} Birr\n`;
    csvContent += `Total Commission,${summary.totalCommission.toFixed(2)} Birr\n`;
    csvContent += `Total Pay-in,${summary.totalPayin.toFixed(2)} Birr\n`;
    csvContent += `Total Pay-out,${summary.totalPayout.toFixed(2)} Birr\n`;
    csvContent += `Total Games,${summary.totalGame}\n`;
    csvContent += `Total Tickets,${summary.totalTicket}\n`;
    csvContent += `Cancelled Games,${summary.cancelledGame}\n`;
    csvContent += `Total Refunds,${summary.totalRefund.toFixed(2)} Birr\n`;
    csvContent += `RTP Margin,${summary.rtpMargin.toFixed(2)}%\n`;
    csvContent += `Shop Profit,${summary.totalShopProfit.toFixed(2)} Birr\n`;
    csvContent += `Agent Profit,${summary.totalAgentProfit.toFixed(2)} Birr\n`;
    csvContent += `Total Bonus,${summary.totalBonus.toFixed(2)} Birr\n`;
    csvContent += `Bonus Games,${summary.totalBonusGame}\n\n`;
    
    // Shop Details Table (similar to web DataTable export)
    csvContent += `Shop Performance Details\n`;
    csvContent += `Shop Name,Total Pay-in,Total Pay-out,Games Completed,Total Tickets,Games Not Completed,Commission Amount,Bonus Amount,Company Profit,Agent Profit,Shop Profit,Total Refunds\n`;
    
    shops.forEach(shop => {
      csvContent += `${shop.name},`;
      csvContent += `${shop.totalPayin.toFixed(2)},`;
      csvContent += `${shop.totalPayout.toFixed(2)},`;
      csvContent += `${shop.gameCompleted},`;
      csvContent += `${shop.totalTicket},`;
      csvContent += `${shop.gameNotCompleted},`;
      csvContent += `${shop.commissionAmount.toFixed(2)},`;
      csvContent += `${shop.totalBonusAmount.toFixed(2)},`;
      csvContent += `${shop.companyProfit.toFixed(2)},`;
      csvContent += `${shop.agentProfit.toFixed(2)},`;
      csvContent += `${shop.shopProfit.toFixed(2)},`;
      csvContent += `${shop.totalAmountRefund.toFixed(2)}\n`;
    });
    
    return csvContent;
  }

  // Export to CSV file (similar to web Excel export)
  async exportToCSV(data: ExportData): Promise<void> {
    try {
      const csvContent = this.generateCSVContent(data);
      const fileName = `bingo_report_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      // Write CSV file
      await RNFS.writeFile(filePath, csvContent, 'utf8');
      
      // Share the file
      await Share.share({
        url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
        message: 'Bingo Comprehensive Report',
        title: 'Export Report'
      });
      
      Alert.alert(
        'Export Successful',
        `Report exported as ${fileName}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(
        'Export Failed',
        'Could not export the report. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  // Generate JSON export (alternative format)
  async exportToJSON(data: ExportData): Promise<void> {
    try {
      const jsonContent = JSON.stringify({
        ...data,
        exportDate: new Date().toISOString(),
        formatVersion: '1.0'
      }, null, 2);
      
      const fileName = `bingo_report_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, jsonContent, 'utf8');
      
      await Share.share({
        url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
        message: 'Bingo Report (JSON Format)',
        title: 'Export Report'
      });
      
      Alert.alert(
        'Export Successful',
        `Report exported as ${fileName}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('JSON export failed:', error);
      Alert.alert(
        'Export Failed',
        'Could not export the report. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  // Show export options (similar to web export button)
  showExportOptions(data: ExportData): void {
    Alert.alert(
      'Export Report',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'CSV (Excel Compatible)', 
          onPress: () => this.exportToCSV(data) 
        },
        { 
          text: 'JSON (Data Format)', 
          onPress: () => this.exportToJSON(data) 
        }
      ]
    );
  }

  // Format number with commas (from web version)
  formatNumberWithCommas(value: number): string {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

export default ReportExportService.getInstance();