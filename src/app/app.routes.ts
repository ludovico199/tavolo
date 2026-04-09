import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'tavoli', loadComponent: () => import('./Componenti/tavoli/tavoli').then(m => m.Tavoli) },
  { path: 'cucina', loadComponent: () => import('./Componenti/cucina/cucina').then(m => m.CucinaComponent) },
  {
    path: 'dashboard',
    loadComponent: () => import('./Componenti/dashboard/dashboard').then(m => m.DashboardComponent),
    children: [
      { path: 'ordini', loadComponent: () => import('./Componenti/dashboard/ordini/ordini').then(m => m.OrdiniDashboardComponent) },
      { path: 'menu', loadComponent: () => import('./Componenti/dashboard/menu/menu').then(m => m.MenuDashboardComponent) },
      { path: 'categorie', loadComponent: () => import('./Componenti/dashboard/categorie/categorie').then(m => m.CategorieDashboardComponent) },
      { path: 'tavoli', loadComponent: () => import('./Componenti/dashboard/tavoli/tavoli').then(m => m.TavoliDashboardComponent) },
    ]
  },
  { path: '', redirectTo: '/tavoli', pathMatch: 'full' },
];
