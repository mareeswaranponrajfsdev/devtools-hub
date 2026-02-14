import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceMode } from '../../../core/services/large-file-handler.service';

@Component({
  selector: 'app-performance-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance-mode.component.html',
  styleUrl: './performance-mode.component.scss'
})
export class PerformanceModeComponent {
  
  @Input() set mode(value: PerformanceMode | null) {
    if (value && value.isActive) {
      this._mode = value;
      this.isVisible.set(true);
    } else {
      this.isVisible.set(false);
    }
  }
  
  _mode: PerformanceMode | null = null;
  isVisible = signal(false);
  
  close(): void {
    this.isVisible.set(false);
  }
  
  getFormattedSize(mb: number): string {
    return mb.toFixed(2) + ' MB';
  }
}
