// Report Service for Backend Integration

import { formatTime } from '../utils/gameHelpers';
import { useAuthStore } from '../store/authStore';

// Types for report data
export interface ShopReport {
  id: string;
  name: string;
  totalPayin: number;
  totalPayout: number;
  gameCompleted: number;
  totalTicket: number;
  gameNotCompleted: number;
  commissionAmount: number;
  totalBonusAmount: number;
  companyProfit: number;
  agentProfit: number;
  shopProfit: number;
  totalAmountRefund: number;
}

export interface CompanyBalance {
  company: number;
  agent: number;
  shop: number;
}

export interface ReportSummary {
  netProfit: number;
  totalCommission: number;
  totalShopProfit: number;
  totalAgentProfit: number;
  totalBonus: number;
  totalBonusGame: number;
  totalPayin: number;
  totalPayout: number;
  totalGame: number;
  totalTicket: number;
  cancelledGame: number;
  totalRefund: number;
  rtpMargin: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export class ReportService {
  private static instance: ReportService;
  private baseUrl: string = 'https://world-bingo-mobile-app-backend-230041233104.us-central1.run.app';

  private constructor() {
    // Constructor
  }

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  // Get current user ID from auth store
  private getUserId(): string | null {
    const userId = useAuthStore.getState().getUserId();
    return userId;
  }

  // Get current user info from auth store
  private getUser() {
    const user = useAuthStore.getState().user;
    return user;
  }

  // Format date for backend (DD-MM-YYYY)
  private formatDateForBackend(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Get date range array
  private getDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(this.formatDateForBackend(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  // Mock API call - replace with actual backend integration
  private async makeApiCall(endpoint: string, params?: any): Promise<any> {
    const userId = this.getUserId();
    const user = this.getUser();
    
    console.log('📊 Report API Request ====================================');
    console.log('Endpoint:', endpoint);
    console.log('Parameters:', JSON.stringify(params, null, 2));
    console.log('User ID:', userId);
    console.log('User Name:', user?.name);
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================================');
    
    try {
      // For now, return mock data based on the web implementation structure
      const data = this.getMockData(endpoint, params);
      
      console.log('📊 Report API Response ===================================');
      console.log('Endpoint:', endpoint);
      console.log('Success: true');
      console.log('Data Keys:', Object.keys(data));
      if (data.summary) {
        console.log('Summary Stats:', {
          totalGames: data.summary.totalGame,
          totalPayin: data.summary.totalPayin,
          totalPayout: data.summary.totalPayout,
          netProfit: data.summary.netProfit
        });
      }
      if (data.shops) {
        console.log('Shops Count:', data.shops.length);
      }
      console.log('Timestamp:', new Date().toISOString());
      console.log('========================================================');
      
      return data;
    } catch (error) {
      console.error('❌ Report API Error ====================================');
      console.error('Endpoint:', endpoint);
      console.error('Error:', error);
      console.error('Timestamp:', new Date().toISOString());
      console.error('========================================================');
      throw error;
    }
  }

  // Generate mock data similar to the web version
  private getMockData(endpoint: string, params?: any): any {
    const today = new Date();
    const mockShops = [
      { id: 'shop_001', name: 'Downtown Bingo Hall' },
      { id: 'shop_002', name: 'Central Gaming Center' },
      { id: 'shop_003', name: 'North Side Bingo' },
      { id: 'shop_004', name: 'East End Games' },
      { id: 'shop_005', name: 'West Plaza Bingo' }
    ];

    if (endpoint.includes('balances')) {
      return {
        company: 150000.50,
        agent: 45000.25,
        shop: 78000.75
      };
    }

    if (endpoint.includes('report')) {
      const mockShopReports: ShopReport[] = mockShops.map((shop, index) => ({
        id: shop.id,
        name: shop.name,
        totalPayin: 25000 + (index * 5000) + Math.random() * 10000,
        totalPayout: 20000 + (index * 4000) + Math.random() * 8000,
        gameCompleted: 45 + Math.floor(Math.random() * 20),
        totalTicket: 150 + Math.floor(Math.random() * 50),
        gameNotCompleted: 2 + Math.floor(Math.random() * 5),
        commissionAmount: 1500 + (index * 300) + Math.random() * 500,
        totalBonusAmount: 500 + Math.random() * 300,
        companyProfit: 800 + (index * 150) + Math.random() * 200,
        agentProfit: 300 + (index * 60) + Math.random() * 100,
        shopProfit: 400 + (index * 80) + Math.random() * 120,
        totalAmountRefund: 200 + Math.random() * 100
      }));

      const summary: ReportSummary = {
        netProfit: mockShopReports.reduce((sum, shop) => sum + shop.companyProfit, 0),
        totalCommission: mockShopReports.reduce((sum, shop) => sum + shop.commissionAmount, 0),
        totalShopProfit: mockShopReports.reduce((sum, shop) => sum + shop.shopProfit, 0),
        totalAgentProfit: mockShopReports.reduce((sum, shop) => sum + shop.agentProfit, 0),
        totalBonus: mockShopReports.reduce((sum, shop) => sum + shop.totalBonusAmount, 0),
        totalBonusGame: 15 + Math.floor(Math.random() * 10),
        totalPayin: mockShopReports.reduce((sum, shop) => sum + shop.totalPayin, 0),
        totalPayout: mockShopReports.reduce((sum, shop) => sum + shop.totalPayout, 0),
        totalGame: mockShopReports.reduce((sum, shop) => sum + shop.gameCompleted, 0),
        totalTicket: mockShopReports.reduce((sum, shop) => sum + shop.totalTicket, 0),
        cancelledGame: mockShopReports.reduce((sum, shop) => sum + shop.gameNotCompleted, 0),
        totalRefund: mockShopReports.reduce((sum, shop) => sum + shop.totalAmountRefund, 0),
        rtpMargin: 85.5 + Math.random() * 10
      };

      return {
        shops: mockShopReports,
        summary: summary
      };
    }

    return {};
  }

  // Get company balances
  async getCompanyBalances(): Promise<CompanyBalance> {
    const userId = this.getUserId();
    
    console.log('💰 Fetching Company Balances...');
    console.log('User ID:', userId);
    
    try {
      const data = await this.makeApiCall('balances');
      
      console.log('💰 Company Balances Retrieved:');
      console.log('Company:', data.company);
      console.log('Agent:', data.agent);
      console.log('Shop:', data.shop);
      console.log('Total:', data.company + data.agent + data.shop);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching company balances:', error);
      throw error;
    }
  }

  // Get report data for date range
  async getReportData(dateRange: DateRange): Promise<{ shops: ShopReport[], summary: ReportSummary }> {
    const userId = this.getUserId();
    
    console.log('📈 Fetching Report Data...');
    console.log('User ID:', userId);
    console.log('Date Range:', {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      const dates = this.getDateRange(startDate, endDate);
      
      console.log('Date range covers', dates.length, 'days:', dates);
      
      // Simulate loading multiple dates like the web version
      const data = await this.makeApiCall('report', { dates });
      
      console.log('📈 Report Data Retrieved:');
      console.log('Total Shops:', data.shops.length);
      console.log('Summary:', {
        totalGames: data.summary.totalGame,
        totalTickets: data.summary.totalTicket,
        totalPayin: data.summary.totalPayin,
        totalPayout: data.summary.totalPayout,
        netProfit: data.summary.netProfit,
        rtpMargin: data.summary.rtpMargin
      });
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching report data:', error);
      throw error;
    }
  }

  // Get predefined date ranges (like web version)
  getDateRanges() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 6);
    
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 29);
    
    const last90Days = new Date(today);
    last90Days.setDate(last90Days.getDate() - 89);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    return {
      'Today': { startDate: today.toISOString(), endDate: today.toISOString() },
      'Yesterday': { startDate: yesterday.toISOString(), endDate: yesterday.toISOString() },
      'Last 7 Days': { startDate: last7Days.toISOString(), endDate: today.toISOString() },
      'Last 30 Days': { startDate: last30Days.toISOString(), endDate: today.toISOString() },
      'Last 90 Days': { startDate: last90Days.toISOString(), endDate: today.toISOString() },
      'This Month': { startDate: thisMonthStart.toISOString(), endDate: thisMonthEnd.toISOString() },
      'Last Month': { startDate: lastMonthStart.toISOString(), endDate: lastMonthEnd.toISOString() }
    };
  }

  // Format number with commas (like web version)
  formatNumberWithCommas(value: number): string {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Format currency
  formatCurrency(value: number): string {
    return `${this.formatNumberWithCommas(value)} Birr`;
  }
}

export default ReportService.getInstance();