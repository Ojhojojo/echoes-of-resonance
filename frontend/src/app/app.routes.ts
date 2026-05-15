import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
  {
    path: 'ranch',
    loadComponent: () => import('./features/ranch/ranch.component').then((m) => m.RanchComponent),
  },
  { path: '**', redirectTo: '' },
];
