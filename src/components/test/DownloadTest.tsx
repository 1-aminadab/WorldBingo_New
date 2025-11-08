import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { fileApiService } from '../../api/services';

export const DownloadTest: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const testDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);

    try {
      console.log('🧪 Testing APK download with progress tracking...');
      
      const downloadResponse = await fileApiService.downloadFile({
        url: 'https://storage.googleapis.com/bingo-app-console/app-release.apk',
        filename: 'test-bingo-app.apk',
        onProgress: (progressPercent: number, downloadedBytes: number, totalBytes: number) => {
          const roundedProgress = Math.round(progressPercent);
          setProgress(roundedProgress);
          
          console.log(`📥 Download progress: ${progressPercent.toFixed(1)}% (${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB / ${(totalBytes / (1024 * 1024)).toFixed(2)}MB)`);
        },
      });

      if (downloadResponse.success) {
        console.log('✅ Test download completed successfully!');
        console.log('📊 Download statistics:', fileApiService.getDownloadStatistics());
        
        Alert.alert(
          'Download Complete!',
          `APK downloaded successfully!\n\nFile size: ${(downloadResponse.data?.file?.size || 0 / (1024 * 1024)).toFixed(2)} MB\n\nCheck console for detailed logs.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(downloadResponse.message || 'Download failed');
      }
    } catch (error: any) {
      console.error('❌ Test download failed:', error);
      Alert.alert('Download Failed', `Error: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const viewLogs = async () => {
    try {
      const logsResponse = await fileApiService.getDownloadLogs({ limit: 5 });
      if (logsResponse.success && logsResponse.data?.logs) {
        console.log('📋 Recent download logs:', logsResponse.data.logs);
        console.log('📊 Download statistics:', fileApiService.getDownloadStatistics());
        Alert.alert('Logs', `Found ${logsResponse.data.logs.length} downloads. Check console for details.`);
      }
    } catch (error) {
      console.error('Failed to get logs:', error);
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: 'white', margin: 10, borderRadius: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        APK Download Test
      </Text>
      
      {isDownloading && (
        <Text style={{ marginBottom: 16, color: 'blue' }}>
          Downloading... {progress}%
        </Text>
      )}
      
      <TouchableOpacity
        style={{
          backgroundColor: isDownloading ? '#ccc' : '#007AFF',
          padding: 12,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={testDownload}
        disabled={isDownloading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {isDownloading ? `Downloading ${progress}%` : 'Test APK Download'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#34C759',
          padding: 12,
          borderRadius: 8,
        }}
        onPress={viewLogs}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          View Download Logs
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DownloadTest;