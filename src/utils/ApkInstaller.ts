import { NativeModules, Platform } from 'react-native';

interface ApkInstallerInterface {
  installApk(filePath: string): Promise<string>;
  canInstallPackages(): Promise<boolean>;
  requestInstallPermission(): Promise<string>;
}

const { ApkInstaller } = NativeModules;

export default ApkInstaller as ApkInstallerInterface;

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

