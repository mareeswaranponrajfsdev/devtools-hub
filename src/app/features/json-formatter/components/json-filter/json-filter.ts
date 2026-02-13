import { Component, EventEmitter, Output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOptions } from '../../services/json-filter.service';

@Component({
  selector: 'app-json-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './json-filter.html',
  styleUrl: './json-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFilterComponent {
  @Output() filter = new EventEmitter<FilterOptions>();
  @Output() reset = new EventEmitter<void>();

  isOpen = signal(false);
  keyFilter = signal('');
  valueFilter = signal('');
  caseSensitive = signal(false);
  isActive = signal(false);

  toggle() {
    this.isOpen.update(v => !v);
  }

  close() {
    this.isOpen.set(false);
  }

  applyFilter() {
    if (!this.keyFilter() && !this.valueFilter()) {
      this.resetFilter();
      return;
    }

    this.isActive.set(true);
    this.filter.emit({
      keyFilter: this.keyFilter() || undefined,
      valueFilter: this.valueFilter() || undefined,
      caseSensitive: this.caseSensitive()
    });
    this.close();
  }

  resetFilter() {
    this.keyFilter.set('');
    this.valueFilter.set('');
    this.caseSensitive.set(false);
    this.isActive.set(false);
    this.reset.emit();
    this.close();
  }

  toggleCaseSensitive() {
    this.caseSensitive.update(v => !v);
  }
}
