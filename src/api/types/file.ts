export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  metadata?: Record<string, any>;
}

export interface FileDownloadRequest {
  fileId?: string;
  url?: string;
  filename?: string;
  onProgress?: (progress: number, downloadedBytes: number, totalBytes: number) => void;
}

export interface FileDownloadResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    file?: FileInfo;
    downloadUrl?: string;
    blob?: Blob;
    buffer?: ArrayBuffer;
  };
}

export interface FileUploadRequest {
  file: File | FormData;
  filename?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    file: FileInfo;
  };
}

export interface FileListRequest {
  page?: number;
  limit?: number;
  search?: string;
  mimetype?: string;
  uploadedBy?: string;
}

export interface FileListResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    files: FileInfo[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface FileDeleteRequest {
  fileId: string;
}

export interface FileDeleteResponse {
  success: boolean;
  message: string;
  statusCode?: number;
}

export interface FileDownloadLog {
  id: string;
  fileId: string;
  filename: string;
  downloadedBy?: string;
  downloadedAt: string;
  ipAddress?: string;
  userAgent?: string;
  downloadSize: number;
  downloadDuration?: number;
  success: boolean;
  error?: string;
  requestMethod: 'GET' | 'POST';
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  statusCode: number;
}

export interface FileDownloadLogRequest {
  fileId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  success?: boolean;
}

export interface FileDownloadLogResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: {
    logs: FileDownloadLog[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}