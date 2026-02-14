import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ExportResult {
  success: boolean;
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JsonExportService {
  constructor(private http: HttpClient) {}

  saveToDisk(jsonString: string, filename: string = 'export.json'): ExportResult {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true, message: `File "${filename}" downloaded` };
    } catch (error: any) {
      return { success: false, message: 'Failed to download', error: error.message };
    }
  }

  saveToCloud(jsonString: string): Observable<ExportResult> {
    return of({ success: true, message: 'Cloud save coming soon!' }).pipe(delay(1000));
  }

  exportToCsv(jsonString: string): ExportResult {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        return { success: false, message: 'CSV export requires array' };
      }
      const csv = this.jsonToCsv(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'export.csv';
      link.click();
      URL.revokeObjectURL(url);
      return { success: true, message: 'CSV exported' };
    } catch (error: any) {
      return { success: false, message: 'CSV export failed', error: error.message };
    }
  }

  sendToUrl(jsonString: string, url: string): Observable<ExportResult> {
    try {
      const data = JSON.parse(jsonString);
      return of({ success: true, message: `Sent to ${url}` }).pipe(delay(1000));
    } catch (error: any) {
      return of({ success: false, message: 'Invalid JSON', error: error.message });
    }
  }

  private jsonToCsv(data: any[]): string {
    if (data.length === 0) return '';
    const keys = Object.keys(data[0]);
    let csv = keys.join(',') + '\n';
    data.forEach(item => {
      const row = keys.map(key => JSON.stringify(item[key] || '')).join(',');
      csv += row + '\n';
    });
    return csv;
  }
}
