import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JmespathService } from '../../services/jmespath.service';

export interface TransformResult {
  query: string;
  result: string;
}

@Component({
  selector: 'app-transform-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transform-modal.html',
  styleUrl: './transform-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransformModalComponent implements OnChanges {

  @Input() isOpen = false;
  /** The JSON to query against — pass store.output() so it works on formatted output */
  @Input() jsonSource = '';

  @Output() apply = new EventEmitter<TransformResult>();
  @Output() closed = new EventEmitter<void>();

  query         = signal('');
  previewResult = signal('');
  previewError  = signal('');
  isValid       = signal(false);

  readonly EXAMPLES = [
    { label: 'All keys',          query: 'keys(@)' },
    { label: 'First item [0]',    query: '[0]' },
    { label: 'Array length',      query: 'length(@)' },
    { label: 'Filter active',     query: '[?active==`true`]' },
    { label: 'Select fields',     query: '[].{id: id, name: username}' },
    { label: 'Drill into data',   query: 'data.user' },
    { label: 'Sort by id',        query: 'sort_by(@, &id)' },
    { label: 'Object values',     query: 'values(@)' },
  ];

  constructor(private jmespath: JmespathService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.query.set('');
      this.previewResult.set('');
      this.previewError.set('');
      this.isValid.set(false);
    }
  }

  onQueryInput(value: string): void {
    this.query.set(value);
    this.runPreview(value);
  }

  useExample(ex: { label: string; query: string }): void {
    this.query.set(ex.query);
    this.runPreview(ex.query);
  }

  private runPreview(q: string): void {
    if (!q.trim()) {
      this.previewResult.set('');
      this.previewError.set('');
      this.isValid.set(false);
      return;
    }
    if (!this.jsonSource?.trim()) {
      this.previewError.set('No JSON to query. Format JSON first.');
      this.isValid.set(false);
      return;
    }
    try {
      const parsed = JSON.parse(this.jsonSource);
      const result = this.jmespath.search(parsed, q);
      this.previewResult.set(JSON.stringify(result, null, 2));
      this.previewError.set('');
      this.isValid.set(true);
    } catch (e: any) {
      this.previewResult.set('');
      this.previewError.set(e.message || 'Invalid query');
      this.isValid.set(false);
    }
  }

  onApply(): void {
    if (!this.isValid()) return;
    this.apply.emit({ query: this.query(), result: this.previewResult() });
    this.onClose();
  }

  onClose(): void { this.closed.emit(); }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('tm-overlay')) this.onClose();
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.onClose();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') this.onApply();
  }
}
