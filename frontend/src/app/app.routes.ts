import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'persons/:id',
    loadComponent: () =>
      import('./pages/person-detail/person-detail.component').then(m => m.PersonDetailComponent),
  },
  {
    path: 'persons/:id/briefing',
    loadComponent: () =>
      import('./pages/briefing/briefing.component').then(m => m.BriefingComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin.component').then(m => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
