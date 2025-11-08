import { apiClient } from '../client/base';
import { API_ENDPOINTS } from '../config';
import {
  FileInfo,
  FileDownloadRequest,
  FileDownloadResponse,
  FileUploadRequest,
  FileUploadResponse,
  FileListRequest,
  FileListResponse,
  FileDeleteRequest,
  FileDeleteResponse,
  FileDownloadLog,
  FileDownloadLogRequest,
  FileDownloadLogResponse,
  ApiResponse,
} from '../types';

export class FileApiService {
  private downloadLogs: FileDownloadLog[] = [];

  /**
   * Download a file from the backend with comprehensive logging
   */
  async downloadFile(request: FileDownloadRequest): Promise<FileDownloadResponse> {
    const startTime = Date.now();
    const downloadLog: Partial<FileDownloadLog> = {
      id: this.generateLogId(),
      fileId: request.fileId || 'unknown',
      filename: request.filename || 'unknown',
      downloadedAt: new Date().toISOString(),
      requestMethod: request.fileId ? 'GET' : 'POST',
      success: false,
    };

    console.log('🚀 [DOWNLOAD] ===== STARTING FILE DOWNLOAD =====');
    console.log('🚀 [DOWNLOAD] Request details:', {
      fileId: request.fileId,
      url: request.url,
      filename: request.filename,
      hasProgressCallback: !!request.onProgress,
      timestamp: downloadLog.downloadedAt,
      logId: downloadLog.id,
    });

    try {

      let response: any;
      let downloadUrl: string;

      if (request.fileId) {
        // Download by file ID
        downloadUrl = `${API_ENDPOINTS.FILE.DOWNLOAD}/${request.fileId}`;
        response = await apiClient.get<any>(downloadUrl, {
          responseType: 'arraybuffer',
          headers: {
            'Accept': 'application/octet-stream',
          },
        });
      } else if (request.url) {
        // Download by direct URL with React Native compatible progress tracking
        downloadUrl = request.url;
        
        console.log('🔽 [DOWNLOAD] Starting fetch request...');
        console.log('🔽 [DOWNLOAD] URL:', downloadUrl);
        console.log('🔽 [DOWNLOAD] Request headers:', { 'Accept': 'application/octet-stream' });
        
        const fetchResponse = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/octet-stream',
          },
        });
        
