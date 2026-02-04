import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JsonFormatterStore } from '../../state/json-formatter.store';

import { JsonEditor } from '../../components/json-editor/json-editor';
import { JsonToolbar } from '../../components/json-toolbar/json-toolbar';

@Component({
  selector: 'app-json-tools',
  standalone: true,
  imports: [
    CommonModule,
    JsonEditor,
    JsonToolbar
  ],
  templateUrl: './json-tools.html',
  styleUrls: ['./json-tools.scss']
})
export class JsonTools {

  readonly store = inject(JsonFormatterStore);

  isValid = this.store.isValid;
  error = this.store.error;

  format() {
    this.store.format();
  }

  minify() {
    this.store.minify();
  }

  validate() {
    this.store.validate();
  }

  clear() {
    this.store.clear();
  }

  copy() {
    navigator.clipboard.writeText(this.store.output());
  }

  download() {

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

