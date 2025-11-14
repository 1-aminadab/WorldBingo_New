import { Report } from './reportSyncStore';
import { apiClient } from '../api/client/base';

// API Configuration
const API_ENDPOINT = 'https://world-bingo-mobile-app-backend-230041233104.us-central1.run.app/api/v1/report';
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * API Response interface
 */
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Get authorization token from existing API client (ensure token is loaded first)
 */
async function getAuthToken(): Promise<string | null> {
  try {
    console.log('🔑 [ReportApi] Getting auth token from API client...');
    
    // Ensure token is loaded from storage first
    await apiClient.ensureTokenLoaded();
    
    const token = apiClient.getAuthToken();
    
    console.log('🔑 [ReportApi] Auth token debug info:', {
      tokenExists: !!token,
      tokenType: typeof token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'null',
      apiClientType: typeof apiClient,
      apiClientExists: !!apiClient
    });
    
    if (!token) {
      console.error('❌ [ReportApi] No auth token available');
      console.log('🔑 [ReportApi] Let\'s debug this - checking AsyncStorage directly...');
      
      // Let's also try to check AsyncStorage directly as a comparison
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      try {
        const storageToken = await AsyncStorage.getItem('authToken');
        console.log('🔑 [ReportApi] AsyncStorage token check:', {
          storageTokenExists: !!storageToken,
          storageTokenLength: storageToken?.length || 0,
          storageTokenPreview: storageToken ? `${storageToken.substring(0, 10)}...` : 'null'
        });
      } catch (storageError) {
        console.error('❌ [ReportApi] AsyncStorage check failed:', storageError);
      }
      
      return null;
    }
    
    console.log('🔑 [ReportApi] Auth token retrieved successfully');
    return token;
  } catch (error) {
    console.error('❌ [ReportApi] Error getting auth token:', error);
    return null;
  }
}

/**
 * Check internet connectivity
 */
async function checkInternetConnection(): Promise<boolean> {
  try {
    console.log('📡 [ReportApi] Checking internet connection...');
    
    // Simple connectivity check using a lightweight endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for connectivity check
    
    const response = await fetch('https://google.com', {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const isOnline = response.ok;
    console.log(`📡 [ReportApi] Internet connection: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    
    return isOnline;
  } catch (error) {
    console.log('📡 [ReportApi] Internet connection: OFFLINE (check failed)');
    return false;
  }
}

/**
 * Send a single report to the backend
 * 
 * @param report - The report to send
 * @returns Promise<{ success: boolean, error?: string }>
 */
export async function sendReport(report: Report): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();
  console.log('📤 [ReportApi] Sending report to backend:', report);

  try {
    // Check internet connection first
    const isOnline = await checkInternetConnection();
    if (!isOnline) {
      const error = 'No internet connection available';
      console.error(`❌ [ReportApi] ${error}`);
      return { success: false, error };
    }

    // Get auth token (ensure it's loaded)
    const token = await getAuthToken();
    if (!token) {
      const error = 'No authentication token available';
      console.error(`❌ [ReportApi] ${error}`);
      return { success: false, error };
    }

    // Prepare request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const requestBody = JSON.stringify(report);

    console.log('='.repeat(80));
    console.log('📤 [ReportApi] 🚀 SENDING REQUEST TO BACKEND 🚀');
    console.log(`📤 [ReportApi] Endpoint: ${API_ENDPOINT}`);
    console.log(`📤 [ReportApi] Method: POST`);
    console.log('📤 [ReportApi] Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `${token.substring(0, 10)}...[HIDDEN]`,
      'Content-Length': requestBody.length
    });
    console.log('📤 [ReportApi] Request body:', requestBody);
    console.log('📤 [ReportApi] Request body parsed:', report);
    console.log('='.repeat(80));

    // Make API call
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token, // Send token directly as specified (no "Bearer" prefix)
      },
      body: requestBody,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📤 [ReportApi] Response status: ${response.status}`);
    console.log(`📤 [ReportApi] Response headers:`, {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      server: response.headers.get('server'),
      date: response.headers.get('date')
    });

    // Check if response is successful
    if (!response.ok) {
      const errorText = await response.text();
      const error = `HTTP ${response.status}: ${errorText}`;
      console.error(`❌ [ReportApi] ${error}`);
      console.log('📤 [ReportApi] Full error response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorBody: errorText
      });
      return { success: false, error };
    }

    // Parse response
    const responseData: ApiResponse = await response.json();
    console.log('='.repeat(80));
    console.log('📤 [ReportApi] ✅ BACKEND RESPONSE RECEIVED ✅');
    console.log('📤 [ReportApi] Response data:', JSON.stringify(responseData, null, 2));
    console.log('📤 [ReportApi] Response keys:', Object.keys(responseData));
    console.log('📤 [ReportApi] Success field:', responseData.success);
    console.log('📤 [ReportApi] Message field:', responseData.message);
    console.log('📤 [ReportApi] Data field:', responseData.data);
    console.log('='.repeat(80));

    if (responseData.success !== false) {
      const duration = Date.now() - startTime;
      console.log(`✅ [ReportApi] Report sent successfully in ${duration}ms`);
      return { success: true };
    } else {
      const duration = Date.now() - startTime;
      const error = responseData.message || 'API returned success: false';
      console.error(`❌ [ReportApi] ${error} (took ${duration}ms)`);
      return { success: false, error };
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    let errorMessage = 'Unknown error';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error(`❌ [ReportApi] Error sending report (took ${duration}ms):`, errorMessage);
    console.error(`❌ [ReportApi] Full error details:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if the device is online
 */
export async function isOnline(): Promise<boolean> {
  return await checkInternetConnection();
}