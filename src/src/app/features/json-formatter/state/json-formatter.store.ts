import { Injectable, signal, computed } from '@angular/core';
import { JsonEngine } from '../services/json-engine';
import { JsonAutoFix, AutoFixResult } from '../services/json-auto-fix';
import { JsonConverterService, ConversionFormat } from '../services/json-converter.service';
import { FileImportService } from '../services/file-import.service';
import { FormatterOptions, DEFAULT_FORMATTER_OPTIONS } from '../models/formatter-options.model';
import { FormatterPreset, FORMATTER_PRESETS } from '../models/formatter-presets.model';
import { ImportAction } from '../components/import-menu/import-menu';

interface HistoryEntry {
  value: string;
  timestamp: number;
}

const STORAGE_KEY = 'json-formatter-options';
const PRESET_KEY = 'json-formatter-preset';

@Injectable()
export class JsonFormatterStore {

  constructor(
    private engine: JsonEngine,
    private autoFix: JsonAutoFix,
    private converter: JsonConverterService,
    private fileImport: FileImportService
  ) {
    this.loadOptionsFromStorage();
    this.loadPresetFromStorage();
  }

  /* ================= STATE ================= */

  input = signal<string>('');
  output = signal<string>('');
  error = signal<string | null>(null);
  liveMode = signal<boolean>(false);
  treeView = signal<boolean>(false);
  currentConversion = signal<ConversionFormat | null>(null);
  formatterOptions = signal<FormatterOptions>(DEFAULT_FORMATTER_OPTIONS);
  currentPreset = signal<FormatterPreset>('default');
  isProcessing = signal<boolean>(false);

