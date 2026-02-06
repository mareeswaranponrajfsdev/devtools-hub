import { Injectable, signal, computed } from '@angular/core';
import { JsonEngine } from '../services/json-engine';

@Injectable()
export class JsonFormatterStore {

  constructor(private engine: JsonEngine) {}


  /* ================= STATE ================= */

  // Input JSON
  input = signal<string>('');

  // Output JSON
  output = signal<string>('');

  // Error message
  error = signal<string | null>(null);

  // Live validation toggle
  liveMode = signal<boolean>(false);


  /* ================= COMPUTED ================= */

  // Character count
  charCount = computed(() => this.input().length);

  // Line count
  lineCount = computed(() => {
    if (!this.input()) return 0;
    return this.input().split('\n').length;
  });

  // File size (KB)
  fileSize = computed(() => {
    return (new Blob([this.input()]).size / 1024).toFixed(2);
  });


  /* ================= ACTIONS ================= */

  setInput(value: string) {

    this.input.set(value);

    if (this.liveMode()) {
      this.validate();
    }
  }


  toggleLive() {
    this.liveMode.update(v => !v);
  }


  // -------- Format --------
  format() {

    try {

      const result = this.engine.format(this.input());

      this.output.set(result);
      this.error.set(null);

    } catch (err: any) {

      this.handleError(err);

    }

  }


  // -------- Minify --------
  minify() {

    try {

      const result = this.engine.minify(this.input());

      this.output.set(result);
      this.error.set(null);

    } catch (err: any) {

      this.handleError(err);

    }

  }


  // -------- Validate --------
  validate() {

    const res = this.engine.validate(this.input());

    if (res.valid) {

      this.error.set(null);

    } else {

      this.error.set(res.error || 'Invalid JSON');

    }

  }


  // -------- Clear --------
  clear() {

    this.input.set('');
    this.output.set('');
    this.error.set(null);

  }


  // -------- Copy Output --------
  copy() {

    if (!this.output()) return;

    navigator.clipboard.writeText(this.output());

  }


  /* ================= HELPERS ================= */

  private handleError(err: any) {

    const msg = err?.message || 'Invalid JSON';

    this.error.set(msg);

    this.output.set('');

  }

}
