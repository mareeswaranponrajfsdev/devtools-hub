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
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { ANALYTICS_EVENTS } from '../../../../core/analytics/analytics-events';
import { ConversionFormat } from '../../services/json-converter.service';

@Component({
  selector: 'app-json-formatter-page',
  standalone: true,

  imports: [
    Editor,
    Toolbar,
    TreeView,
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
  @ViewChild('fileInput') fileInput!: ElementRef;

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


  /* ===============================
     FULLSCREEN - INPUT
  =============================== */

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


  /* ===============================
     FULLSCREEN - OUTPUT
  =============================== */

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


  /* ===============================
     FILE UPLOAD
  =============================== */

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.name.endsWith('.json')) {
        this.store.error.set('Please upload a .json file');
        setTimeout(() => this.store.error.set(null), 2000);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e: any) => {
        const content = e.target.result;

        try {
          // Validate JSON
          JSON.parse(content);
          this.store.setInput(content);
          this.analytics.track(ANALYTICS_EVENTS.JSON_FILE_UPLOAD);
        } catch (err: any) {
          this.store.error.set('Invalid JSON file: ' + err.message);
          setTimeout(() => this.store.error.set(null), 3000);
        }
      };

      reader.onerror = () => {
        this.store.error.set('Failed to read file');
        setTimeout(() => this.store.error.set(null), 2000);
      };

      reader.readAsText(file);
    }

    // Reset input
    input.value = '';
  }


  /* ===============================
     UNDO / REDO
  =============================== */

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
    
    // Ctrl+Z - Undo
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      if (this.store.canUndo()) {
        this.onUndo();
      }
    }

    // Ctrl+Y or Ctrl+Shift+Z - Redo
    if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
      event.preventDefault();
      if (this.store.canRedo()) {
        this.onRedo();
      }
    }

  }


  /* ===============================
     PRINT INPUT
  =============================== */

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


  /* ===============================
     CONVERSION
  =============================== */

  onConvert(format: ConversionFormat | null): void {
    this.store.convert(format);
    
    if (format) {
      this.analytics.track(`json_convert_${format}`);
    }
  }


  /* ===============================
     COPY
  =============================== */

  copyOutput(): void {

    const text = this.store.output();

    if (!text) {
      return;
    }

    navigator.clipboard.writeText(text).then(() => {

      // Set copied = true
      this.copied = true;
      this.cdr.markForCheck();

      // Clear old timer
      if (this.copyTimer) {
        clearTimeout(this.copyTimer);
      }

      // Reset after 2 seconds
      this.copyTimer = setTimeout(() => {

        this.copied = false;
        this.cdr.markForCheck();

      }, 2000);

    }).catch(() => {

      alert('Copy failed. Please copy manually.');

    });

  }


  /* ===============================
     DOWNLOAD JSON
  =============================== */

  downloadJson(): void {

    const text = this.store.output();

    if (!text) return;

    const blob = new Blob([text], {
      type: 'application/json',
    });

    this.downloadFile(blob, 'formatted.json');

  }


  /* ===============================
     DOWNLOAD TXT
  =============================== */

  downloadTxt(): void {

    const text = this.store.output();

    if (!text) return;

    const blob = new Blob([text], {
      type: 'text/plain',
    });

    this.downloadFile(blob, 'formatted.txt');

  }


  /* ===============================
     COMMON DOWNLOAD
  =============================== */

  private downloadFile(blob: Blob, fileName: string): void {

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;
    a.download = fileName;

    a.click();

    URL.revokeObjectURL(url);

  }


  /* ===============================
     CLEANUP
  =============================== */

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

    // Auto format
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
