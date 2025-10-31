import { apiClient } from '../client/base';
import { ApiResponse } from '../types';

// Report types based on your API specification
export interface GameReport {
  id: number;
  numberOfGames: number;
  numberOfCards: number;
  totalPayin: number;
  totalPayout: number;
}

// Individual report item from the API
export interface ReportItem {
  reportId: string;
  numberOfGames: number;
  numberOfCards: number;
  totalPayin: number;
  totalPayout: number;
  balance: number;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

// Response structure for user reports endpoint
export interface UserReportsResponse {
  success: boolean;
  userId: string;
  reports: ReportItem[];
}

export interface CreateReportRequest extends Omit<GameReport, 'id'> {
  id: number; // User ID
}

export interface UpdateReportRequest {
  id: number; // User ID
  numberOfGames: number;
  numberOfCards: number;
  totalPayin: number;
  totalPayout: number;
}

export interface IncrementReportRequest {
  id: number; // User ID
  numberOfGames: number;
  numberOfCards: number;
  totalPayin: number;
  totalPayout: number;
}

export interface ReportResponse {
  success: boolean;
  data?: GameReport;
  message?: string;
}

export interface GetReportsResponse {
  success: boolean;
  data?: GameReport[];
  message?: string;
}

class ReportApiService {
  private static instance: ReportApiService;

  public static getInstance(): ReportApiService {
    if (!ReportApiService.instance) {
      ReportApiService.instance = new ReportApiService();
    }
    return ReportApiService.instance;
  }

