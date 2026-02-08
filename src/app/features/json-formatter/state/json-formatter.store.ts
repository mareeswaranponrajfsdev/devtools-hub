import { Injectable, signal, computed } from '@angular/core';
import { JsonEngine } from '../services/json-engine';
import { JsonAutoFix } from '../services/json-auto-fix';

@Injectable()
export class JsonFormatterStore {

  constructor(
    private engine: JsonEngine,
    private autoFix: JsonAutoFix
  ) {}


  /* ================= STATE ================= */

  // Input JSON
  input = signal<string>('');

  // Output JSON
  output = signal<string>('');

  // Error message
  error = signal<string | null>(null);

  // Live validation toggle
  liveMode = signal<boolean>(false);

  // Tree view toggle
  treeView = signal<boolean>(false);


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


  toggleTreeView() {
    this.treeView.update(v => !v);
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


  // -------- Auto Fix --------
  autoFixJson(): void {

    const input = this.input().trim();

    if (!input) {
      this.error.set('Please enter JSON first');
      return;
    }

    try {

      // Apply auto-fix
      const fixed = this.autoFix.fix(input);

      // Validate it works
      JSON.parse(fixed);

      // Update input with fixed version
      this.input.set(fixed);

      // Format the output
      this.format();

      this.error.set('JSON auto-fixed successfully!');

      this.autoClearMessage();

    } catch (err: any) {

      this.error.set('Could not auto-fix JSON: ' + err.message);

    }

  }


  // -------- Validate --------
  validate(): void {

    const input = this.input().trim();

    if (!input) {
      this.error.set('Please enter JSON first');
      return;
    }

    try {

      JSON.parse(input);

      this.error.set('JSON is Valid');

      this.autoClearMessage();

    } catch (err: any) {

      this.error.set('Invalid JSON: ' + err.message);

    }

  }

  private autoClearMessage(): void {

    setTimeout(() => {
      this.error.set(null);
    }, 2000);

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
