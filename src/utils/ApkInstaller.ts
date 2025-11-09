import { NativeModules, Platform } from 'react-native';

interface ApkInstallerInterface {
  installApk(filePath: string): Promise<string>;
  canInstallPackages(): Promise<boolean>;
  requestInstallPermission(): Promise<string>;
  getInstalledPackageInfo(): Promise<{
    packageName: string;
    versionName: string;
    versionCode: number;
  }>;
  uninstallCurrentApp(): Promise<string>;
}

const { ApkInstaller } = NativeModules;

export default ApkInstaller as ApkInstallerInterface;

export const getPackageInfo = async () => {
  if (Platform.OS !== 'android') {
    throw new Error('Package info is only available on Android');
  }
  
  if (!ApkInstaller) {
    throw new Error('ApkInstaller module is not available');
  }

  return await ApkInstaller.getInstalledPackageInfo();
};

export const uninstallCurrentApp = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    throw new Error('Uninstall is only supported on Android');
  }
  
  if (!ApkInstaller) {
    throw new Error('ApkInstaller module is not available');
  }

  await ApkInstaller.uninstallCurrentApp();
};

export const installApk = async (filePath: string): Promise<void> => {
  if (Platform.OS !== 'android') {
    throw new Error('APK installation is only supported on Android');
  }
  
  if (!ApkInstaller) {
    throw new Error('ApkInstaller module is not available');
  }

  try {
    // Check if we can install packages
    const canInstall = await ApkInstaller.canInstallPackages();
    
    if (!canInstall) {
      // Request permission to install packages (Android 8.0+)
      await ApkInstaller.requestInstallPermission();
      throw new Error('Please grant permission to install unknown apps and try again');
    }

    // Install the APK
    await ApkInstaller.installApk(filePath);
  } catch (error) {
    throw error;
  }
};

export const installApkWithConflictHandling = async (filePath: string): Promise<void> => {
  try {
    // Get current package info for debugging
    const packageInfo = await getPackageInfo();
    console.log('📱 [INSTALL] Current package info:', packageInfo);
    
    // Try normal installation first
    await installApk(filePath);
    
  } catch (error: any) {
    console.error('❌ [INSTALL] Installation failed:', error.message);
    
    // If the error suggests a package conflict, provide solutions
    if (error.message.toLowerCase().includes('conflict') || 
        error.message.toLowerCase().includes('existing package') ||
        error.message.toLowerCase().includes('signatures do not match')) {
      
      throw new Error('PACKAGE_CONFLICT');
    }
    
    throw error;
  }
};


