// Report API types

export interface GameReport {
  id: number;
  numberOfGames: number;
  numberOfCards: number;
  totalPayin: number;
  totalPayout: number;
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

// Transaction types for future use
export interface Transaction {
  id: string;
  userId: number;
  gameId?: string;
  type: 'payin' | 'payout' | 'bonus' | 'refund';
  amount: number;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface CreateTransactionRequest {
  userId: number | string; // Allow both for flexibility
  gameId?: string;
  type: 'payin' | 'payout' | 'bonus' | 'refund';
  amount: number;
  description: string;
}

export interface TransactionResponse {
  success: boolean;
  data?: Transaction;
  message?: string;
}

export interface GetTransactionsResponse {
  success: boolean;
  data?: Transaction[];
  message?: string;
}