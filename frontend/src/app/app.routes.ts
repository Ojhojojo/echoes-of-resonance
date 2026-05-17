import { Routes } from '@angular/router';
import { requireHatchedGuard, requireUnhatchedGuard } from './core/guards/hatch.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
  {
    path: 'egg',
    canActivate: [requireUnhatchedGuard],
    loadComponent: () => import('./features/egg/egg.component').then((m) => m.EggComponent),
  },
  {
    path: 'ranch',
    canActivate: [requireHatchedGuard],
    data: { layout: 'immersive' },
    loadComponent: () => import('./features/ranch/ranch.component').then((m) => m.RanchComponent),
  },
  { path: '**', redirectTo: '' },
];
