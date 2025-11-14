import { useReportSyncStore } from './reportSyncStore';
import { sendReport, isOnline } from './reportApi';

/**
 * Sync result interface
 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  totalReports: number;
  error?: string;
  remainingReports: number;
}

/**
 * Main sync function - processes reports one by one (FIFO order)
 * Stops immediately on first failure to prevent data loss
 * 
 * @returns Promise<SyncResult>
 */
export async function syncPendingReports(): Promise<SyncResult> {
  console.log('🔄 [ReportSyncService] Starting report sync process...');

  const startTime = Date.now();
  let syncedCount = 0;
  let failedCount = 0;
  
  try {
    // Check internet connection first
    const deviceIsOnline = await isOnline();
    if (!deviceIsOnline) {
      console.log('📡 [ReportSyncService] Device is offline, skipping sync');
      const store = useReportSyncStore.getState();
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        totalReports: store.reports.length,
        error: 'Device is offline',
        remainingReports: store.reports.length
      };
    }

    console.log('📡 [ReportSyncService] Device is online, proceeding with sync');

    // Get current reports from store
    let store = useReportSyncStore.getState();
    const totalReports = store.reports.length;

    if (totalReports === 0) {
      console.log('📭 [ReportSyncService] No pending reports to sync');
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        totalReports: 0,
        remainingReports: 0
      };
    }

    console.log(`📊 [ReportSyncService] Found ${totalReports} pending reports`);

    // Process reports one by one (FIFO - First In, First Out)
    while (true) {
      // Always get fresh store state
      store = useReportSyncStore.getState();
      
      // Check if we have any reports left
      if (store.reports.length === 0) {
        console.log(`✅ [ReportSyncService] All reports processed`);
        break;
      }

      // Always get the first report (FIFO)
      const currentReport = store.reports[0];

      console.log(`🔄 [ReportSyncService] Processing report ${syncedCount + 1}/${totalReports} (ID: ${currentReport.id}):`, currentReport);
      console.log(`🔄 [ReportSyncService] Current queue size: ${store.reports.length} reports`);

      try {
        // Send the report
        const result = await sendReport(currentReport);

        if (result.success) {
          // Success - remove the first report from storage
          console.log(`✅ [ReportSyncService] Report ${syncedCount + 1} (ID: ${currentReport.id}) sent successfully, removing from queue`);
          
          // Get fresh store state and remove first report
          const freshStore = useReportSyncStore.getState();
          console.log(`🔄 [ReportSyncService] Queue size before removal: ${freshStore.reports.length}`);
          
          if (freshStore.reports.length > 0) {
            freshStore.removeReport(0); // Always remove first report (FIFO)
            
            // Verify removal worked
            const afterRemovalStore = useReportSyncStore.getState();
            console.log(`🔄 [ReportSyncService] Queue size after removal: ${afterRemovalStore.reports.length}`);
          } else {
            console.log(`⚠️ [ReportSyncService] No reports to remove (queue already empty)`);
          }
          
          syncedCount++;
        } else {
          // Failure - stop syncing immediately to prevent data loss
          console.error(`❌ [ReportSyncService] Report ${syncedCount + 1} (ID: ${currentReport.id}) failed to send: ${result.error}`);
          console.error(`🛑 [ReportSyncService] Stopping sync process to prevent data loss`);
          failedCount++;
          
          const duration = Date.now() - startTime;
          console.log(`🏁 [ReportSyncService] Sync completed with failure in ${duration}ms`);
          
          return {
            success: false,
            syncedCount,
            failedCount,
            totalReports,
            error: result.error,
            remainingReports: store.reports.length
          };
        }
      } catch (error: any) {
        // Unexpected error - stop syncing
        const errorMessage = error.message || 'Unexpected error during sync';
        console.error(`❌ [ReportSyncService] Unexpected error processing report ${syncedCount + 1} (ID: ${currentReport.id}):`, errorMessage);
        console.error(`🛑 [ReportSyncService] Stopping sync process due to unexpected error`);
        failedCount++;
        
        const duration = Date.now() - startTime;
        console.log(`🏁 [ReportSyncService] Sync completed with error in ${duration}ms`);
        
        return {
          success: false,
          syncedCount,
          failedCount,
          totalReports,
          error: errorMessage,
          remainingReports: store.reports.length
        };
      }

      // Small delay between requests to be nice to the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // All reports processed successfully
    const duration = Date.now() - startTime;
    console.log(`✅ [ReportSyncService] All ${syncedCount} reports synced successfully in ${duration}ms`);

    return {
      success: true,
      syncedCount,
      failedCount,
      totalReports,
      remainingReports: 0
    };

  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error during sync process';
    console.error(`❌ [ReportSyncService] Critical error during sync:`, errorMessage);
    
    const store = useReportSyncStore.getState();
    const duration = Date.now() - startTime;
    console.log(`🏁 [ReportSyncService] Sync failed in ${duration}ms`);

    return {
      success: false,
      syncedCount,
      failedCount: failedCount + 1,
      totalReports: store.reports.length + syncedCount,
      error: errorMessage,
      remainingReports: store.reports.length
    };
  }
}

/**
 * Main trigger function for app startup and manual sync
 * This is the function that should be called from App.tsx
 */
export async function triggerReportSync(): Promise<SyncResult> {
  console.log('🚀 [ReportSyncService] Sync triggered');
  
  try {
    const result = await syncPendingReports();
    
    if (result.success) {
      console.log(`🎉 [ReportSyncService] Sync completed successfully: ${result.syncedCount} reports synced`);
    } else {
      console.log(`⚠️ [ReportSyncService] Sync completed with issues: ${result.syncedCount} synced, ${result.remainingReports} remaining`);
    }
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to trigger sync';
    console.error(`❌ [ReportSyncService] Error triggering sync:`, errorMessage);
    
    return {
      success: false,
      syncedCount: 0,
      failedCount: 1,
      totalReports: 0,
      error: errorMessage,
      remainingReports: 0
    };
  }
}

/**
 * Get sync status information
 */
export function getSyncStatus(): { pendingReports: number; hasReports: boolean } {
  const store = useReportSyncStore.getState();
  const pendingReports = store.reports.length;
  
  return {
    pendingReports,
    hasReports: pendingReports > 0
  };
}

/**
 * Manual function to clear all pending reports (emergency use only)
 */
export function clearAllPendingReports(): void {
  console.log('🧹 [ReportSyncService] Manually clearing all pending reports');
  const store = useReportSyncStore.getState();
  store.clearReports();
  console.log('✅ [ReportSyncService] All pending reports cleared');
}