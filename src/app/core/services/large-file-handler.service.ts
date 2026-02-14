import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PerformanceMode {
  isActive: boolean;
  fileSize: number;
  fileSizeMB: number;
  reason: string;
}

/**
 * Large File Handler Service
 * Detects large files and enables performance mode
 */
@Injectable({
  providedIn: 'root'
})
export class LargeFileHandlerService {
  
  private readonly SIZE_THRESHOLD_MB = 2;
  
  private performanceModeSubject = new BehaviorSubject<PerformanceMode>({
    isActive: false,
    fileSize: 0,
    fileSizeMB: 0,
    reason: ''
  });

  public performanceMode$: Observable<PerformanceMode> = this.performanceModeSubject.asObservable();

  /**
   * Check if content is large and should trigger performance mode
   */
  checkSize(content: string): PerformanceMode {
    const sizeInBytes = new Blob([content]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    const isLarge = sizeInMB >= this.SIZE_THRESHOLD_MB;

    const mode: PerformanceMode = {
      isActive: isLarge,
      fileSize: sizeInBytes,
      fileSizeMB: sizeInMB,
      reason: isLarge ? `Large file detected (${sizeInMB.toFixed(2)}MB)` : ''
    };

    this.performanceModeSubject.next(mode);
    return mode;
  }

  /**
   * Parse JSON with error handling (sync fallback)
   */
  parseJSON(jsonString: string): { success: boolean; data?: any; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Format JSON with error handling
   */
  formatJSON(jsonString: string, indent: number = 2): { success: boolean; formatted?: string; error?: string } {
    try {
      const obj = JSON.parse(jsonString);
      const formatted = JSON.stringify(obj, null, indent);
      return { success: true, formatted };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current performance mode
   */
  getCurrentMode(): PerformanceMode {
    return this.performanceModeSubject.value;
  }

  /**
   * Disable performance mode manually
   */
  disablePerformanceMode(): void {
    this.performanceModeSubject.next({
      isActive: false,
      fileSize: 0,
      fileSizeMB: 0,
      reason: ''
    });
  }

  /**
   * Get formatted size string
   */
  getFormattedSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
