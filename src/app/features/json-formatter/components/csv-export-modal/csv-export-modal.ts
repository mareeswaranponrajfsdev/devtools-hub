import { Component, Input, Output, EventEmitter, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class CsvExportModalComponent {
  @Input() jsonData: string = '';
  @Input() set isOpen(value: boolean) {
    this.isOpenSignal.set(value);
    if (value) this.generatePreview();
  }
  get isOpen(): boolean { return this.isOpenSignal(); }
  
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
  
  private delimiterChar = computed(() => {
    const d = this.delimiter();
    return d === 'comma' ? ',' : d === 'semicolon' ? ';' : d === 'tab' ? '\t' : d === 'pipe' ? '|' : ',';
  });
  
  constructor() {
    effect(() => {
      this.delimiter(); this.includeHeaders(); this.flattenObjects(); this.flattenArrays();
      if (this.isOpenSignal()) this.generatePreview();
    });
  }
  
  private generatePreview(): void {
    try {
      if (!this.jsonData?.trim()) { this.csvPreview.set('// No data'); return; }
      const data = JSON.parse(this.jsonData);
      const csv = this.convertToCsv(data, this.delimiterChar(), this.includeHeaders(), this.flattenObjects(), this.flattenArrays());
      this.csvPreview.set(csv || '// Empty');
    } catch (e: any) { this.csvPreview.set(`// Error: ${e.message}`); }
  }
  
  private convertToCsv(data: any, delim: string, headers: boolean, flatObj: boolean, flatArr: boolean): string {
    if (!Array.isArray(data)) data = typeof data === 'object' && data !== null ? [data] : [{ value: data }];
    if (data.length === 0) return '// Empty array';
    const rows = data.map((item: any) => typeof item === 'object' && item !== null ? (flatObj ? this.flattenObject(item, flatArr) : item) : { value: item });
    const keys = new Set<string>();
    rows.forEach((r: any) => typeof r === 'object' && r !== null && Object.keys(r).forEach(k => keys.add(k)));
    const cols = Array.from(keys);
    let csv = '';
    if (headers) csv = cols.map(c => this.esc(c, delim)).join(delim) + '\n';
    rows.forEach((r: any) => {
      if (typeof r !== 'object' || r === null) { csv += this.esc(String(r), delim) + '\n'; return; }
      csv += cols.map(c => {
        const v = r[c];
        return v === undefined || v === null ? '' : typeof v === 'object' ? this.esc(JSON.stringify(v), delim) : this.esc(String(v), delim);
      }).join(delim) + '\n';
    });
    return csv;
  }
  
  private flattenObject(obj: any, flatArr: boolean, prefix = ''): any {
    const result: any = {};
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const val = obj[key];
      const nk = prefix ? `${prefix}.${key}` : key;
      if (val === null || val === undefined) result[nk] = val;
      else if (Array.isArray(val)) {
        if (flatArr) val.forEach((item: any, i: number) => typeof item === 'object' && item !== null ? Object.assign(result, this.flattenObject(item, flatArr, `${nk}[${i}]`)) : (result[`${nk}[${i}]`] = item));
        else result[nk] = JSON.stringify(val);
      } else if (typeof val === 'object') Object.assign(result, this.flattenObject(val, flatArr, nk));
      else result[nk] = val;
    }
    return result;
  }
  
  private esc(v: string, d: string): string {
    return v.includes(d) || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
  }
  
  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.csvPreview());
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    } catch { alert('Failed to copy'); }
  }
  
  downloadCsv(): void {
    const blob = new Blob([this.csvPreview()], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (this.filename() || 'export') + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    this.saved.emit();
    this.closeModal();
  }
  
  closeModal(): void { this.close.emit(); }
  onBackdropClick(e: MouseEvent): void { if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.closeModal(); }
}
