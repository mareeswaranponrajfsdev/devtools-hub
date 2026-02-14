import { Component, WritableSignal, signal, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { ANALYTICS_EVENTS } from '../../../../core/analytics/analytics-events';
import { loadMonaco } from '../../../../core/layout/utils/monaco-loader';

interface DiffResult {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  leftValue?: any;
  rightValue?: any;
}

declare const monaco: any;

@Component({
  selector: 'app-diff-tool',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diff-tool.html',
  styleUrl: './diff-tool.scss'
})
export class DiffToolPage implements AfterViewInit, OnDestroy {
  
  @ViewChild('diffEditorContainer', { static: false }) diffEditorContainer!: ElementRef;
  
  leftJson: WritableSignal<string> = signal('');
  rightJson: WritableSignal<string> = signal('');
  differences: WritableSignal<DiffResult[]> = signal([]);
  error: WritableSignal<string> = signal('');
  copyFeedback: WritableSignal<string> = signal('');
  isProcessing: WritableSignal<boolean> = signal(false);
  leftParsed: any = null;
  rightParsed: any = null;
  
  private diffEditor: any = null;
  private originalModel: any = null;
  private modifiedModel: any = null;
  private monacoLoaded = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private analytics: AnalyticsService 
  ) {}
  
  async ngAfterViewInit() {
    await this.initializeMonaco();
    this.setupResizeObserver();
  }
  
  ngOnDestroy() {
    if (this.diffEditor) {
      this.diffEditor.dispose();
    }
    if (this.originalModel) {
      this.originalModel.dispose();
    }
    if (this.modifiedModel) {
      this.modifiedModel.dispose();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
  
  private setupResizeObserver() {
    if (this.diffEditorContainer?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.diffEditor) {
          this.diffEditor.layout();
        }
      });
      this.resizeObserver.observe(this.diffEditorContainer.nativeElement);
    }
  }
  
  private async initializeMonaco() {
    try {
      await loadMonaco();
      this.monacoLoaded = true;
      
      // Create models for original and modified content
      this.originalModel = monaco.editor.createModel('', 'json');
      this.modifiedModel = monaco.editor.createModel('', 'json');
      
      // Create the diff editor with optimized settings for large files
      this.diffEditor = monaco.editor.createDiffEditor(this.diffEditorContainer.nativeElement, {
        enableSplitViewResizing: true,
        renderSideBySide: true,
        readOnly: false,
        automaticLayout: true,
        fontSize: 14,
        lineHeight: 22,
        minimap: { 
          enabled: true,
          maxColumn: 80,
          renderCharacters: false,
          scale: 1
        },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        lineNumbers: 'on',
        renderWhitespace: 'boundary',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: 12,
          horizontalScrollbarSize: 12,
          useShadows: true
        },
        diffWordWrap: 'on',
        ignoreTrimWhitespace: false,
        renderIndicators: true,
        originalEditable: true,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
        fontLigatures: true,
        padding: { top: 16, bottom: 16 },
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true
        },
        stickyScroll: { enabled: false },
        // Performance optimizations for large files
        maxTokenizationLineLength: 20000,
        largeFileOptimizations: true,
        theme: this.getMonacoTheme()
      });
      
      // Set the models
      this.diffEditor.setModel({
        original: this.originalModel,
        modified: this.modifiedModel
      });
      
      // Add content change listeners with debounce for large files
      let updateTimeout: any;
      this.originalModel.onDidChangeContent(() => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          this.leftJson.set(this.originalModel.getValue());
        }, 300);
      });
      
      this.modifiedModel.onDidChangeContent(() => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          this.rightJson.set(this.modifiedModel.getValue());
        }, 300);
      });
      
      // Sync scrolling between editors
      this.enableScrollSync();
      
      // Listen for theme changes
      this.setupThemeListener();
      
    } catch (error) {
      console.error('Failed to initialize Monaco:', error);
      this.error.set('Failed to load the editor. Please refresh the page.');
    }
  }
  
  private getMonacoTheme(): string {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'vs-dark' : 'vs';
  }
  
  private setupThemeListener() {
    const observer = new MutationObserver(() => {
      if (this.diffEditor) {
        monaco.editor.setTheme(this.getMonacoTheme());
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
  
  private enableScrollSync() {
    if (!this.diffEditor) return;
    
    const originalEditor = this.diffEditor.getOriginalEditor();
    const modifiedEditor = this.diffEditor.getModifiedEditor();
    
    let isScrolling = false;
    
    // Sync scroll from original to modified
    originalEditor.onDidScrollChange((e: any) => {
      if (isScrolling) return;
      isScrolling = true;
      modifiedEditor.setScrollPosition({
        scrollTop: e.scrollTop,
        scrollLeft: e.scrollLeft
      });
      setTimeout(() => { isScrolling = false; }, 10);
    });
    
    // Sync scroll from modified to original
    modifiedEditor.onDidScrollChange((e: any) => {
      if (isScrolling) return;
      isScrolling = true;
      originalEditor.setScrollPosition({
        scrollTop: e.scrollTop,
        scrollLeft: e.scrollLeft
      });
      setTimeout(() => { isScrolling = false; }, 10);
    });
  }
  
  private updateMonacoContent() {
    if (this.monacoLoaded && this.originalModel && this.modifiedModel) {
      // Use pushEditOperations for better performance with large files
      const leftText = this.leftJson();
      const rightText = this.rightJson();
      
      this.originalModel.pushEditOperations(
        [],
        [{
          range: this.originalModel.getFullModelRange(),
          text: leftText
        }],
        () => null
      );
      
      this.modifiedModel.pushEditOperations(
        [],
        [{
          range: this.modifiedModel.getFullModelRange(),
          text: rightText
        }],
        () => null
      );
    }
  }
  
  async compareLists() {
    this.error.set('');
    this.differences.set([]);
    
    if (!this.leftJson().trim() || !this.rightJson().trim()) {
      this.error.set('Please enter JSON in both editors');
      return;
    }
    
    this.isProcessing.set(true);
    
    try {
      // Use setTimeout to prevent UI blocking for large JSON
      await new Promise(resolve => setTimeout(resolve, 10));
      
      this.leftParsed = JSON.parse(this.leftJson());
      this.rightParsed = JSON.parse(this.rightJson());
      
      // Process comparison in chunks for large data
      const diffs = await this.compareObjectsAsync(this.leftParsed, this.rightParsed, '');
      this.differences.set(diffs);

      this.analytics.track(ANALYTICS_EVENTS.JSON_DIFF);
      
    } catch (err) {
      this.error.set('Invalid JSON: ' + (err as Error).message);
    } finally {
      this.isProcessing.set(false);
    }
  }
  
  // Async comparison for large data handling
  private async compareObjectsAsync(left: any, right: any, path: string): Promise<DiffResult[]> {
    const results: DiffResult[] = [];
    const batchSize = 100;
    let processedCount = 0;
    
    if (this.isObject(left) && this.isObject(right)) {
      const allKeys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));
      
      for (let i = 0; i < allKeys.length; i += batchSize) {
        const batch = allKeys.slice(i, i + batchSize);
        
        for (const key of batch) {
          const newPath = path ? `${path}.${key}` : key;
          const leftValue = left[key];
          const rightValue = right[key];
          
          if (!(key in left)) {
            results.push({
              path: newPath,
              type: 'added',
              rightValue: rightValue
            });
          } else if (!(key in right)) {
            results.push({
              path: newPath,
              type: 'removed',
              leftValue: leftValue
            });
          } else if (this.isObject(leftValue) && this.isObject(rightValue)) {
            const nestedDiffs = await this.compareObjectsAsync(leftValue, rightValue, newPath);
            results.push(...nestedDiffs);
          } else if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
            results.push({
              path: newPath,
              type: 'modified',
              leftValue: leftValue,
              rightValue: rightValue
            });
          }
          
          processedCount++;
        }
        
        // Yield to UI thread for large datasets
        if (processedCount % (batchSize * 2) === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } else if (JSON.stringify(left) !== JSON.stringify(right)) {
      results.push({
        path: path || 'root',
        type: 'modified',
        leftValue: left,
        rightValue: right
      });
    }
    
    return results;
  }
  
  private isObject(obj: any): boolean {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }
  
  formatValue(value: any): string {
    if (value === undefined) return '';
    if (value === null) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
  
  getDiffCount(type: 'added' | 'removed' | 'modified'): number {
    return this.differences().filter(d => d.type === type).length;
  }
  
  // Copy Methods
  async copyJSON1() {
    await this.copyToClipboard(this.leftJson(), 'JSON 1 copied to clipboard!');
  }
  
  async copyJSON2() {
    await this.copyToClipboard(this.rightJson(), 'JSON 2 copied to clipboard!');
  }
  
  async copyDifferences() {
    const diffsText = JSON.stringify(this.differences(), null, 2);
    await this.copyToClipboard(diffsText, 'Differences copied to clipboard!');
  }
  
  private async copyToClipboard(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyFeedback(successMessage);
    } catch (err) {
      this.showCopyFeedback('Failed to copy to clipboard');
    }
  }
  
  private showCopyFeedback(message: string) {
    this.copyFeedback.set(message);
    setTimeout(() => {
      this.copyFeedback.set('');
    }, 3000);
  }
  
  // Export Methods
  exportDifferencesJSON() {
    const data = {
      comparison_date: new Date().toISOString(),
      summary: {
        added: this.getDiffCount('added'),
        removed: this.getDiffCount('removed'),
        modified: this.getDiffCount('modified'),
        total: this.differences().length
      },
      differences: this.differences()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadFile(blob, `json-diff-${Date.now()}.json`);
  }
  
  exportDifferencesCSV() {
    const headers = ['Path', 'Status', 'Original Value', 'New Value'];
    const rows = this.differences().map(diff => [
      diff.path,
      diff.type,
      diff.leftValue !== undefined ? this.formatValueForCSV(diff.leftValue) : '',
      diff.rightValue !== undefined ? this.formatValueForCSV(diff.rightValue) : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    this.downloadFile(blob, `json-diff-${Date.now()}.csv`);
  }
  
  exportDifferencesTXT() {
    const content = [
      '='.repeat(80),
      'JSON DIFF COMPARISON REPORT',
      '='.repeat(80),
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'SUMMARY',
      '-'.repeat(80),
      `Added:    ${this.getDiffCount('added')}`,
      `Removed:  ${this.getDiffCount('removed')}`,
      `Modified: ${this.getDiffCount('modified')}`,
      `Total:    ${this.differences().length}`,
      '',
      'DIFFERENCES',
      '-'.repeat(80),
      '',
      ...this.differences().map(diff => {
        const lines = [
          `Path: ${diff.path}`,
          `Status: ${diff.type.toUpperCase()}`
        ];
        
        if (diff.leftValue !== undefined) {
          lines.push(`Original: ${this.formatValueForTXT(diff.leftValue)}`);
        }
        if (diff.rightValue !== undefined) {
          lines.push(`New: ${this.formatValueForTXT(diff.rightValue)}`);
        }
        
        return lines.join('\n') + '\n' + '-'.repeat(80) + '\n';
      })
    ].join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    this.downloadFile(blob, `json-diff-${Date.now()}.txt`);
  }
  
  private formatValueForCSV(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
  
  private formatValueForTXT(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
  
  private downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  loadSample(): void {
    const left = {
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "isActive": true,
      "address": {
        "city": "New York",
        "zip": "10001",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "hobbies": ["reading", "gaming"],
      "metadata": {
        "created": "2024-01-01",
        "updated": "2024-06-01"
      }
    };
    
    const right = {
      "name": "John Doe",
      "age": 31,
      "email": "john.doe@example.com",
      "isActive": true,
      "phone": "+1234567890",
      "address": {
        "city": "Los Angeles",
        "zip": "90001",
        "coordinates": {
          "lat": 34.0522,
          "lng": -118.2437
        }
      },
      "hobbies": ["reading", "traveling", "photography"],
      "metadata": {
        "created": "2024-01-01",
        "updated": "2024-12-01"
      }
    };
    
    this.leftJson.set(JSON.stringify(left, null, 2));
    this.rightJson.set(JSON.stringify(right, null, 2));
    this.updateMonacoContent();
  }
  
  clear(): void {
    this.leftJson.set('');
    this.rightJson.set('');
    this.differences.set([]);
    this.error.set('');
    this.updateMonacoContent();
  }
}
