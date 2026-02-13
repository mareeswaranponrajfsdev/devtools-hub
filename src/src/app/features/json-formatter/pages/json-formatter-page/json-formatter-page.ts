import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { JsonFormatterStore } from '../../state/json-formatter.store';
import { Editor } from '../../components/editor/editor';
import { Toolbar } from '../../components/toolbar/toolbar';
import { TreeView } from '../../components/tree-view/tree-view';
import { FormatterOptionsComponent } from '../../components/formatter-options/formatter-options';
import { FormatSettingsChips } from '../../components/format-settings-chips/format-settings-chips';
import { ImportMenu, ImportAction } from '../../components/import-menu/import-menu';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { ANALYTICS_EVENTS } from '../../../../core/analytics/analytics-events';
import { ConversionFormat } from '../../services/json-converter.service';
import { FormatterOptions } from '../../models/formatter-options.model';
import { FormatterPreset } from '../../models/formatter-presets.model';

@Component({
  selector: 'app-json-formatter-page',
  standalone: true,

  imports: [
    Editor,
    Toolbar,
    TreeView,
    FormatterOptionsComponent,
    FormatSettingsChips,
    ImportMenu,
    CommonModule 
  ],

  providers: [JsonFormatterStore],

  templateUrl: './json-formatter-page.html',
  styleUrl: './json-formatter-page.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFormatterPage implements OnDestroy, OnInit {

  copied = false;
  private copyTimer: any = null;

  @ViewChild('inputContainer') inputContainer!: ElementRef;
  @ViewChild('outputContainer') outputContainer!: ElementRef;

  isFullscreenInput = false;
  isFullscreenOutput = false;

  constructor(
    public readonly store: JsonFormatterStore,
    private cdr: ChangeDetectorRef,
    private analytics: AnalyticsService 
  ) {}

  ngOnInit() {
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreenInput = document.fullscreenElement === this.inputContainer?.nativeElement;
      this.isFullscreenOutput = document.fullscreenElement === this.outputContainer?.nativeElement;
      this.cdr.markForCheck();
    });
  }

  toggleFullscreenInput() {
    const elem = this.inputContainer.nativeElement;

    if (!this.isFullscreenInput) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  toggleFullscreenOutput() {
    const elem = this.outputContainer.nativeElement;

    if (!this.isFullscreenOutput) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  onUndo(): void {
    this.store.undo();
    this.analytics.track(ANALYTICS_EVENTS.JSON_UNDO);
  }

  onRedo(): void {
    this.store.redo();
    this.analytics.track(ANALYTICS_EVENTS.JSON_REDO);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      if (this.store.canUndo()) {
        this.onUndo();
      }
    }

    if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
      event.preventDefault();
      if (this.store.canRedo()) {
        this.onRedo();
      }
    }
  }

  printInput(): void {
    const content = this.store.input();

    if (!content) return;

    const printWindow = window.open('', '_blank');
    
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>JSON Print</title>
          <style>
            body {
              font-family: 'JetBrains Mono', 'Fira Code', monospace;
              font-size: 12px;
              line-height: 1.6;
              padding: 20px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    this.analytics.track(ANALYTICS_EVENTS.JSON_PRINT);
  }

  onConvert(format: ConversionFormat | null): void {
    this.store.convert(format);
    
    if (format) {
      this.analytics.track(`json_convert_${format}`);
    }
  }

  onOptionsChange(options: FormatterOptions): void {
    this.store.updateOptions(options);
  }

  onPresetApplied(preset: FormatterPreset): void {
    this.store.applyPreset(preset);
  }

  onResetSettings(): void {
    this.store.resetToDefaults();
  }

  async onImport(action: ImportAction): Promise<void> {
    await this.store.handleImport(action);
    this.cdr.markForCheck();
  }

  copyOutput(): void {
    const text = this.store.output();

    if (!text) {
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      this.cdr.markForCheck();

      if (this.copyTimer) {
        clearTimeout(this.copyTimer);
      }

      this.copyTimer = setTimeout(() => {
        this.copied = false;
        this.cdr.markForCheck();
      }, 2000);
    }).catch(() => {
      alert('Copy failed. Please copy manually.');
    });
  }

  downloadJson(): void {
    const text = this.store.output();

    if (!text) return;

    const blob = new Blob([text], {
      type: 'application/json',
    });

    this.downloadFile(blob, 'formatted.json');
  }

  downloadTxt(): void {
    const text = this.store.output();

    if (!text) return;

    const blob = new Blob([text], {
      type: 'text/plain',
    });

    this.downloadFile(blob, 'formatted.txt');
  }

  private downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void {
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
    }
  }

  loadSample(): void {
    const sampleJson = `{
  "requestId": "REQ-10001",
  "status": "success",
  "timestamp": "2026-02-06T12:00:00Z",
  "data": {
    "user": {
      "id": 1,
      "username": "test",
      "email": "test@example.com",
      "mobile": "+91-9000000000",
      "active": true
    },
    "profile": {
      "role": "User",
      "department": "Engineering",
      "location": "India"
    },
    "settings": {
      "notifications": true,
      "theme": "light",
      "language": "en"
    }
  },
  "meta": {
    "version": "1.0",
    "source": "api",
    "responseTimeMs": 95
  }
}`;

    this.store.setInput(sampleJson);
    this.onFormat();
  }

  onFormat(): void {
    this.store.format();
    this.analytics.track(ANALYTICS_EVENTS.JSON_FORMAT);
  }

  onMinify(): void {
    this.store.minify();
    this.analytics.track(ANALYTICS_EVENTS.JSON_MINIFY);
  }
}
