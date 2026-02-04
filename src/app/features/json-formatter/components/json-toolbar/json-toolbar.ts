import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output
} from '@angular/core';

@Component({
  selector: 'app-json-toolbar',
  standalone: true,
  templateUrl: './json-toolbar.html',
  styleUrl: './json-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonToolbar {

  @Output() format = new EventEmitter<void>();
  @Output() minify = new EventEmitter<void>();
  @Output() validate = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
}
