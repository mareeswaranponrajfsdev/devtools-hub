import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatterOptions } from '../../models/formatter-options.model';
import { FormatterPreset, FORMATTER_PRESETS } from '../../models/formatter-presets.model';

@Component({
  selector: 'app-format-settings-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './format-settings-chips.html',
  styleUrl: './format-settings-chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormatSettingsChips {
  @Input() options!: FormatterOptions;
  @Input() currentPreset: FormatterPreset = 'default';
  @Output() resetToDefaults = new EventEmitter<void>();
  @Output() applyPreset = new EventEmitter<FormatterPreset>();

  presets = Object.values(FORMATTER_PRESETS);

  getIndentLabel(type: string): string {
    switch (type) {
      case '2spaces': return '2 Spaces';
      case '4spaces': return '4 Spaces';
      case 'tab': return 'Tab';
      default: return '2 Spaces';
    }
  }

  getArrayLabel(type: string): string {
    return type === 'inline' ? 'Inline Arrays' : 'Multi-line Arrays';
  }

  onPresetClick(preset: FormatterPreset): void {
    this.applyPreset.emit(preset);
  }
}
