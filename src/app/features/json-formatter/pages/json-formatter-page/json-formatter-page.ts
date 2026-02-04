import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JsonFormatterStore } from '../../state/json-formatter.store';
import { JsonEditor } from '../../components/json-editor/json-editor';
import { JsonToolbar } from '../../components/json-toolbar/json-toolbar';

@Component({
  selector: 'app-json-formatter-page',
  standalone: true,
  imports: [
    CommonModule,
    JsonEditor,
    JsonToolbar
  ],
  templateUrl: './json-formatter-page.html'
})
export class JsonFormatterPage {

  // Inject store
  readonly store = inject(JsonFormatterStore);

  /* ================= COPY ================= */

  copy(): void {
    navigator.clipboard.writeText(
      this.store.output()
    );
  }

  /* ================= DOWNLOAD ================= */

  download(): void {

    if (!this.store.output()) return;

    const blob = new Blob(
      [this.store.output()],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted.json';
    link.click();

    URL.revokeObjectURL(url);
  }
}
