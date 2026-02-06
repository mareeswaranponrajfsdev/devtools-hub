import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {

  private readonly key = 'devtools-theme';

  readonly isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem(this.key);

    this.isDark.set(saved === 'dark');
  }

  toggleTheme(): void {

    const next = !this.isDark();

    this.isDark.set(next);

    const theme = next ? 'dark' : 'light';

    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    localStorage.setItem(this.key, theme);
  }
}
