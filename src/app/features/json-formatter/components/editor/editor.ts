import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor implements OnChanges {

  @Input({ required: true })
  value = '';

  @Input()
  placeholder = 'Paste your JSON here...';

  @Output()
  valueChange = new EventEmitter<string>();


  lineNumbers: number[] = [1];


  ngOnChanges(changes: SimpleChanges): void {

    if (changes['value']) {
      this.updateLineNumbers(this.value);
    }

  }


  onInput(event: Event): void {

    const textarea = event.target as HTMLTextAreaElement;

    const val = textarea.value;

    this.updateLineNumbers(val);

    this.valueChange.emit(val);

  }


  private updateLineNumbers(text: string): void {

    const count = text.split('\n').length || 1;

    this.lineNumbers = Array.from(
      { length: count },
      (_, i) => i + 1
    );

  }


  syncScroll(
    textarea: HTMLTextAreaElement,
    lines: HTMLElement
  ): void {

    lines.scrollTop = textarea.scrollTop;

  }

}
