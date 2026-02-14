import { Component, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ImportAction {
  type: 'file' | 'url' | 'csv';
  file?: File;
  url?: string;
}

@Component({
  selector: 'app-import-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import-menu.html',
  styleUrl: './import-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportMenu {
  @Output() importAction = new EventEmitter<ImportAction>();

  isOpen = signal(false);
  showUrlDialog = signal(false);
  urlInput = '';
  isLoading = signal(false);

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  toggleMenu() {
    this.isOpen.update(v => !v);
    this.showUrlDialog.set(false);
  }

  closeMenu() {
    this.isOpen.set(false);
    this.showUrlDialog.set(false);
  }

  onFileSelect(event: Event, type: 'file' | 'csv') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.importAction.emit({
        type: type,
        file: input.files[0]
      });
      this.closeMenu();
    }
    input.value = '';
  }

  openUrlDialog() {
    this.showUrlDialog.set(true);
    this.urlInput = '';
    setTimeout(() => {
      const input = document.getElementById('url-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  closeUrlDialog() {
    this.showUrlDialog.set(false);
    this.urlInput = '';
  }

  submitUrl() {
    if (this.urlInput.trim()) {
      this.importAction.emit({
        type: 'url',
        url: this.urlInput.trim()
      });
      this.closeMenu();
      this.closeUrlDialog();
    }
  }

  onUrlKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitUrl();
    } else if (event.key === 'Escape') {
      this.closeUrlDialog();
    }
  }
}
