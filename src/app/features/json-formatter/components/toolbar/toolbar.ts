import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatterOptions, IndentationType, ArrayFormatting } from '../../models/formatter-options.model';
import { FormatterOptionsComponent } from '../formatter-options/formatter-options';

@Component({
  selector: 'app-json-toolbar',
  standalone: true,
  imports: [CommonModule, FormatterOptionsComponent],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {

  @Input() live = false;
  @Input() disabled = false;
  @Input() treeView = false;
  @Input() formatterOptions!: FormatterOptions;

  @Output() format        = new EventEmitter<void>();
  @Output() minify        = new EventEmitter<void>();
  @Output() validate      = new EventEmitter<void>();
  @Output() clear         = new EventEmitter<void>();
  @Output() copy          = new EventEmitter<void>();
  @Output() toggleLive    = new EventEmitter<void>();
  @Output() toggleTree    = new EventEmitter<void>();
  @Output() sample        = new EventEmitter<void>();
  @Output() autoFix       = new EventEmitter<void>();
  @Output() optionsChange = new EventEmitter<FormatterOptions>();

  changeIndent(value: IndentationType): void {
    this.optionsChange.emit({ ...this.formatterOptions, indentation: value });
  }

  toggleSort(): void {
    this.optionsChange.emit({ ...this.formatterOptions, sortKeys: !this.formatterOptions.sortKeys });
  }

  changeArrayFmt(value: ArrayFormatting): void {
    this.optionsChange.emit({ ...this.formatterOptions, compactArrays: value });
  }
}
