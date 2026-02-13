import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout')
        .then(m => m.MainLayout),

    children: [

      {
        path: '',
        loadComponent: () =>
          import('./features/home/pages/home-page/home-page')
            .then(m => m.HomePage),
      },

      // JSON Tools Routes
      {
        path: 'json-to-code',
        loadComponent: () =>
          import('./features/json-tools/pages/code-generator/code-generator')
            .then(m => m.CodeGeneratorPage),
      },

      {
        path: 'json-to-csharp',
        redirectTo: 'json-to-code',
        pathMatch: 'full'
      },

      {
        path: 'json-to-typescript',
        redirectTo: 'json-to-code',
        pathMatch: 'full'
      },

      {
        path: 'json-to-java',
        redirectTo: 'json-to-code',
        pathMatch: 'full'
      },

      {
        path: 'json-diff',
        loadComponent: () =>
          import('./features/json-tools/pages/diff-tool/diff-tool')
            .then(m => m.DiffToolPage),
      },

      {
        path: 'json-compare',
        redirectTo: 'json-diff',
        pathMatch: 'full'
      },

      {
        path: 'json-schema-validator',
        loadComponent: () =>
          import('./features/json-tools/pages/schema-validator/schema-validator')
            .then(m => m.SchemaValidatorPage),
      },

      {
        path: 'json-schema',
        redirectTo: 'json-schema-validator',
        pathMatch: 'full'
      },

      // Legal Pages
      {
        path: 'privacy',
        loadComponent: () =>
          import('./features/legal/pages/privacy-page/privacy-page')
            .then(m => m.PrivacyPage),
      },

      {
        path: 'terms',
        loadComponent: () =>
          import('./features/legal/pages/terms-page/terms-page')
            .then(m => m.TermsPage),
      },

    ],
  },

];
