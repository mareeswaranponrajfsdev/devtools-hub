import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-json-toolbar',
  standalone: true,
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {

  @Input()
  live = false;

  @Input()
  disabled = false;

  @Output() format = new EventEmitter<void>();
  @Output() minify = new EventEmitter<void>();
  @Output() validate = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() toggleLive = new EventEmitter<void>();

}
