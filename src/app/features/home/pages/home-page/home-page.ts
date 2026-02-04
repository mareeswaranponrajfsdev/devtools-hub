import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JsonTools } from '../../../json-formatter/containers/json-tools/json-tools';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, JsonTools],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
