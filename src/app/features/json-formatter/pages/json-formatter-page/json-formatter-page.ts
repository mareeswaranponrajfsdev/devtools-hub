import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
} from '@angular/core';

import { JsonFormatterStore } from '../../state/json-formatter.store';

import { Editor } from '../../components/editor/editor';
import { Toolbar } from '../../components/toolbar/toolbar';

@Component({
  selector: 'app-json-formatter-page',
  standalone: true,

  imports: [
    Editor,
    Toolbar,
  ],

  providers: [JsonFormatterStore],

  templateUrl: './json-formatter-page.html',
  styleUrl: './json-formatter-page.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFormatterPage implements OnDestroy {

  copied = false;

  private copyTimer: any = null;
  

  constructor(
    public readonly store: JsonFormatterStore,
    private cdr: ChangeDetectorRef   
  ) {}


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
      this.cdr.markForCheck(); // ✅ Force UI update

      // Clear old timer
      if (this.copyTimer) {
        clearTimeout(this.copyTimer);
      }

      // Reset after 3 seconds
      this.copyTimer = setTimeout(() => {

        this.copied = false;
        this.cdr.markForCheck(); // ✅ Update again

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
    this.store.format();

  }



}
