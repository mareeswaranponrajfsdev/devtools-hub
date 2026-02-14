import {
  Component,
  Output,
  EventEmitter,
  signal,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HistoryEntry {
  key: string;
  content: string;
  timestamp: number;
  size: number;
  label: string;
}

@Component({
  selector: 'app-session-history-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-history-list.component.html',
  styleUrl: './session-history-list.component.scss',
})
export class SessionHistoryListComponent implements OnInit, OnChanges {

  /** Pass a changing number to trigger a reload after clear/save */
  @Input() refreshTrigger = 0;

  @Output() restore = new EventEmitter<HistoryEntry>();
  @Output() delete  = new EventEmitter<string>();

  entries = signal<HistoryEntry[]>([]);
  isOpen  = signal(false);
  preview = signal<HistoryEntry | null>(null);

  constructor(private elRef: ElementRef) {}

  ngOnInit(): void  { this.loadHistory(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadHistory();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.isOpen() && !this.elRef.nativeElement.contains(e.target)) {
      this.isOpen.set(false);
      this.preview.set(null);
    }
  }

  togglePanel(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) { this.loadHistory(); this.preview.set(null); }
  }

  private loadHistory(): void {
    const result: HistoryEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      // Only load json-history- entries (not json-session- to avoid duplicates)
      if (key.startsWith('json-history-')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          result.push({
            key,
            content:   parsed.content   || '',
            timestamp: parsed.timestamp || 0,
            size:      parsed.size      || new Blob([parsed.content || '']).size,
            label:     parsed.label     || this.labelFromKey(key),
          });
        } catch {}
      }
    }
    result.sort((a, b) => b.timestamp - a.timestamp);
    this.entries.set(result);
  }

  private labelFromKey(key: string): string {
    if (key.includes('formatter-input'))  return 'Formatter Input';
    if (key.includes('formatter-output')) return 'Formatter Output';
    if (key.includes('history-'))         return 'Saved snapshot';
    return key.replace(/^json-(history|session)-/, '');
  }

  onRestore(entry: HistoryEntry): void {
    this.restore.emit(entry);
    this.isOpen.set(false);
    this.preview.set(null);
  }

  onDelete(entry: HistoryEntry, e: MouseEvent): void {
    e.stopPropagation();
    localStorage.removeItem(entry.key);
    this.delete.emit(entry.key);
    this.loadHistory();
    if (this.preview()?.key === entry.key) this.preview.set(null);
  }

  clearAll(): void {
    if (!confirm('Clear all history? This cannot be undone.')) return;
    this.entries().forEach(e => localStorage.removeItem(e.key));
    this.entries.set([]);
    this.preview.set(null);
  }

  showPreview(entry: HistoryEntry): void { this.preview.set(entry); }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7)  return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  snippet(content: string): string {
    const t = content.trim().replace(/\s+/g, ' ');
    return t.length > 90 ? t.slice(0, 90) + '…' : t;
  }
}
