import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { versionService } from '../services/versionService';

export type UpdateType = 'force' | 'recommended';

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  updateType: UpdateType;
  releaseNotes?: string;
  downloadUrl?: string;
  fileSize?: number;
}

export interface DownloadProgress {
  isDownloading: boolean;
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  canCancel: boolean;
  hasError: boolean;
  errorMessage?: string;
}

interface VersionStore {
  // Version info
  versionInfo: VersionInfo | null;
  isUpdateAvailable: boolean;
  isCheckingForUpdates: boolean;
  isUpdateDismissed: boolean; // Track if update was dismissed but should show floating button
  
  // Download state
  downloadProgress: DownloadProgress;
  
  // Actions
  setVersionInfo: (info: VersionInfo) => void;
  checkForUpdates: () => Promise<void>;
  startDownload: () => void;
  retryDownload: () => void;
  updateDownloadProgress: (progress: Partial<DownloadProgress>) => void;
  cancelDownload: () => void;
  completeDownload: () => void;
  installUpdate: () => Promise<void>;
  uninstallApp: () => Promise<void>;
  dismissUpdate: () => void;
  dismissUpdateModal: () => void; // New action to hide modal but keep floating button
  completeUpdate: () => void; // New action to mark update as completed
  resetDownloadState: () => void;
}

const initialState = {
  versionInfo: null,
  isUpdateAvailable: false,
  isCheckingForUpdates: false,
  isUpdateDismissed: false,
  downloadProgress: {
    isDownloading: false,
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    canCancel: true,
    hasError: false,
    errorMessage: undefined,
  },
};

export const useVersionStore = create<VersionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setVersionInfo: (info: VersionInfo) => {
        const isUpdateAvailable = info.latestVersion !== info.currentVersion;
        set({
          versionInfo: info,
          isUpdateAvailable,
          isUpdateDismissed: false, // Reset dismissed state for new updates
        });
      },

      checkForUpdates: async () => {
        set({ isCheckingForUpdates: true });
        
        try {
          const versionData = await versionService.checkForUpdates();
          if (versionData) {
            get().setVersionInfo(versionData);
          }
        } catch (error) {
          console.warn('Failed to check for updates (non-critical):', error);
          // Don't block the app if version check fails
        } finally {
          set({ isCheckingForUpdates: false });
        }
      },

      startDownload: () => {
        const { versionInfo } = get();
        if (!versionInfo || !versionInfo.downloadUrl) return;

        set({
          downloadProgress: {
            isDownloading: true,
            progress: 0,
            downloadedBytes: 0,
            totalBytes: versionInfo.fileSize || 0,
            canCancel: versionInfo.updateType === 'recommended',
            hasError: false,
            errorMessage: undefined,
          },
        });

        // Start actual download
        versionService.downloadUpdate(
          versionInfo.downloadUrl,
          (progress, downloadedBytes, totalBytes) => {
            get().updateDownloadProgress({
              progress,
              downloadedBytes,
              totalBytes,
            });
          },
          () => {
            get().completeDownload();
          },
          (error) => {
            console.error('Download failed:', error);
            get().updateDownloadProgress({
              isDownloading: false,
              progress: 0,
              downloadedBytes: 0,
              hasError: true,
              errorMessage: error.message || 'Download failed. Please check your internet connection and try again.',
            });
          }
        );
      },

      retryDownload: () => {
        const { versionInfo } = get();
        if (!versionInfo) return;

        // Reset error state and start download again
        set({
          downloadProgress: {
            isDownloading: true,
            progress: 0,
            downloadedBytes: 0,
            totalBytes: versionInfo.fileSize || 0,
            canCancel: versionInfo.updateType === 'recommended',
            hasError: false,
            errorMessage: undefined,
          },
        });

        // Start download again
        versionService.downloadUpdate(
          versionInfo.downloadUrl!,
          (progress, downloadedBytes, totalBytes) => {
            get().updateDownloadProgress({
              progress,
              downloadedBytes,
              totalBytes,
            });
          },
          () => {
            get().completeDownload();
          },
          (error) => {
            console.error('Download failed:', error);
            get().updateDownloadProgress({
              isDownloading: false,
              progress: 0,
              downloadedBytes: 0,
              hasError: true,
              errorMessage: error.message || 'Download failed. Please check your internet connection and try again.',
            });
          }
        );
      },

      updateDownloadProgress: (progress: Partial<DownloadProgress>) => {
        set((state) => ({
          downloadProgress: {
            ...state.downloadProgress,
            ...progress,
          },
        }));
      },

      cancelDownload: () => {
        const { downloadProgress, versionInfo } = get();
        
        if (downloadProgress.canCancel && downloadProgress.isDownloading) {
          versionService.cancelDownload();
          set({
            downloadProgress: {
              ...downloadProgress,
              isDownloading: false,
              progress: 0,
              downloadedBytes: 0,
              hasError: false,
              errorMessage: undefined,
            },
          });
        }
      },

      completeDownload: () => {
        set({
          downloadProgress: {
            isDownloading: false,
            progress: 100,
            downloadedBytes: get().downloadProgress.totalBytes,
            totalBytes: get().downloadProgress.totalBytes,
            canCancel: false,
            hasError: false,
            errorMessage: undefined,
          },
        });
      },

      installUpdate: async () => {
        try {
          await versionService.installUpdate();
        } catch (error) {
          console.error('Installation failed:', error);
          throw error;
        }
      },

      uninstallApp: async () => {
        try {
          await versionService.uninstallApp();
        } catch (error) {
          console.error('Uninstall failed:', error);
          throw error;
        }
      },

      dismissUpdate: () => {
        set({
          isUpdateAvailable: false,
          versionInfo: null,
          isUpdateDismissed: false,
        });
      },

      dismissUpdateModal: () => {
        set({
          isUpdateDismissed: true,
        });
      },

      completeUpdate: () => {
        set({
          isUpdateAvailable: false,
          versionInfo: null,
          isUpdateDismissed: false,
        });
      },

      resetDownloadState: () => {
        set({
          downloadProgress: initialState.downloadProgress,
        });
      },
    }),
    {
      name: 'version-store',
      partialize: (state) => ({
        versionInfo: state.versionInfo,
        isUpdateAvailable: state.isUpdateAvailable,
      }),
    }
  )
);

