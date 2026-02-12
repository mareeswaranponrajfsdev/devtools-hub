export type ImportSource = 'file' | 'url' | 'csv';

export interface ImportResult {
  success: boolean;
  data?: string;
  error?: string;
  source: ImportSource;
  fileName?: string;
}

export interface UrlImportOptions {
  url: string;
  timeout?: number;
}

export interface CsvImportOptions {
  hasHeaders?: boolean;
  delimiter?: string;
}
