import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { getAppVersion, getAppInfo, isUpdateNeeded, logAppVersion } from '../../utils/appVersion';

export const VersionTest: React.FC = () => {
  const testVersionComparison = () => {
    const currentVersion = getAppVersion();
    const testVersions = ['1.0.0', '1.1.0', '1.1.1', '1.2.0', '2.0.0'];
    
    console.log('🧪 [VERSION TEST] Testing version comparisons...');
    logAppVersion();
    
    const results = testVersions.map(testVersion => {
      const needsUpdate = isUpdateNeeded(testVersion);
      return {
        current: currentVersion,
        test: testVersion,
        needsUpdate,
      };
    });
    
    console.log('🧪 [VERSION TEST] Results:', results);
    
    Alert.alert(
      'Version Test Results',
      `Current: ${currentVersion}\n\n` +
      results.map(r => `${r.test}: ${r.needsUpdate ? 'UPDATE NEEDED' : 'UP TO DATE'}`).join('\n'),
      [{ text: 'OK' }]
    );
  };

  const appInfo = getAppInfo();

  return (
    <View style={{ padding: 20, backgroundColor: 'white', margin: 10, borderRadius: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Version Test
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: 'bold' }}>App Name:</Text> {appInfo.name}
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: 'bold' }}>Current Version:</Text> {appInfo.version}
      </Text>
      
      <Text style={{ marginBottom: 16, fontSize: 12, color: 'gray' }}>
        Version source: package.json (bundled with app)
      </Text>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 12,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={testVersionComparison}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Test Version Comparison
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#34C759',
          padding: 12,
          borderRadius: 8,
        }}
        onPress={logAppVersion}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Log Version Info
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default VersionTest;