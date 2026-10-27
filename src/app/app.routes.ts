import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'config',
    loadComponent: () =>
      import('./pages/config/config.component').then(
        (it) => it.ConfigComponent
      ),
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('./pages/compare/compare.component').then(
        (it) => it.CompareComponent
      ),
  },
  {
    path: 'bracket-chart',
    loadComponent: () =>
      import('./pages/bracket-chart/bracket-chart.component').then(
        (it) => it.BracketChartComponent
      ),
  },
];
