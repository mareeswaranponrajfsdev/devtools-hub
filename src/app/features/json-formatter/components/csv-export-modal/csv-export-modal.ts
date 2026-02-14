import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  signal, 
  computed, 
  effect, 
  ChangeDetectionStrategy,
  Renderer2,
  Inject,
  PLATFORM_ID,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CsvExportOptions {
  delimiter: 'comma' | 'semicolon' | 'tab' | 'pipe';
  includeHeaders: boolean;
  flattenObjects: boolean;
  flattenArrays: boolean;
}

@Component({
  selector: 'app-csv-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './csv-export-modal.html',
  styleUrl: './csv-export-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsvExportModalComponent implements OnDestroy {
  
  @ViewChild('modalDialog', { read: ElementRef }) modalDialog!: ElementRef;
  
  @Input() jsonData: string = '';
  
  @Input() set isOpen(value: boolean) {
    this.isOpenSignal.set(value);
    if (value) {
      this.resetState();
      this.generatePreview();
      this.lockBodyScroll();
    } else {
      this.unlockBodyScroll();
    }
  }
  get isOpen(): boolean {
    return this.isOpenSignal();
  }
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  
  isOpenSignal = signal(false);
  filename = signal('export');
  delimiter = signal<'comma' | 'semicolon' | 'tab' | 'pipe'>('comma');
  includeHeaders = signal(true);
  flattenObjects = signal(true);
  flattenArrays = signal(false);
  csvPreview = signal('');
  isCopied = signal(false);
  errorMessage = signal<string | null>(null);
  
  private delimiterChar = computed(() => {
    const d = this.delimiter();
    switch (d) {
      case 'comma': return ',';
      case 'semicolon': return ';';
      case 'tab': return '\t';
      case 'pipe': return '|';
      default: return ',';
    }
  });
  
  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    effect(() => {
      this.delimiter();
      this.includeHeaders();
      this.flattenObjects();
      this.flattenArrays();
      
      if (this.isOpenSignal()) {
        this.generatePreview();
      }
    });
  }
  
  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }
  
  private lockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.addClass(document.body, 'modal-open');
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    }
  }
  
  private unlockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.removeClass(document.body, 'modal-open');
      this.renderer.removeStyle(document.body, 'overflow');
    }
  }
  
  private resetState(): void {
    this.filename.set('export');
    this.delimiter.set('comma');
    this.includeHeaders.set(true);
    this.flattenObjects.set(true);
    this.flattenArrays.set(false);
    this.isCopied.set(false);
    this.errorMessage.set(null);
  }
  
  private generatePreview(): void {
    try {
      this.errorMessage.set(null);
      
      if (!this.jsonData?.trim()) {
        this.csvPreview.set('// No data to export');
        return;
      }
      
      let data;
      try {
        data = JSON.parse(this.jsonData);
      } catch (parseError: any) {
        this.errorMessage.set('Invalid JSON: ' + parseError.message);
        this.csvPreview.set('// Error: Invalid JSON');
        return;
      }
      
      const csv = this.convertToCsv(
        data,
        this.delimiterChar(),
        this.includeHeaders(),
        this.flattenObjects(),
        this.flattenArrays()
      );
      
      if (!csv || csv.trim() === '') {
        this.csvPreview.set('// Empty result');
      } else {
        this.csvPreview.set(csv);
      }
      
    } catch (e: any) {
      this.errorMessage.set(e.message || 'Unknown error');
      this.csvPreview.set(`// Error: ${e.message}`);
    }
  }
  
  private convertToCsv(
    data: any,
    delimiter: string,
    includeHeaders: boolean,
    flattenObjects: boolean,
    flattenArrays: boolean
  ): string {
    
    if (!Array.isArray(data)) {
      if (data === null || data === undefined) {
        return '// Null or undefined data';
      }
      if (typeof data === 'object') {
        data = [data];
      } else {
        data = [{ value: data }];
      }
    }
    
    if (data.length === 0) {
      return '// Empty array';
    }
    
    const rows = data.map((item: any) => {
      if (typeof item === 'object' && item !== null) {
        return flattenObjects ? this.flattenObject(item, flattenArrays) : item;
      }
      return { value: item };
    });
    
    const columnSet = new Set<string>();
    rows.forEach((row: any) => {
      if (typeof row === 'object' && row !== null) {
        Object.keys(row).forEach(key => columnSet.add(key));
      }
    });
    const columns = Array.from(columnSet).sort();
    
    if (columns.length === 0) {
      return '// No columns found';
    }
    
    let csv = '';
    
    if (includeHeaders) {
      csv = columns.map(col => this.escapeCsvValue(col, delimiter)).join(delimiter) + '\n';
    }
    
    rows.forEach((row: any) => {
      if (typeof row !== 'object' || row === null) {
        csv += this.escapeCsvValue(String(row), delimiter) + '\n';
        return;
      }
      
      const values = columns.map(col => {
        const value = row[col];
        
        if (value === undefined || value === null) {
          return '';
        }
        
        if (typeof value === 'object') {
          return this.escapeCsvValue(JSON.stringify(value), delimiter);
        }
        
        return this.escapeCsvValue(String(value), delimiter);
      });
      
      csv += values.join(delimiter) + '\n';
    });
    
    return csv;
  }
  
  private flattenObject(obj: any, flattenArrays: boolean, prefix = ''): any {
    const result: any = {};
    
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) {
        continue;
      }
      
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        result[newKey] = value;
        continue;
      }
      
      if (Array.isArray(value)) {
        if (flattenArrays) {
          value.forEach((item: any, index: number) => {
            if (typeof item === 'object' && item !== null) {
              Object.assign(result, this.flattenObject(item, flattenArrays, `${newKey}[${index}]`));
            } else {
              result[`${newKey}[${index}]`] = item;
            }
          });
        } else {
          result[newKey] = JSON.stringify(value);
        }
        continue;
      }
      
      if (typeof value === 'object') {
        Object.assign(result, this.flattenObject(value, flattenArrays, newKey));
        continue;
      }
      
      result[newKey] = value;
    }
    
    return result;
  }
  
  private escapeCsvValue(value: string, delimiter: string): string {
    const needsEscaping = 
      value.includes(delimiter) || 
      value.includes('"') || 
      value.includes('\n') ||
      value.includes('\r');
    
    if (!needsEscaping) {
      return value;
    }
    
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  async copyToClipboard(): Promise<void> {
    try {
      const csv = this.csvPreview();
      
      if (!csv || csv.startsWith('//')) {
        alert('No valid CSV to copy');
        return;
      }
      
      await navigator.clipboard.writeText(csv);
      
      this.isCopied.set(true);
      setTimeout(() => {
        this.isCopied.set(false);
      }, 2000);
      
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy to clipboard');
    }
  }
  
  downloadCsv(): void {
    try {
      const csv = this.csvPreview();
      
      if (!csv || csv.startsWith('//')) {
        alert('No valid CSV to download');
        return;
      }
      
      const filename = (this.filename() || 'export').trim();
      const fullFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
      
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fullFilename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      this.saved.emit();
      
      setTimeout(() => {
        this.closeModal();
      }, 300);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download CSV file');
    }
  }
  
  closeModal(): void {
    this.unlockBodyScroll();
    this.close.emit();
  }
  
  /**
   * CRITICAL: Check if click is actually inside modal dialog
   */
  onBackdropClick(event: MouseEvent): void {
    // Get the modal dialog element
    if (this.modalDialog && this.modalDialog.nativeElement) {
      const dialogElement = this.modalDialog.nativeElement;
      const clickedElement = event.target as HTMLElement;
      
      // Check if click is inside modal dialog
      if (dialogElement.contains(clickedElement)) {
        // Click is inside modal - DO NOTHING
        return;
      }
    }
    
    // Click is outside modal - CLOSE IT
    this.closeModal();
  }
  
  updateFilename(value: string): void {
    this.filename.set(value);
  }
  
  updateDelimiter(value: string): void {
    this.delimiter.set(value as 'comma' | 'semicolon' | 'tab' | 'pipe');
  }
  
  toggleHeaders(value: boolean): void {
    this.includeHeaders.set(value);
  }
  
  toggleFlattenObjects(value: boolean): void {
    this.flattenObjects.set(value);
  }
  
  toggleFlattenArrays(value: boolean): void {
    this.flattenArrays.set(value);
  }
}
