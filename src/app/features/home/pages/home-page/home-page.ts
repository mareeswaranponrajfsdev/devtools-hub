import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JsonTools } from '../../../json-formatter/containers/json-tools/json-tools';
import { HowTo } from '../../components/how-to/how-to';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, JsonTools, HowTo],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
