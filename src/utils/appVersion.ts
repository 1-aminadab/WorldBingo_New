import packageJson from '../../package.json';

/**
 * Get the current app version from package.json
 * This ensures the version is always bundled with the app and doesn't rely on storage
 */
export const getAppVersion = (): string => {
  return packageJson.version;
};

/**
 * Get app information including version and name
 */
export const getAppInfo = () => {
  return {
    version: packageJson.version,
    name: packageJson.name,
  };
};

/**
 * Compare two version strings (semantic versioning)
 * Returns: -1 if current < latest, 0 if equal, 1 if current > latest
 */
export const compareVersions = (current: string, latest: string): number => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (currentPart < latestPart) return -1;
    if (currentPart > latestPart) return 1;
  }
  return 0;
};

/**
 * Check if an update is needed by comparing versions
 */
export const isUpdateNeeded = (latestVersion: string): boolean => {
  const currentVersion = getAppVersion();
  const comparison = compareVersions(currentVersion, latestVersion);
  
  console.log('🔍 [VERSION] Version comparison:', {
    current: currentVersion,
    latest: latestVersion,
    comparison,
    needsUpdate: comparison < 0,
  });
  
  return comparison < 0;
};

/**
 * Log current app version info
 */
export const logAppVersion = () => {
  const info = getAppInfo();
  console.log('📱 [VERSION] App version info:', {
    name: info.name,
    version: info.version,
    source: 'package.json (bundled)',
  });
};

