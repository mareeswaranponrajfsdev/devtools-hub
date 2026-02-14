import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { JsonFormatterStore } from '../../state/json-formatter.store';
import { Editor } from '../../components/editor/editor';
import { Toolbar } from '../../components/toolbar/toolbar';
import { TreeView } from '../../components/tree-view/tree-view';
import { FormatterOptionsComponent } from '../../components/formatter-options/formatter-options';
import { FormatSettingsChips } from '../../components/format-settings-chips/format-settings-chips';
import { ImportMenu, ImportAction } from '../../components/import-menu/import-menu';
import { JsonSearchComponent } from '../../components/json-search/json-search';
import { SaveMenuComponent, SaveOptions } from '../../components/save-menu/save-menu';
import { TransformModalComponent, TransformResult } from '../../components/transform-modal/transform-modal';
import { CsvExportModalComponent } from '../../components/csv-export-modal/csv-export-modal';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { ANALYTICS_EVENTS } from '../../../../core/analytics/analytics-events';
import { ConversionFormat } from '../../services/json-converter.service';
import { FormatterOptions } from '../../models/formatter-options.model';
import { FormatterPreset } from '../../models/formatter-presets.model';
import { FilterOptions } from '../../services/json-filter.service';
import { SessionStorageService, SessionData } from '../../../../core/services/session-storage.service';
import { LargeFileHandlerService, PerformanceMode } from '../../../../core/services/large-file-handler.service';
import { SessionRestoreComponent } from '../../../../shared/components/session-restore/session-restore.component';
import { PerformanceModeComponent } from '../../../../shared/components/performance-mode/performance-mode.component';
import { SessionHistoryListComponent } from '../../../../shared/components/session-history-list/session-history-list.component';
import { effect } from '@angular/core';

