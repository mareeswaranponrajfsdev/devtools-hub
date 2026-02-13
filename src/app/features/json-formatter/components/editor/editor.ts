import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import loader from '@monaco-editor/loader';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('container', { static: true })
  container!: ElementRef<HTMLDivElement>;

  @Input({ required: true }) value = '';
  @Input() placeholder = '';

  @Output() valueChange = new EventEmitter<string>();

  private editor: any;
  private monaco: any;
  private resizeObserver?: ResizeObserver;

  isDragging = signal(false);

  async ngAfterViewInit(): Promise<void> {
    this.monaco = await loader.init();

    this.editor = this.monaco.editor.create(
      this.container.nativeElement,
      {
        value: this.value || '',
        language: 'json',
        theme: 'vs-light',
        automaticLayout: true,
        folding: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        formatOnPaste: true,
        formatOnType: true,
      }
    );

    this.editor.onDidChangeModelContent(() => {
      this.valueChange.emit(this.editor.getValue());
    });

    setTimeout(() => this.editor.layout(), 0);

    document.addEventListener('fullscreenchange', () => {
      setTimeout(() => { if (this.editor) this.editor.layout(); }, 100);
    });

    this.resizeObserver = new ResizeObserver(() => {
      if (this.editor) this.editor.layout();
    });
    this.resizeObserver.observe(this.container.nativeElement);

    this.setupDragAndDrop();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.editor) return;
    if (changes['value'] && this.value !== this.editor.getValue()) {
      this.editor.setValue(this.value || '');
      setTimeout(() => this.editor.layout(), 0);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.editor?.dispose();
  }

  private setupDragAndDrop(): void {
    const elem = this.container.nativeElement;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      elem.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });

    elem.addEventListener('dragenter', () => this.isDragging.set(true));

    elem.addEventListener('dragleave', (e) => {
      if (e.target === elem) this.isDragging.set(false);
    });

    elem.addEventListener('drop', (e: any) => {
      this.isDragging.set(false);
      const files = e.dataTransfer?.files;
      if (files?.length > 0) this.handleFile(files[0]);
    });
  }

  private handleFile(file: File): void {
    if (!file.name.endsWith('.json')) { alert('Please drop a .json file'); return; }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      this.valueChange.emit(content);
      if (this.editor) this.editor.setValue(content);
    };
    reader.onerror = () => alert('Failed to read file');
    reader.readAsText(file);
  }
}
