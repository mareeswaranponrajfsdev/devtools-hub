import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  HostListener,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatterOptions, IndentationType, ArrayFormatting } from '../../models/formatter-options.model';

@Component({
  selector: 'app-formatter-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formatter-options.html',
  styleUrl: './formatter-options.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormatterOptionsComponent {
  @Input() options!: FormatterOptions;
  @Output() optionsChange = new EventEmitter<FormatterOptions>();

  isOpen = signal(false);

  constructor(private elementRef: ElementRef) {}

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  updateIndentation(indentation: IndentationType) {
    this.optionsChange.emit({ ...this.options, indentation });
  }

  toggleSortKeys() {
    this.optionsChange.emit({ ...this.options, sortKeys: !this.options.sortKeys });
  }

  updateArrayFormatting(compactArrays: ArrayFormatting) {
    this.optionsChange.emit({ ...this.options, compactArrays });
  }

  getIndentLabel(type: IndentationType): string {
    switch (type) {
      case '2spaces': return '2 Spaces';
      case '4spaces': return '4 Spaces';
      case 'tab': return 'Tab';
    }
  }
}
