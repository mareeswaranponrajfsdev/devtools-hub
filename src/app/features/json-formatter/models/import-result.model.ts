export interface ImportResult {
  success: boolean;
  data?: string;
  fileName?: string;
  error?: string;
  fileSize?: number;
  source?: string;
}

export interface UrlImportOptions {
  url: string;
  timeout?: number;
}

export interface CsvImportOptions {
  hasHeaders?: boolean;
  delimiter?: string;
}