        console.log('🔽 [DOWNLOAD] Fetch response received');
        console.log('🔽 [DOWNLOAD] Status:', fetchResponse.status);
        console.log('🔽 [DOWNLOAD] Status text:', fetchResponse.statusText);
        console.log('🔽 [DOWNLOAD] Response headers:', Object.fromEntries(fetchResponse.headers.entries()));
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }

        // Get content length for progress calculation
        const contentLength = parseInt(fetchResponse.headers.get('content-length') || '0', 10);
        console.log('🔽 [DOWNLOAD] Content length:', contentLength, 'bytes');
        console.log('🔽 [DOWNLOAD] Content length MB:', (contentLength / (1024 * 1024)).toFixed(2), 'MB');
        
        console.log('🔽 [DOWNLOAD] Checking response.body availability...');
        console.log('🔽 [DOWNLOAD] Response body exists:', !!fetchResponse.body);
        console.log('🔽 [DOWNLOAD] Response body type:', typeof fetchResponse.body);
        
        // Check if streaming is supported (React Native might not support it)
        if (fetchResponse.body && typeof fetchResponse.body.getReader === 'function') {
          console.log('✅ [DOWNLOAD] Streaming supported, using progress tracking');
          
          const reader = fetchResponse.body.getReader();
          let downloadedBytes = 0;
          const chunks: Uint8Array[] = [];

          // Read the response with progress updates
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('🔽 [DOWNLOAD] Stream reading completed');
              break;
            }
            
            chunks.push(value);
            downloadedBytes += value.length;
            
            // Call progress callback if provided
            if (request.onProgress && contentLength > 0) {
              const progress = (downloadedBytes / contentLength) * 100;
              console.log(`🔽 [DOWNLOAD] Progress: ${progress.toFixed(1)}% (${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB / ${(contentLength / (1024 * 1024)).toFixed(2)}MB)`);
              request.onProgress(Math.min(progress, 100), downloadedBytes, contentLength);
            }
          }

          // Combine all chunks into a single blob
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }

          // Create blob from the combined data
          const blob = new Blob([result], { 
            type: fetchResponse.headers.get('content-type') || 'application/octet-stream' 
          });
          
          console.log('✅ [DOWNLOAD] Streaming download completed, total size:', totalLength);
          
          // Create response object compatible with our structure
          response = {
            data: blob,
            statusCode: fetchResponse.status,
            headers: Object.fromEntries(fetchResponse.headers.entries()),
          };
        } else {
          console.log('⚠️ [DOWNLOAD] Streaming not supported, falling back to blob download');
          console.log('⚠️ [DOWNLOAD] This means no real-time progress tracking');
          
          // Fallback for React Native - download as blob without progress
          const blob = await fetchResponse.blob();
          
          console.log('✅ [DOWNLOAD] Blob download completed, size:', blob.size);
          
          // Simulate progress for UI (since we can't get real progress)
          if (request.onProgress && contentLength > 0) {
            console.log('🔄 [DOWNLOAD] Simulating progress for UI...');
            
            // Simulate progressive download
            const steps = 10;
            for (let i = 1; i <= steps; i++) {
              const progress = (i / steps) * 100;
              const simulatedBytes = Math.floor((progress / 100) * contentLength);
              
              setTimeout(() => {
                console.log(`🔄 [DOWNLOAD] Simulated progress: ${progress}% (${(simulatedBytes / (1024 * 1024)).toFixed(2)}MB / ${(contentLength / (1024 * 1024)).toFixed(2)}MB)`);
                request.onProgress(progress, simulatedBytes, contentLength);
              }, i * 100); // Spread over 1 second
            }
          }
          
          // Create response object compatible with our structure
          response = {
            data: blob,
            statusCode: fetchResponse.status,
            headers: Object.fromEntries(fetchResponse.headers.entries()),
          };
        }
      } else {
        throw new Error('Either fileId or url must be provided');
      }

      const endTime = Date.now();
      const downloadDuration = endTime - startTime;

      // Extract file information from response headers
      const headers = response.headers || {};
      const contentLength = headers['content-length'] || headers['Content-Length'];
      const contentType = headers['content-type'] || headers['Content-Type'];
      const contentDisposition = headers['content-disposition'] || headers['Content-Disposition'];
      
      // Extract filename from content-disposition header if available
      let filename = request.filename;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Complete download log
      const completedLog: FileDownloadLog = {
        ...downloadLog as FileDownloadLog,
        filename: filename || 'unknown',
        downloadSize: parseInt(contentLength || '0', 10),
        downloadDuration,
        success: true,
        statusCode: response.statusCode || 200,
        requestHeaders: {
          'Accept': 'application/octet-stream',
          'Authorization': apiClient.getAuthToken() ? 'Bearer [REDACTED]' : 'None',
        },
        responseHeaders: {
          'content-type': contentType || 'unknown',
          'content-length': contentLength || 'unknown',
          'content-disposition': contentDisposition || 'unknown',
        },
      };

      this.addDownloadLog(completedLog);

      console.log('✅ File download successful:', {
        fileId: request.fileId,
        filename,
        size: completedLog.downloadSize,
        duration: `${downloadDuration}ms`,
        contentType,
        statusCode: response.statusCode,
      });

      // Log download statistics
      this.logDownloadStatistics(completedLog);

      return {
        success: true,
        message: 'File downloaded successfully',
        statusCode: response.statusCode,
        data: {
          file: {
            id: request.fileId || 'unknown',
            filename: filename || 'unknown',
            originalName: filename || 'unknown',
            mimetype: contentType || 'application/octet-stream',
            size: completedLog.downloadSize,
            url: downloadUrl,
            uploadedAt: 'unknown',
          } as FileInfo,
          blob: response.data,
        },
      };

    } catch (error: any) {
      const endTime = Date.now();
      const downloadDuration = endTime - startTime;

      // Complete error log
      const errorLog: FileDownloadLog = {
        ...downloadLog as FileDownloadLog,
        downloadSize: 0,
        downloadDuration,
        success: false,
        error: error.message || 'Unknown error',
        statusCode: error.statusCode || 500,
        requestHeaders: {
          'Accept': 'application/octet-stream',
          'Authorization': apiClient.getAuthToken() ? 'Bearer [REDACTED]' : 'None',
        },
      };

      this.addDownloadLog(errorLog);

      console.error('❌ File download failed:', {
        fileId: request.fileId,
        url: request.url,
        filename: request.filename,
        error: error.message,
        duration: `${downloadDuration}ms`,
        statusCode: error.statusCode,
      });

      return {
        success: false,
        message: error.message || 'File download failed',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * Upload a file to the backend
   */
  async uploadFile(request: FileUploadRequest): Promise<FileUploadResponse> {
    try {
      console.log('🔼 Starting file upload:', {
        filename: request.filename,
        hasFile: !!request.file,
        metadata: request.metadata,
        timestamp: new Date().toISOString(),
      });

      const formData = new FormData();
      if (request.file instanceof File) {
        formData.append('file', request.file, request.filename || request.file.name);
      } else {
        // Assume it's already FormData
        Object.assign(formData, request.file);
      }

      if (request.metadata) {
        formData.append('metadata', JSON.stringify(request.metadata));
      }

      const response = await apiClient.post<any>(
        API_ENDPOINTS.FILE.UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ File upload successful:', {
        filename: request.filename,
        statusCode: response.statusCode,
        fileId: response.data?.file?.id,
      });

      return {
        success: response.success,
        message: response.message || 'File uploaded successfully',
        statusCode: response.statusCode,
        data: response.data,
      };

    } catch (error: any) {
      console.error('❌ File upload failed:', {
        filename: request.filename,
        error: error.message,
        statusCode: error.statusCode,
      });

      return {
        success: false,
        message: error.message || 'File upload failed',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * List files from the backend
   */
  async listFiles(request: FileListRequest = {}): Promise<FileListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (request.page) queryParams.append('page', request.page.toString());
      if (request.limit) queryParams.append('limit', request.limit.toString());
      if (request.search) queryParams.append('search', request.search);
      if (request.mimetype) queryParams.append('mimetype', request.mimetype);
      if (request.uploadedBy) queryParams.append('uploadedBy', request.uploadedBy);

      const url = `${API_ENDPOINTS.FILE.LIST}?${queryParams.toString()}`;
      
      console.log('📋 Listing files:', {
        url,
        params: Object.fromEntries(queryParams),
      });

      const response = await apiClient.get<any>(url);

      console.log('✅ Files listed successfully:', {
        count: response.data?.files?.length || 0,
        statusCode: response.statusCode,
      });

      return {
        success: response.success,
        message: response.message || 'Files listed successfully',
        statusCode: response.statusCode,
        data: response.data,
      };

    } catch (error: any) {
      console.error('❌ Failed to list files:', {
        error: error.message,
        statusCode: error.statusCode,
      });

      return {
        success: false,
        message: error.message || 'Failed to list files',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * Delete a file from the backend
   */
  async deleteFile(request: FileDeleteRequest): Promise<FileDeleteResponse> {
    try {
      console.log('🗑️ Deleting file:', {
        fileId: request.fileId,
        timestamp: new Date().toISOString(),
      });

      const response = await apiClient.delete<void>(
        `${API_ENDPOINTS.FILE.DELETE}/${request.fileId}`
      );

      console.log('✅ File deleted successfully:', {
        fileId: request.fileId,
        statusCode: response.statusCode,
      });

      return {
        success: response.success,
        message: response.message || 'File deleted successfully',
        statusCode: response.statusCode,
      };

    } catch (error: any) {
      console.error('❌ Failed to delete file:', {
        fileId: request.fileId,
        error: error.message,
        statusCode: error.statusCode,
      });

      return {
        success: false,
        message: error.message || 'Failed to delete file',
        statusCode: error.statusCode || 500,
      };
    }
  }

  /**
   * Get download logs
   */
  async getDownloadLogs(request: FileDownloadLogRequest = {}): Promise<FileDownloadLogResponse> {
    try {
      // Filter logs based on request parameters
      let filteredLogs = [...this.downloadLogs];

      if (request.fileId) {
        filteredLogs = filteredLogs.filter(log => log.fileId === request.fileId);
      }

      if (request.userId) {
        filteredLogs = filteredLogs.filter(log => log.downloadedBy === request.userId);
      }

      if (request.success !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.success === request.success);
      }

      if (request.startDate) {
        const startDate = new Date(request.startDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.downloadedAt) >= startDate);
      }

      if (request.endDate) {
        const endDate = new Date(request.endDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.downloadedAt) <= endDate);
      }

      // Pagination
      const page = request.page || 1;
      const limit = request.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedLogs = filteredLogs
        .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
        .slice(startIndex, endIndex);

      console.log('📊 Retrieved download logs:', {
        total: filteredLogs.length,
        page,
        limit,
        returned: paginatedLogs.length,
      });

      return {
        success: true,
        message: 'Download logs retrieved successfully',
        statusCode: 200,
        data: {
          logs: paginatedLogs,
          pagination: {
            page,
            limit,
            total: filteredLogs.length,
            totalPages: Math.ceil(filteredLogs.length / limit),
            hasNext: endIndex < filteredLogs.length,
            hasPrev: page > 1,
          },
        },
      };

    } catch (error: any) {
      console.error('❌ Failed to get download logs:', {
        error: error.message,
      });

      return {
        success: false,
        message: error.message || 'Failed to get download logs',
        statusCode: 500,
      };
    }
  }

  /**
   * Get download statistics
   */
  getDownloadStatistics(): {
    totalDownloads: number;
    successfulDownloads: number;
    failedDownloads: number;
    totalDataTransferred: number;
    averageDownloadTime: number;
    mostDownloadedFiles: Array<{ fileId: string; filename: string; count: number }>;
  } {
    const stats = {
      totalDownloads: this.downloadLogs.length,
      successfulDownloads: this.downloadLogs.filter(log => log.success).length,
      failedDownloads: this.downloadLogs.filter(log => !log.success).length,
      totalDataTransferred: this.downloadLogs
        .filter(log => log.success)
        .reduce((total, log) => total + log.downloadSize, 0),
      averageDownloadTime: 0,
      mostDownloadedFiles: [],
    };

    // Calculate average download time
    const successfulLogs = this.downloadLogs.filter(log => log.success && log.downloadDuration);
    if (successfulLogs.length > 0) {
      stats.averageDownloadTime = successfulLogs.reduce((total, log) => 
        total + (log.downloadDuration || 0), 0
      ) / successfulLogs.length;
    }

    // Calculate most downloaded files
    const fileDownloadCounts = this.downloadLogs.reduce((counts, log) => {
      if (log.success) {
        counts[log.fileId] = (counts[log.fileId] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);

    stats.mostDownloadedFiles = Object.entries(fileDownloadCounts)
      .map(([fileId, count]) => {
        const lastLog = this.downloadLogs
          .filter(log => log.fileId === fileId)
          .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())[0];
        
        return {
          fileId,
          filename: lastLog?.filename || 'unknown',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log('📈 Download statistics:', stats);
    return stats;
  }

  /**
   * Clear download logs (useful for testing or storage management)
   */
  clearDownloadLogs(): void {
    console.log('🧹 Clearing download logs:', {
      previousCount: this.downloadLogs.length,
    });
    this.downloadLogs = [];
  }

  /**
   * Export download logs as JSON
   */
  exportDownloadLogs(): string {
    return JSON.stringify(this.downloadLogs, null, 2);
  }

  // Private helper methods
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addDownloadLog(log: FileDownloadLog): void {
    this.downloadLogs.push(log);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.downloadLogs.length > 1000) {
      this.downloadLogs = this.downloadLogs.slice(-1000);
    }
  }

  private logDownloadStatistics(log: FileDownloadLog): void {
    const stats = {
      fileId: log.fileId,
      filename: log.filename,
      size: this.formatFileSize(log.downloadSize),
      duration: `${log.downloadDuration}ms`,
      speed: log.downloadDuration ? 
        `${this.formatFileSize(log.downloadSize / (log.downloadDuration / 1000))}/s` : 
        'N/A',
      timestamp: log.downloadedAt,
    };

    console.log('📊 Download statistics:', stats);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// Export singleton instance
export const fileApiService = new FileApiService();
export default fileApiService;