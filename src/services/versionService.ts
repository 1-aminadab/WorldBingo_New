import { VersionInfo, UpdateType } from '../store/versionStore';
import { Platform, Linking } from 'react-native';
import { getAppVersion } from '../utils/appVersion';

// Get current app version from package.json (bundled with app)
const getCurrentVersion = (): string => {
  return getAppVersion();
};

// API endpoints
const API_BASE_URL = 'https://world-bingo-mobile-app-backend-230041233104.us-central1.run.app/api';

export class VersionService {
  private static instance: VersionService;
  private downloadController: AbortController | null = null;

  static getInstance(): VersionService {
    if (!VersionService.instance) {
      VersionService.instance = new VersionService();
    }
    return VersionService.instance;
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(): Promise<VersionInfo | null> {
    try {
      const currentVersion = getCurrentVersion();
      const platform = Platform.OS;
      
      // Skip update check if using placeholder API URL
      if (API_BASE_URL.includes('your-api-domain.com')) {
        console.log('Skipping update check - placeholder API URL detected');
        return null;
      }
      
      const response = await fetch(`${API_BASE_URL}/version/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentVersion,
          platform,
          appId: 'world-bingo', // Your app identifier
        }),
        timeout: 5000, // 5 second timeout
      });

      if (!response.ok) {
        console.warn(`Update check failed with status: ${response.status}`);
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Update check returned non-JSON response');
        return null;
      }

      const data = await response.json();
      
      // Check if update is available
      if (data.latestVersion && data.latestVersion !== currentVersion) {
        return {
          currentVersion,
          latestVersion: data.latestVersion,
          updateType: data.updateType as UpdateType,
          releaseNotes: data.releaseNotes,
          downloadUrl: data.downloadUrl,
          fileSize: data.fileSize,
        };
      }

      return null;
    } catch (error) {
      console.warn('Update check failed (non-critical):', error.message || error);
      // Return null instead of throwing to prevent blocking the app
      return null;
    }
  }

  /**
   * Download the update file
   */
  async downloadUpdate(
    downloadUrl: string,
    onProgress: (progress: number, downloadedBytes: number, totalBytes: number) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      this.downloadController = new AbortController();
      
      // For testing purposes, simulate download if URL is a placeholder
      if (downloadUrl.includes('example.com') || downloadUrl.includes('placeholder')) {
        await this.simulateDownload(onProgress, onComplete, onError);
        return;
      }

      const response = await fetch(downloadUrl, {
        signal: this.downloadController.signal,
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let downloadedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        downloadedBytes += value.length;
        
        const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
        onProgress(progress, downloadedBytes, totalBytes);
      }

      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      // Save the file (implementation depends on your needs)
      await this.saveUpdateFile(result);
      
      onComplete();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Download cancelled');
      } else {
        console.error('Download error:', error);
        onError(error as Error);
      }
    } finally {
      this.downloadController = null;
    }
  }

  /**
   * Simulate download for testing purposes
   */
  private async simulateDownload(
    onProgress: (progress: number, downloadedBytes: number, totalBytes: number) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const totalBytes = 25 * 1024 * 1024; // 25MB
    let downloadedBytes = 0;
    let progress = 0;

    const downloadInterval = setInterval(() => {
      // Check if download was cancelled
      if (this.downloadController?.signal.aborted) {
        clearInterval(downloadInterval);
        return;
      }

      // Simulate download progress
      const increment = Math.random() * 1024 * 1024; // Random increment up to 1MB
      downloadedBytes += increment;
      progress = Math.min((downloadedBytes / totalBytes) * 100, 100);

      onProgress(progress, Math.floor(downloadedBytes), totalBytes);

      if (progress >= 100) {
        clearInterval(downloadInterval);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 100); // Update every 100ms
  }

  /**
   * Cancel ongoing download
   */
  cancelDownload(): void {
    if (this.downloadController) {
      this.downloadController.abort();
      this.downloadController = null;
    }
  }

  /**
   * Save the downloaded update file
   */
  private async saveUpdateFile(fileData: Uint8Array): Promise<void> {
    // Implementation depends on your platform and requirements
    // For React Native, you might use:
    // - react-native-fs for file system operations
    // - react-native-document-picker for file handling
    // - Or save to a temporary directory for installation
    
    console.log('Saving update file...', fileData.length, 'bytes');
    
    // Placeholder implementation
    // In a real app, you would:
    // 1. Save the file to a temporary directory
    // 2. Trigger the installation process
    // 3. Handle platform-specific installation logic
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Update file saved successfully');
        resolve();
      }, 1000);
    });
  }

  /**
   * Install the downloaded update
   */
  async installUpdate(): Promise<void> {
    console.log('Installing update...');
    
    try {
      // For Android - Open APK file for installation
      if (Platform.OS === 'android') {
        await this.installAndroidUpdate();
      } else if (Platform.OS === 'ios') {
        await this.installIOSUpdate();
      }
      
      console.log('Update installation initiated successfully');
    } catch (error) {
      console.error('Installation failed:', error);
      throw error;
    }
  }

  /**
   * Install update on Android
   */
  private async installAndroidUpdate(): Promise<void> {
    // For Android, we need to:
    // 1. Save the APK file to a public directory
    // 2. Open the APK file with the system installer
    // 3. Navigate to the file location
    
    const apkPath = await this.saveAPKFile();
    
    // Open APK file with system installer
    const fileUri = `file://${apkPath}`;
    
    try {
      await Linking.openURL(fileUri);
    } catch (error) {
      // Fallback: try to open with file manager
      const fileManagerUri = `content://com.android.externalstorage.documents/document/primary:${apkPath}`;
      await Linking.openURL(fileManagerUri);
    }
  }

  /**
   * Install update on iOS
   */
  private async installIOSUpdate(): Promise<void> {
    // For iOS, we typically use TestFlight or similar
    // This is a placeholder for iOS-specific installation
    console.log('iOS update installation not implemented - use TestFlight or App Store');
  }

  /**
   * Save APK file to device storage
   */
  private async saveAPKFile(): Promise<string> {
    // This would typically use react-native-fs or similar
    // For now, we'll simulate the file path
    const fileName = `WorldBingo-${Date.now()}.apk`;
    const filePath = `/storage/emulated/0/Download/${fileName}`;
    
    console.log(`APK saved to: ${filePath}`);
    return filePath;
  }

  /**
   * Uninstall the current app
   */
  async uninstallApp(): Promise<void> {
    console.log('Uninstalling app...');
    
    try {
      if (Platform.OS === 'android') {
        await this.uninstallAndroidApp();
      } else if (Platform.OS === 'ios') {
        await this.uninstallIOSApp();
      }
    } catch (error) {
      console.error('Uninstall failed:', error);
      throw error;
    }
  }

  /**
   * Uninstall app on Android
   */
  private async uninstallAndroidApp(): Promise<void> {
    const packageName = 'com.worldbingo.app'; // Replace with your actual package name
    
    try {
      // Open app settings for uninstall
      await Linking.openURL(`package:${packageName}`);
    } catch (error) {
      // Fallback: open general app settings
      await Linking.openURL('android.settings.APPLICATION_SETTINGS');
    }
  }

  /**
   * Uninstall app on iOS
   */
  private async uninstallIOSApp(): Promise<void> {
    // iOS doesn't allow programmatic uninstall
    // We can only guide the user to the home screen
    console.log('iOS uninstall: User must manually delete app from home screen');
  }

  /**
   * Get app version info
   */
  getAppVersion(): { version: string; buildNumber: string } {
    return {
      version: getCurrentVersion(),
      buildNumber: '1', // Get from your app config
    };
  }
}

// Export singleton instance
export const versionService = VersionService.getInstance();
