import { Component, EventEmitter, Output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SearchOptions {
  query: string;
  caseSensitive: boolean;
}

@Component({
  selector: 'app-json-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './json-search.html',
  styleUrl: './json-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSearchComponent {
  @Output() search = new EventEmitter<SearchOptions>();
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  isOpen = signal(false);
  searchQuery = signal('');
  caseSensitive = signal(false);
  currentMatch = signal(0);
  totalMatches = signal(0);

  open() {
    this.isOpen.set(true);
    setTimeout(() => {
      const input = document.querySelector('.search-input') as HTMLInputElement;
      input?.focus();
    }, 50);
  }

  closeSearch() {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.close.emit();
  }

  onSearchChange() {
    this.search.emit({
      query: this.searchQuery(),
      caseSensitive: this.caseSensitive()
    });
  }

  toggleCaseSensitive() {
    this.caseSensitive.update(v => !v);
    this.onSearchChange();
  }

  goToNext() {
    this.next.emit();
  }

  goToPrevious() {
    this.previous.emit();
  }

  updateMatchInfo(current: number, total: number) {
    this.currentMatch.set(current);
    this.totalMatches.set(total);
  }
}
