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

  @Input({ required: true })
  value = '';

  @Output()
  valueChange = new EventEmitter<string>();


  private editor: any;
  private monaco: any;


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

        automaticLayout: false, // IMPORTANT

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

  }


  ngOnChanges(changes: SimpleChanges): void {

    if (!this.editor) return;

    if (
      changes['value'] &&
      this.value !== this.editor.getValue()
    ) {

      // Update value
      this.editor.setValue(this.value || '');

      // Refresh layout (FIX SAMPLE BUG)
      setTimeout(() => {
        this.editor.layout();
      }, 0);

    }

  }


  ngOnDestroy(): void {

    if (this.editor) {
      this.editor.dispose();
    }

  }

}
