import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionData } from '../../../core/services/session-storage.service';

@Component({
  selector: 'app-session-restore',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-restore.component.html',
  styleUrl: './session-restore.component.scss'
})
export class SessionRestoreComponent {
  
  @Input() sessionData: SessionData | null = null;
  @Input() title: string = 'Previous Session Found';
  
  @Output() restore = new EventEmitter<void>();
  @Output() discard = new EventEmitter<void>();
  
  isVisible = signal(true);
  
  onRestore(): void {
    this.restore.emit();
    this.isVisible.set(false);
  }
  
  onDiscard(): void {
    this.discard.emit();
    this.isVisible.set(false);
  }
  
  getFormattedSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  
  getFormattedTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Yesterday';
  }
}
