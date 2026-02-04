import { Injectable, signal, computed } from '@angular/core';
import { JsonFormatterService } from '../data-access/json-formatter.service';

@Injectable({
  providedIn: 'root'
})
export class JsonFormatterStore {

  /* ================= STATE ================= */

  private readonly inputSignal = signal('');
  private readonly outputSignal = signal('');
  private readonly errorSignal = signal<string | null>(null);

  /* ================= DERIVED ================= */

  readonly isValid = computed(() => this.errorSignal() === null);

  /* ================= SELECTORS ================= */

  readonly input = this.inputSignal.asReadonly();
  readonly output = this.outputSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /* ================= CONSTRUCTOR ================= */

  constructor(
    private readonly service: JsonFormatterService
  ) {
    this.loadFromStorage();
  }

  /* ================= ACTIONS ================= */

  setInput(value: string): void {
    this.inputSignal.set(value);
    this.save();
  }

  format(): void {
    this.execute(() =>
      this.service.format(this.inputSignal())
    );
  }

  minify(): void {
    this.execute(() =>
      this.service.minify(this.inputSignal())
    );
  }

  validate(): void {
    try {
      this.service.validate(this.inputSignal());
      this.errorSignal.set(null);

    } catch (e: any) {
      this.errorSignal.set(e.message);
    }
  }

  clear(): void {
    this.inputSignal.set('');
    this.outputSignal.set('');
    this.errorSignal.set(null);

    localStorage.removeItem('json_data');
  }

  /* ================= STORAGE ================= */

  private save(): void {
    localStorage.setItem(
      'json_data',
      this.inputSignal()
    );
  }

  private loadFromStorage(): void {

    const saved = localStorage.getItem('json_data');

    if (saved) {
      this.inputSignal.set(saved);
    }
  }

  /* ================= INTERNAL ================= */

  private execute(fn: () => string): void {

    try {

      const result = fn();

      this.outputSignal.set(result);

      this.errorSignal.set(null);

      this.save();

    } catch (e: any) {

      this.outputSignal.set('');

      this.errorSignal.set(e.message);
    }
  }
}