  /**
   * Create a new report
   * POST /api/v1/report
   */
  public async createReport(data: CreateReportRequest): Promise<ApiResponse<GameReport>> {
    const requestId = `create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log('🔄 DATABASE REPORT CREATE REQUEST ===============================');
    console.log('Request ID:', requestId);
    console.log('Timestamp:', timestamp);
    console.log('User ID:', data.id);
    console.log('Endpoint: POST /api/v1/report');
    console.log('Request Payload:', JSON.stringify({
      id: data.id,
      numberOfGames: data.numberOfGames,
      numberOfCards: data.numberOfCards,
      totalPayin: data.totalPayin,
      totalPayout: data.totalPayout,
    }, null, 2));
    console.log('============================================================');
    
    try {
      const response = await apiClient.post<GameReport>('/api/v1/report', {
        id: data.id,
        numberOfGames: data.numberOfGames,
        numberOfCards: data.numberOfCards,
        totalPayin: data.totalPayin,
        totalPayout: data.totalPayout,
      });

      console.log('✅ DATABASE REPORT CREATE RESPONSE ============================');
      console.log('Request ID:', requestId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Status: SUCCESS');
      console.log('User ID:', data.id);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('Response Success:', response.success);
      console.log('Response Message:', response.message || 'N/A');
      if (response.data) {
        console.log('Created Report ID:', response.data.id);
        console.log('Total Games:', response.data.numberOfGames);
        console.log('Total Cards:', response.data.numberOfCards);
        console.log('Total Payin:', response.data.totalPayin);
        console.log('Total Payout:', response.data.totalPayout);
        console.log('Profit/Loss:', response.data.totalPayout - response.data.totalPayin);
      }
      console.log('============================================================');
      
      return response;
    } catch (error: any) {
      console.error('❌ DATABASE REPORT CREATE ERROR =============================');
      console.error('Request ID:', requestId);
      console.error('Timestamp:', new Date().toISOString());
      console.error('Status: ERROR');
      console.error('User ID:', data.id);
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Status:', error.status || 'N/A');
      console.error('Error Code:', error.code || 'N/A');
      console.error('Full Error:', error);
      console.error('============================================================');
      throw error;
    }
  }

  /**
   * Get all reports
   * GET /api/v1/report
   */
  public async getReports(): Promise<ApiResponse<GameReport[]>> {
    const requestId = `getAll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log('📋 DATABASE REPORTS GET ALL REQUEST ===========================');
    console.log('Request ID:', requestId);
    console.log('Timestamp:', timestamp);
    console.log('Endpoint: GET /api/v1/report');
    console.log('============================================================');
    
    try {
      const response = await apiClient.get<GameReport[]>('/api/v1/report');

      console.log('✅ DATABASE REPORTS GET ALL RESPONSE =========================');
      console.log('Request ID:', requestId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Status: SUCCESS');
      console.log('Response Success:', response.success);
      console.log('Response Message:', response.message || 'N/A');
      console.log('Total Reports Found:', response.data?.length || 0);
      if (response.data && response.data.length > 0) {
        console.log('Reports Summary:');
        response.data.forEach((report, index) => {
          console.log(`  [${index + 1}] User ID: ${report.id}, Games: ${report.numberOfGames}, Payin: ${report.totalPayin}, Payout: ${report.totalPayout}`);
        });
        const totalPayin = response.data.reduce((sum, r) => sum + r.totalPayin, 0);
        const totalPayout = response.data.reduce((sum, r) => sum + r.totalPayout, 0);
        const totalGames = response.data.reduce((sum, r) => sum + r.numberOfGames, 0);
        console.log('Aggregated Totals:');
        console.log('  Total Games:', totalGames);
        console.log('  Total Payin:', totalPayin);
        console.log('  Total Payout:', totalPayout);
        console.log('  Overall Profit/Loss:', totalPayout - totalPayin);
      }
      console.log('============================================================');
      
      return response;
    } catch (error: any) {
      console.error('❌ DATABASE REPORTS GET ALL ERROR =========================');
      console.error('Request ID:', requestId);
      console.error('Timestamp:', new Date().toISOString());
      console.error('Status: ERROR');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Status:', error.status || 'N/A');
      console.error('Error Code:', error.code || 'N/A');
      console.error('Full Error:', error);
      console.error('============================================================');
      throw error;
    }
  }

  /**
   * Get report by user ID
   * GET /api/v1/report/:userId
   */
  public async getReportByUserId(userId: number): Promise<ApiResponse<GameReport>> {
    const requestId = `get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log('🔍 DATABASE REPORT GET BY ID REQUEST =========================');
    console.log('Request ID:', requestId);
    console.log('Timestamp:', timestamp);
    console.log('User ID:', userId);
    console.log('Endpoint: GET /api/v1/report/' + userId);
    console.log('============================================================');
    
    try {
      const response = await apiClient.get<UserReportsResponse>(`/api/v1/report/${userId}`);

      console.log('✅ DATABASE REPORT GET BY ID RESPONSE ======================');
      console.log('Request ID:', requestId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Status: SUCCESS');
      console.log('User ID:', userId);
      console.log('Full Response:', JSON.stringify(response, null, 2));
      console.log('Response Success:', response.success);
      console.log('Response Message:', response.message || 'N/A');
      
      // The response IS the data (not nested under .data)
      const responseData = response as any as UserReportsResponse;
      console.log('Response Data:', JSON.stringify(responseData, null, 2));
      console.log('Reports Array:', JSON.stringify(responseData.reports, null, 2));
      
      if (responseData && responseData.reports && responseData.reports.length > 0) {
        // Convert the reports array to a single aggregated report
        const reports = responseData.reports;
        const aggregatedReport: GameReport = {
          id: userId,
          numberOfGames: reports.reduce((sum, r) => sum + r.numberOfGames, 0),
          numberOfCards: reports.reduce((sum, r) => sum + r.numberOfCards, 0),
          totalPayin: reports.reduce((sum, r) => sum + r.totalPayin, 0),
          totalPayout: reports.reduce((sum, r) => sum + r.totalPayout, 0),
        };
        
        console.log('Aggregated Report:', JSON.stringify(aggregatedReport, null, 2));
        console.log('Total Games:', aggregatedReport.numberOfGames);
        console.log('Total Cards:', aggregatedReport.numberOfCards);
        console.log('Total Payin:', aggregatedReport.totalPayin);
        console.log('Total Payout:', aggregatedReport.totalPayout);
        console.log('Profit/Loss:', aggregatedReport.totalPayout - aggregatedReport.totalPayin);
        console.log('RTP:', aggregatedReport.totalPayin > 0 ? ((aggregatedReport.totalPayout / aggregatedReport.totalPayin) * 100).toFixed(2) + '%' : 'N/A');
        console.log('============================================================');
        
        return {
          success: true,
          data: aggregatedReport,
          message: 'Report retrieved successfully'
        };
      } else {
        console.log('No reports found for user or empty reports array');
        console.log('Response has reports?', !!responseData.reports);
        console.log('Reports length:', responseData.reports?.length || 0);
        console.log('============================================================');
        return {
          success: true,
          data: {
            id: userId,
            numberOfGames: 0,
            numberOfCards: 0,
            totalPayin: 0,
            totalPayout: 0,
          },
          message: 'No reports found for user'
        };
      }
    } catch (error: any) {
      console.error('❌ DATABASE REPORT GET BY ID ERROR ========================');
      console.error('Request ID:', requestId);
      console.error('Timestamp:', new Date().toISOString());
      console.error('Status: ERROR');
      console.error('User ID:', userId);
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Status:', error.status || 'N/A');
      console.error('Error Code:', error.code || 'N/A');
      console.error('Full Error:', error);
      console.error('============================================================');
      throw error;
    }
  }

  /**
   * Update an existing report
   * PUT /api/v1/report
   */
  public async updateReport(data: UpdateReportRequest): Promise<ApiResponse<GameReport>> {
    const requestId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log('📝 DATABASE REPORT UPDATE REQUEST =============================');
    console.log('Request ID:', requestId);
    console.log('Timestamp:', timestamp);
    console.log('User ID:', data.id);
    console.log('Endpoint: PUT /api/v1/report');
    console.log('Request Payload:', JSON.stringify({
      id: data.id,
      numberOfGames: data.numberOfGames,
      numberOfCards: data.numberOfCards,
      totalPayin: data.totalPayin,
      totalPayout: data.totalPayout,
    }, null, 2));
    console.log('============================================================');
    
    try {
      const response = await apiClient.put<GameReport>('/api/v1/report', {
        id: data.id,
        numberOfGames: data.numberOfGames,
        numberOfCards: data.numberOfCards,
        totalPayin: data.totalPayin,
        totalPayout: data.totalPayout,
      });

      console.log('✅ DATABASE REPORT UPDATE RESPONSE ===========================');
      console.log('Request ID:', requestId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Status: SUCCESS');
      console.log('User ID:', data.id);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('Response Success:', response.success);
      console.log('Response Message:', response.message || 'N/A');
      if (response.data) {
        console.log('Updated Report ID:', response.data.id);
        console.log('Total Games:', response.data.numberOfGames);
        console.log('Total Cards:', response.data.numberOfCards);
        console.log('Total Payin:', response.data.totalPayin);
        console.log('Total Payout:', response.data.totalPayout);
        console.log('Profit/Loss:', response.data.totalPayout - response.data.totalPayin);
      }
      console.log('============================================================');
      
      return response;
    } catch (error: any) {
      console.error('❌ DATABASE REPORT UPDATE ERROR ===========================');
      console.error('Request ID:', requestId);
      console.error('Timestamp:', new Date().toISOString());
      console.error('Status: ERROR');
      console.error('User ID:', data.id);
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Status:', error.status || 'N/A');
      console.error('Error Code:', error.code || 'N/A');
      console.error('Full Error:', error);
      console.error('============================================================');
      throw error;
    }
  }

  /**
   * Increment report values
   * PATCH /api/v1/report/increment
   */
  public async incrementReport(data: IncrementReportRequest): Promise<ApiResponse<GameReport>> {
    const requestId = `increment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log('➕ DATABASE REPORT INCREMENT REQUEST ==========================');
    console.log('Request ID:', requestId);
    console.log('Timestamp:', timestamp);
    console.log('User ID:', data.id);
    console.log('Endpoint: PATCH /api/v1/report/increment');
    console.log('Request Payload:', JSON.stringify({
      id: data.id,
      numberOfGames: data.numberOfGames,
      numberOfCards: data.numberOfCards,
      totalPayin: data.totalPayin,
      totalPayout: data.totalPayout,
    }, null, 2));
    console.log('============================================================');
    
    try {
      const response = await apiClient.patch<GameReport>('/api/v1/report/increment', {
        id: data.id,
        numberOfGames: data.numberOfGames,
        numberOfCards: data.numberOfCards,
        totalPayin: data.totalPayin,
        totalPayout: data.totalPayout,
      });

      console.log('✅ DATABASE REPORT INCREMENT RESPONSE ========================');
      console.log('Request ID:', requestId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Status: SUCCESS');
      console.log('User ID:', data.id);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('Response Success:', response.success);
      console.log('Response Message:', response.message || 'N/A');
      if (response.data) {
        console.log('Updated Report ID:', response.data.id);
        console.log('Total Games:', response.data.numberOfGames);
        console.log('Total Cards:', response.data.numberOfCards);
        console.log('Total Payin:', response.data.totalPayin);
        console.log('Total Payout:', response.data.totalPayout);
        console.log('Profit/Loss:', response.data.totalPayout - response.data.totalPayin);
        console.log('Increment Applied - Games:', data.numberOfGames);
        console.log('Increment Applied - Cards:', data.numberOfCards);
        console.log('Increment Applied - Payin:', data.totalPayin);
        console.log('Increment Applied - Payout:', data.totalPayout);
      }
      console.log('============================================================');
      
      return response;
    } catch (error: any) {
      console.error('❌ DATABASE REPORT INCREMENT ERROR ========================');
      console.error('Request ID:', requestId);
      console.error('Timestamp:', new Date().toISOString());
      console.error('Status: ERROR');
      console.error('User ID:', data.id);
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Status:', error.status || 'N/A');
      console.error('Error Code:', error.code || 'N/A');
      console.error('Full Error:', error);
      console.error('============================================================');
      throw error;
    }
  }

  /**
   * Helper method to get current user's report
   */
  public async getCurrentUserReport(userId: number): Promise<GameReport | null> {
    try {
      const response = await this.getReportByUserId(userId);
      return response.data || null;
    } catch (error) {
      console.warn('No existing report found for user, will create new one');
      return null;
    }
  }

  /**
   * Helper method to create or update user report
   */
  public async createOrUpdateUserReport(
    userId: number,
    gameData: {
      numberOfGames: number;
      numberOfCards: number;
      totalPayin: number;
      totalPayout: number;
    }
  ): Promise<GameReport> {
    try {
      // First try to get existing report
      const existingReport = await this.getCurrentUserReport(userId);
      
      if (existingReport) {
        // Update existing report
        return (await this.updateReport({
          id: userId,
          numberOfGames: gameData.numberOfGames,
          numberOfCards: gameData.numberOfCards,
          totalPayin: gameData.totalPayin,
          totalPayout: gameData.totalPayout,
        })).data!;
      } else {
        // Create new report
        return (await this.createReport({
          id: userId,
          numberOfGames: gameData.numberOfGames,
          numberOfCards: gameData.numberOfCards,
          totalPayin: gameData.totalPayin,
          totalPayout: gameData.totalPayout,
        })).data!;
      }
    } catch (error) {
      console.error('❌ Failed to create or update user report:', error);
      throw error;
    }
  }

  /**
   * Helper method to add game results to user report
   */
  public async addGameToUserReport(
    userId: number,
    gameResult: {
      numberOfCards: number;
      totalPayin: number;
      totalPayout: number;
    }
  ): Promise<GameReport> {
    try {
      console.log('🎮 Adding game result to user report:', { userId, gameResult });
      
      // Increment the user's report with new game data
      return (await this.incrementReport({
        id: userId,
        numberOfGames: 1, // Each call adds 1 game
        numberOfCards: gameResult.numberOfCards,
        totalPayin: gameResult.totalPayin,
        totalPayout: gameResult.totalPayout,
      })).data!;
    } catch (error) {
      console.error('❌ Failed to add game to user report:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reportApiService = ReportApiService.getInstance();
export default reportApiService;