import { Report } from './reportSyncStore';

/**
 * Validates a report according to the specified rules:
 * - All fields must be numbers
 * - No field can be null, undefined, or 0
 * - numberOfGames defaults to 1 if not provided
 * 
 * @param report - The report to validate
 * @returns boolean - true if valid
 * @throws Error - if invalid with detailed message
 */
export function validateReport(report: any): boolean {
  console.log('🔍 [ReportValidator] Validating report:', report);

  // Check if report exists
  if (!report || typeof report !== 'object') {
    const error = 'Report must be a valid object';
    console.error(`❌ [ReportValidator] ${error}`);
    throw new Error(error);
  }

  // Extract fields with numberOfGames defaulting to 1
  const {
    numberOfGames = 1,
    numberOfCards,
    totalPayin,
    totalPayout,
    balance
  } = report;

  // Validate numberOfGames (defaults to 1, must be positive)
  if (typeof numberOfGames !== 'number' || numberOfGames <= 0 || !isFinite(numberOfGames)) {
    const error = `numberOfGames must be a positive number, got: ${numberOfGames}`;
    console.error(`❌ [ReportValidator] ${error}`);
    throw new Error(error);
  }

  // Validate numberOfCards (required, must be positive)
  if (typeof numberOfCards !== 'number' || numberOfCards <= 0 || !isFinite(numberOfCards)) {
    const error = `numberOfCards must be a positive number, got: ${numberOfCards}`;
    console.error(`❌ [ReportValidator] ${error}`);
    throw new Error(error);
  }

  // Validate totalPayin (required, must be positive)
  if (typeof totalPayin !== 'number' || totalPayin <= 0 || !isFinite(totalPayin)) {
    const error = `totalPayin must be a positive number, got: ${totalPayin}`;
    console.error(`❌ [ReportValidator] ${error}`);
    throw new Error(error);
  }

  // Validate totalPayout (required, must be non-negative)
  if (typeof totalPayout !== 'number' || totalPayout < 0 || !isFinite(totalPayout)) {
    const error = `totalPayout must be a non-negative number, got: ${totalPayout}`;
    console.error(`❌ [ReportValidator] ${error}`);
    throw new Error(error);
  }

  // Validate balance (required, must be a finite number)
  if (typeof balance !== 'number' || !isFinite(balance)) {
    const error = `balance must be a finite number, got: ${balance}`;
    console.error(`❌ [ReportValidator] ${error}`);
    throw new Error(error);
  }

  console.log('✅ [ReportValidator] Report is valid:', {
    numberOfGames,
    numberOfCards,
    totalPayin,
    totalPayout,
    balance
  });

  return true;
}

/**
 * Creates a validated Report object with proper defaults
 * 
 * @param reportData - Raw report data
 * @returns Report - Validated and formatted report
 * @throws Error - if validation fails
 */
export function createValidatedReport(reportData: {
  numberOfGames?: number;
  numberOfCards: number;
  totalPayin: number;
  totalPayout: number;
  balance: number;
}): Report {
  console.log('🏭 [ReportValidator] Creating validated report from:', reportData);

  // Apply defaults
  const reportWithDefaults = {
    numberOfGames: reportData.numberOfGames || 1,
    numberOfCards: reportData.numberOfCards,
    totalPayin: reportData.totalPayin,
    totalPayout: reportData.totalPayout,
    balance: reportData.balance
  };

  // Validate the report
  validateReport(reportWithDefaults);

  console.log('✅ [ReportValidator] Created validated report:', reportWithDefaults);
  return reportWithDefaults as Report;
}