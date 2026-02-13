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
export class Editor
  implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('container', { static: true })
  container!: ElementRef<HTMLDivElement>;

  @ViewChild('fileInput', { static: true })
  fileInput!: ElementRef<HTMLInputElement>;

  @Input({ required: true })
  value = '';

  @Input()
  placeholder = '';

  @Output()
  valueChange = new EventEmitter<string>();


  private editor: any;
  private monaco: any;
  private resizeObserver?: ResizeObserver;

  isDragging = signal(false);


  async ngAfterViewInit(): Promise<void> {

    // Load Monaco
    this.monaco = await loader.init();

    // Create editor
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


    // Emit changes
    this.editor.onDidChangeModelContent(() => {

      const val = this.editor.getValue();

      this.valueChange.emit(val);

    });


    // Initial layout fix
    setTimeout(() => {
      this.editor.layout();
    }, 0);


    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      setTimeout(() => {
        if (this.editor) {
          this.editor.layout();
        }
      }, 100);
    });


    // ResizeObserver for automatic layout
    this.resizeObserver = new ResizeObserver(() => {
      if (this.editor) {
        this.editor.layout();
      }
    });

    this.resizeObserver.observe(this.container.nativeElement);


    // Setup drag & drop
    this.setupDragAndDrop();

  }


  ngOnChanges(changes: SimpleChanges): void {

    if (!this.editor) return;

    if (
      changes['value'] &&
      this.value !== this.editor.getValue()
    ) {

      // Update value
      this.editor.setValue(this.value || '');

      // Refresh layout
      setTimeout(() => {
        this.editor.layout();
      }, 0);

    }

  }


  ngOnDestroy(): void {

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.editor) {
      this.editor.dispose();
    }

  }


  /* ===============================
     DRAG & DROP
  =============================== */

  private setupDragAndDrop(): void {

    const elem = this.container.nativeElement;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      elem.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Highlight on drag enter
    elem.addEventListener('dragenter', () => {
      this.isDragging.set(true);
    });

    // Remove highlight on drag leave
    elem.addEventListener('dragleave', (e) => {
      if (e.target === elem) {
        this.isDragging.set(false);
      }
    });

    // Handle drop
    elem.addEventListener('drop', (e: any) => {
      this.isDragging.set(false);

      const files = e.dataTransfer?.files;

      if (files && files.length > 0) {
        this.handleFile(files[0]);
      }
    });

  }


  /* ===============================
     FILE UPLOAD
  =============================== */

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }


  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }

    // Reset input
    input.value = '';

  }


  private handleFile(file: File): void {

    // Check if JSON file
    if (!file.name.endsWith('.json')) {
      alert('Please upload a .json file');
      return;
    }

    // Read file
    const reader = new FileReader();

    reader.onload = (e: any) => {

      const content = e.target.result;

      this.valueChange.emit(content);

      if (this.editor) {
        this.editor.setValue(content);
      }

    };

    reader.onerror = () => {
      alert('Failed to read file');
    };

    reader.readAsText(file);

  }

}
