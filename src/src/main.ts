/****************************************************************
 * BOOTSTRAP JS (for Navbar, Collapse, etc.)
 ****************************************************************/
import 'bootstrap';

/****************************************************************
 * DARK / LIGHT THEME INITIALIZER
 ****************************************************************/

const THEME_KEY = 'devtools-theme';

// Get saved theme
const savedTheme = localStorage.getItem(THEME_KEY);

// Apply before Angular loads (prevents flicker)
if (savedTheme === 'dark' || savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else {
  // Default: Light
  document.documentElement.setAttribute('data-theme', 'light');
}

/****************************************************************
 * ANGULAR BOOTSTRAP
 ****************************************************************/

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
  ],
}).catch(err => {
  console.error('Angular bootstrap failed:', err);
});
