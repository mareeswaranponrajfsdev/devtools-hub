import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-editor.html',
  styleUrls: ['./json-editor.scss']
})
export class JsonEditor {

  @Input({ required: true }) label!: string;

  @Input() value = '';

  @Input() readonly = false;

  @Input() isValid = true;

  @Input() error: string | null = null;

  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event): void {

    if (this.readonly) return;

    const val =
      (event.target as HTMLTextAreaElement).value;

    this.valueChange.emit(val);
  }
}