  private history: HistoryEntry[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  canUndo = signal<boolean>(false);
  canRedo = signal<boolean>(false);

  /* ================= COMPUTED ================= */

  charCount = computed(() => this.input().length);

  lineCount = computed(() => {
    if (!this.input()) return 0;
    return this.input().split('\n').length;
  });

  fileSize = computed(() => {
    return (new Blob([this.input()]).size / 1024).toFixed(2);
  });

  /* ================= ACTIONS ================= */

  setInput(value: string, addToHistory = true) {
    this.input.set(value);

    if (addToHistory) {
      this.addToHistory(value);
    }

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

  // -------- Formatter Options --------
  updateOptions(options: FormatterOptions) {
    this.formatterOptions.set(options);
    this.currentPreset.set('custom');
    this.saveOptionsToStorage(options);
    this.savePresetToStorage('custom');
  }

  applyPreset(preset: FormatterPreset) {
    const presetConfig = FORMATTER_PRESETS[preset];
    this.formatterOptions.set({ ...presetConfig.options });
    this.currentPreset.set(preset);
    this.saveOptionsToStorage(presetConfig.options);
    this.savePresetToStorage(preset);
  }

  resetToDefaults() {
    this.applyPreset('default');
  }

  private saveOptionsToStorage(options: FormatterOptions) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch (e) {
      console.error('Failed to save formatter options:', e);
    }
  }

  private savePresetToStorage(preset: FormatterPreset) {
    try {
      localStorage.setItem(PRESET_KEY, preset);
    } catch (e) {
      console.error('Failed to save preset:', e);
    }
  }

  private loadOptionsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const options = JSON.parse(stored);
        this.formatterOptions.set({ ...DEFAULT_FORMATTER_OPTIONS, ...options });
      }
    } catch (e) {
      console.error('Failed to load formatter options:', e);
    }
  }

  private loadPresetFromStorage() {
    try {
      const stored = localStorage.getItem(PRESET_KEY);
      if (stored && stored in FORMATTER_PRESETS) {
        this.currentPreset.set(stored as FormatterPreset);
      }
    } catch (e) {
      console.error('Failed to load preset:', e);
    }
  }

  // -------- Format --------
  format() {
    this.currentConversion.set(null);

    try {
      const result = this.engine.format(this.input(), this.formatterOptions());
      this.output.set(result);
      this.error.set(null);
    } catch (err: any) {
      this.handleError(err);
    }
  }

  // -------- Minify --------
  minify() {
    this.currentConversion.set(null);

    try {
      const result = this.engine.minify(this.input());
      this.output.set(result);
      this.error.set(null);
    } catch (err: any) {
      this.handleError(err);
    }
  }

  // -------- Enhanced Auto Fix --------
  autoFixJson(): void {
    const input = this.input().trim();

    if (!input) {
      this.error.set('Please enter JSON first');
      return;
    }

    this.isProcessing.set(true);

    setTimeout(() => {
      const result: AutoFixResult = this.autoFix.fix(input);

      this.isProcessing.set(false);

      if (result.success) {
        if (result.changes.includes('No fixes needed')) {
          this.error.set('✓ No fixes needed - JSON is already valid');
        } else {
          this.setInput(result.fixed);
          this.format();
          const changesList = result.changes.join(', ');
          this.error.set(`✓ JSON auto-fixed: ${changesList}`);
        }
        this.autoClearMessage();
      } else {
        this.error.set(`✗ Auto-fix failed: ${result.error}`);
      }
    }, 100);
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
    }, 3000);
  }

  // -------- Clear --------
  clear() {
    this.setInput('');
    this.output.set('');
    this.error.set(null);
    this.currentConversion.set(null);
  }

  // -------- Copy Output --------
  copy() {
    if (!this.output()) return;
    navigator.clipboard.writeText(this.output());
  }

  // -------- File Import --------
  async handleImport(action: ImportAction): Promise<void> {
    this.isProcessing.set(true);
    this.error.set('Importing...');

    try {
      let result;

      if (action.type === 'file' && action.file) {
        result = await this.fileImport.importFromFile(action.file);
      } else if (action.type === 'url' && action.url) {
        result = await this.fileImport.importFromUrl({ url: action.url });
      } else if (action.type === 'csv' && action.file) {
        result = await this.fileImport.importFromCsv(action.file);
      } else {
        throw new Error('Invalid import action');
      }

      this.isProcessing.set(false);

      if (result.success && result.data) {
        this.setInput(result.data);
        this.error.set(`✓ Imported from ${result.fileName || 'source'}`);
        
        // Auto-format after successful import
        setTimeout(() => {
          try {
            this.format();
          } catch {
            // If format fails, just leave the raw imported data
          }
        }, 100);

        this.autoClearMessage();
      } else {
        this.error.set(`✗ Import failed: ${result.error}`);
      }
    } catch (error: any) {
      this.isProcessing.set(false);
      this.error.set(`✗ Import error: ${error.message}`);
    }
  }

  /* ================= UNDO/REDO ================= */

  private addToHistory(value: string): void {
    if (this.history[this.historyIndex]?.value === value) {
      return;
    }

    this.history = this.history.slice(0, this.historyIndex + 1);

    this.history.push({
      value,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }

    this.updateUndoRedoState();
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const entry = this.history[this.historyIndex];
      this.input.set(entry.value);
      this.updateUndoRedoState();
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const entry = this.history[this.historyIndex];
      this.input.set(entry.value);
      this.updateUndoRedoState();
    }
  }

  private updateUndoRedoState(): void {
    this.canUndo.set(this.historyIndex > 0);
    this.canRedo.set(this.historyIndex < this.history.length - 1);
  }

  /* ================= CONVERSION ================= */

  convert(format: ConversionFormat | null): void {
    if (format === null) {
      this.currentConversion.set(null);
      this.format();
      return;
    }

    const output = this.output();

    if (!output) {
      this.error.set('Please format JSON first');
      return;
    }

    try {
      let converted = '';

      switch (format) {
        case 'xml':
          converted = this.converter.toXml(output);
          break;
        case 'csv':
          converted = this.converter.toCsv(output);
          break;
        case 'yaml':
          converted = this.converter.toYaml(output);
          break;
      }

      this.output.set(converted);
      this.currentConversion.set(format);
      this.error.set(null);
    } catch (err: any) {
      this.error.set(`Conversion failed: ${err.message}`);
    }
  }

  /* ================= HELPERS ================= */

  private handleError(err: any) {
    const msg = err?.message || 'Invalid JSON';
    this.error.set(msg);
    this.output.set('');
  }
}
