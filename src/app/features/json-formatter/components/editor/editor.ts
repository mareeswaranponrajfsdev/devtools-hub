import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor {

  @Input({ required: true })
  value = '';

  @Input()
  placeholder = 'Paste your JSON here...';

  @Output()
  valueChange = new EventEmitter<string>();


  onInput(event: Event) {

    const target = event.target as HTMLTextAreaElement;

    this.valueChange.emit(target.value);

  }

}