@Component({
  selector: 'app-json-formatter-page',
  standalone: true,
  imports: [
    CommonModule,
    Editor,
    Toolbar,
    TreeView,
    FormatterOptionsComponent,
    FormatSettingsChips,
    ImportMenu,
    JsonSearchComponent,
    SaveMenuComponent,
    TransformModalComponent,
    CsvExportModalComponent,
    SessionRestoreComponent,
    PerformanceModeComponent,
    SessionHistoryListComponent,
  ],
  providers: [JsonFormatterStore],
  templateUrl: './json-formatter-page.html',
  styleUrl: './json-formatter-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFormatterPage implements OnDestroy, OnInit {

  copied = false;
  showCsvModal = signal(false);
  historyRefresh = signal(0);
  private copyTimer: any = null;

  // Session and Performance Mode signals
  savedSession = signal<SessionData | null>(null);
  performanceMode = signal<PerformanceMode | null>(null);

  /** Controls the Convert dropdown open/close state */
  convertOpen = signal(false);

  @ViewChild('inputContainer')  inputContainer!:  ElementRef;
  @ViewChild('outputContainer') outputContainer!: ElementRef;
  @ViewChild('convertDropdownRef') convertDropdownRef!: ElementRef;

  isFullscreenInput  = false;
  isFullscreenOutput = false;

  constructor(
    public readonly store: JsonFormatterStore,
    private cdr: ChangeDetectorRef,
    private analytics: AnalyticsService,
    private elRef: ElementRef,
    private sessionStorage: SessionStorageService,
    private largeFileHandler: LargeFileHandlerService,
  ) {
    // Setup auto-save effect
    effect(() => {
      const input = this.store.input();
      if (input && input.trim()) {
        // Auto-save with debounce
        this.sessionStorage.saveDebounced('json-session-formatter-input', input);
        
        // Check file size for performance mode
        const mode = this.largeFileHandler.checkSize(input);
        this.performanceMode.set(mode);
      }
    });
  }

  ngOnInit(): void {
    // Check for saved session on load
    const saved = this.sessionStorage.load('json-session-formatter-input');
    if (saved) {
      this.savedSession.set(saved);
    }
    
    // Subscribe to performance mode
    this.largeFileHandler.performanceMode$.subscribe(mode => {
      this.performanceMode.set(mode);
    });
    
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreenInput  = document.fullscreenElement === this.inputContainer?.nativeElement;
      this.isFullscreenOutput = document.fullscreenElement === this.outputContainer?.nativeElement;
      this.cdr.markForCheck();
    });

    // Save to history on page unload/reload
    window.addEventListener('beforeunload', () => {
      const input = this.store.input().trim();
      if (input) { this.store.saveJsonToHistory(input, 'Page reload'); }
    });
  }

  ngOnDestroy(): void {
    if (this.copyTimer) clearTimeout(this.copyTimer);
  }

  /* ── FULLSCREEN ── */
  toggleFullscreenInput(): void {
    if (!this.isFullscreenInput) this.inputContainer.nativeElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  toggleFullscreenOutput(): void {
    if (!this.isFullscreenOutput) this.outputContainer.nativeElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  /* ── CONVERT DROPDOWN ── */
  toggleConvert(): void { this.convertOpen.update(v => !v); }
  closeConvert():  void { this.convertOpen.set(false); }

  onConvert(format: ConversionFormat | null): void {
    this.closeConvert();
    this.store.convert(format);
    if (format) this.analytics.track(`json_convert_${format}`);
  }

  /** Close dropdown when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.convertOpen()) {
      const dropdown = this.elRef.nativeElement.querySelector('.convert-dropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        this.closeConvert();
      }
    }
  }

  /* ── KEYBOARD SHORTCUTS ── */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(e: KeyboardEvent): void {
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault(); if (this.store.canUndo()) this.onUndo();
    }
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault(); if (this.store.canRedo()) this.onRedo();
    }
    if (e.key === 'Escape') {
      this.closeConvert();
      if (this.store.showTransform()) this.store.closeTransform();
    }
  }

  /* ── UNDO/REDO ── */
  onUndo(): void { this.store.undo(); this.analytics.track(ANALYTICS_EVENTS.JSON_UNDO); }
  onRedo(): void { this.store.redo(); this.analytics.track(ANALYTICS_EVENTS.JSON_REDO); }

  /* ── PRINT ── */
  printInput(): void {
    const content = this.store.input();
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>JSON Print</title><style>
      body{font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;padding:20px;white-space:pre-wrap;word-wrap:break-word;}
    </style></head><body>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
    this.analytics.track(ANALYTICS_EVENTS.JSON_PRINT);
  }

  /* ── TRANSFORM MODAL ── */
  openTransform():  void { this.store.openTransform(); }
  closeTransform(): void { this.store.closeTransform(); }
  onTransformApply(result: TransformResult): void {
    this.store.applyTransform(result.result);
    this.analytics.track('json_transform');
  }

  /* ── OPTIONS ── */
  onOptionsChange(options: FormatterOptions): void { this.store.updateOptions(options); }
  onPresetApplied(preset: FormatterPreset): void   { this.store.applyPreset(preset); }
  onResetSettings(): void                           { this.store.resetToDefaults(); }

  /* ── IMPORT ── */
  async onImport(action: ImportAction): Promise<void> {
    await this.store.handleImport(action);
    this.historyRefresh.set(this.historyRefresh() + 1);
    this.cdr.markForCheck();
  }

  /* ── COPY ── */
  copyOutput(): void {
    const text = this.store.output();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true; this.cdr.markForCheck();
      clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => { this.copied = false; this.cdr.markForCheck(); }, 2000);
  this.showCsvModal = signal(false);
    }).catch(() => alert('Copy failed. Please copy manually.'));
  }

  /* ── DOWNLOAD ── */
  downloadJson(): void {
    const t = this.store.output(); if (!t) return;
    this.doDownload(new Blob([t], { type: 'application/json' }), 'formatted.json');
  }
  downloadTxt(): void {
    const t = this.store.output(); if (!t) return;
    this.doDownload(new Blob([t], { type: 'text/plain' }), 'formatted.txt');
  }
  private doDownload(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement('a'), { href: url, download: name });
    a.click(); URL.revokeObjectURL(url);
  }

  /* ── SAVE MENU ── */
  onSave(options: SaveOptions): void {
    if (options.action === 'disk') {
      const r = this.store.exportToDisk();
      this.store.setMessage(r.success ? `✓ ${r.message}` : `✗ ${r.message}`);
    } else if (options.action === 'csv') {
      this.showCsvModal.set(true);  // Open CSV export modal
    } else if (options.action === 'url' && options.url) {
      this.store.sendToUrl(options.url);
    } else if (options.action === 'cloud') {
      this.store.saveToCloud(options.cloudKey);
    }
  }

  /* ── LEGACY FILTER ── */
  onFilter(filterOptions: FilterOptions): void { this.store.applyFilter(filterOptions); }
  onResetFilter(): void                         { this.store.resetFilter(); }

  /* ── SESSION RESTORE ── */
  onRestoreSession(): void {
    const saved = this.savedSession();
    if (saved) {
      this.store.setInput(saved.content);
      this.savedSession.set(null);
      this.analytics.track(ANALYTICS_EVENTS.JSON_FORMAT);
    }
  }

  onDiscardSession(): void {
    this.sessionStorage.remove('json-session-formatter-input');
    this.savedSession.set(null);
  }

  onHistoryRestore(data: any): void {
    if (data && data.content) {
      this.store.setInput(data.content);
      this.analytics.track(ANALYTICS_EVENTS.JSON_FORMAT);
    }
  }

  /* ── TOOLBAR ACTIONS ── */
  onFormat(): void { this.store.format(); this.analytics.track(ANALYTICS_EVENTS.JSON_FORMAT); }
  onMinify(): void { this.store.minify(); this.analytics.track(ANALYTICS_EVENTS.JSON_MINIFY); }
  
  onValidate(): void {
    this.store.validate();
    this.historyRefresh.set(this.historyRefresh() + 1);
  }

  onClear(): void {
    this.store.clear();
    this.largeFileHandler.disablePerformanceMode();
    this.performanceMode.set(null);
    // Refresh history panel after clear saves to history
    this.historyRefresh.set(this.historyRefresh() + 1);
  }

  loadSample(): void {
    this.store.setInput(`{
  "requestId": "REQ-10001",
  "status": "success",
  "timestamp": "2026-02-06T12:00:00Z",
  "data": {
    "users": [
      { "id": 1, "username": "alice", "email": "alice@example.com", "active": true, "role": "admin" },
      { "id": 2, "username": "bob",   "email": "bob@example.com",   "active": false, "role": "user" },
      { "id": 3, "username": "carol", "email": "carol@example.com", "active": true,  "role": "user" }
    ],
    "profile": { "role": "User", "department": "Engineering", "location": "India" },
    "settings": { "notifications": true, "theme": "light", "language": "en" }
  },
  "meta": { "version": "1.0", "source": "api", "responseTimeMs": 95 }
}`);
    this.onFormat();
  }
}
