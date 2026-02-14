import { Injectable } from '@angular/core';
import { ImportResult, UrlImportOptions, CsvImportOptions } from '../models/import-result.model';

@Injectable({
  providedIn: 'root'
})
export class FileImportService {

  async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await this.readFileAsText(file);
      
      // Validate JSON
      try {
        JSON.parse(text);
        return {
          success: true,
          data: text,
          source: 'file',
          fileName: file.name
        };
      } catch {
        return {
          success: true,
          data: text,
          source: 'file',
          fileName: file.name
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`,
        source: 'file',
        fileName: file.name
      };
    }
  }

  async importFromUrl(options: UrlImportOptions): Promise<ImportResult> {
    try {
      const controller = new AbortController();
      const timeout = options.timeout || 10000;
      
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(options.url, {
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      // Try to parse as JSON
      try {
        JSON.parse(text);
      } catch {
        // Not valid JSON, but return anyway
      }

      return {
        success: true,
        data: text,
        source: 'url',
        fileName: this.extractFilenameFromUrl(options.url)
      };

    } catch (error: any) {
      let errorMessage = 'Failed to fetch URL';

      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error - URL does not allow cross-origin requests';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        source: 'url'
      };
    }
  }

  async importFromCsv(file: File, options?: CsvImportOptions): Promise<ImportResult> {
    try {
      const text = await this.readFileAsText(file);
      const json = this.csvToJson(text, options);

      return {
        success: true,
        data: json,
        source: 'csv',
        fileName: file.name
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to convert CSV: ${error.message}`,
        source: 'csv',
        fileName: file.name
      };
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  private csvToJson(csv: string, options?: CsvImportOptions): string {
    const hasHeaders = options?.hasHeaders !== false;
    const delimiter = options?.delimiter || ',';

    const lines = csv.trim().split('\n').map(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers: string[] = [];
    const data: any[] = [];

    // Parse first line as headers or generate numeric headers
    if (hasHeaders) {
      headers.push(...this.parseCsvLine(lines[0], delimiter));
    } else {
      const firstLineFields = this.parseCsvLine(lines[0], delimiter);
      for (let i = 0; i < firstLineFields.length; i++) {
        headers.push(`field_${i + 1}`);
      }
    }

    // Parse data rows
    const startRow = hasHeaders ? 1 : 0;
    for (let i = startRow; i < lines.length; i++) {
      const fields = this.parseCsvLine(lines[i], delimiter);
      
      if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) {
        continue; // Skip empty lines
      }

      const row: any = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = this.parseValue(fields[j] || '');
      }
      data.push(row);
    }

    return JSON.stringify(data, null, 2);
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private parseValue(value: string): any {
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/""/g, '"');
    }

    // Try to parse as number
    if (/^-?\d+\.?\d*$/.test(value)) {
      return parseFloat(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Try to parse as null
    if (value.toLowerCase() === 'null' || value === '') return null;

    return value;
  }

  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      return filename || 'imported.json';
    } catch {
      return 'imported.json';
    }
  }
}
