import {
  ChangeDetectionStrategy,
  Input,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type SaveAction = 'disk' | 'cloud' | 'csv' | 'url';
export interface SaveOptions { action: SaveAction; url?: string; cloudKey?: string; }
type Panel = 'menu' | 'url' | 'cloud';

@Component({
  selector: 'app-save-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './save-menu.html',
  styleUrl: './save-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveMenuComponent {

  @Input() disabled = false;
  @Output() save = new EventEmitter<SaveOptions>();

  isOpen    = signal(false);
  panel     = signal<Panel>('menu');
  isLoading = signal(false);
  urlValue  = signal('');
  cloudKey  = signal('');

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) this.close();
  }

  toggle(): void { this.isOpen() ? this.close() : (this.isOpen.set(true), this.panel.set('menu')); }
  close():  void { this.isOpen.set(false); this.panel.set('menu'); this.urlValue.set(''); this.cloudKey.set(''); this.isLoading.set(false); }

  onDisk(): void { this.save.emit({ action: 'disk' }); this.close(); }
  onCsv():  void { this.save.emit({ action: 'csv'  }); this.close(); }

  showUrl():   void { this.panel.set('url');   }
  showCloud(): void { this.panel.set('cloud'); }
  back():      void { this.panel.set('menu');  this.isLoading.set(false); }

  submitUrl(): void {
    const url = this.urlValue().trim();
    if (!url) return;
    this.isLoading.set(true);
    this.save.emit({ action: 'url', url });
    setTimeout(() => { this.isLoading.set(false); this.close(); }, 3000);
  }

  submitCloud(): void {
    this.isLoading.set(true);
    this.save.emit({ action: 'cloud', cloudKey: this.cloudKey().trim() || undefined });
    setTimeout(() => { this.isLoading.set(false); this.close(); }, 3500);
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close();
    if (e.key === 'Enter') {
      if (this.panel() === 'url')   this.submitUrl();
      if (this.panel() === 'cloud') this.submitCloud();
    }
  }
}
