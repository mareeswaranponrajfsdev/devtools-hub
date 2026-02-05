import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-output',
  imports: [],
  templateUrl: './output.html',
  styleUrl: './output.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Output {

}
