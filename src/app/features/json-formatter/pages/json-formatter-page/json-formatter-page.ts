import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import { JsonFormatterStore } from '../../state/json-formatter.store';

import { Editor } from '../../components/editor/editor';
import { Toolbar } from '../../components/toolbar/toolbar';

@Component({
  selector: 'app-json-formatter-page',
  standalone: true,

  imports: [
    Editor,
    Toolbar,
  ],

  providers: [JsonFormatterStore],

  templateUrl: './json-formatter-page.html',
  styleUrl: './json-formatter-page.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFormatterPage {

  constructor(
    public readonly store: JsonFormatterStore
  ) {}

}
