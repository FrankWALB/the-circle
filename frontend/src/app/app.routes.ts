import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PersonDetailComponent } from './pages/person-detail/person-detail.component';
import { BriefingComponent } from './pages/briefing/briefing.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'person/:id', component: PersonDetailComponent },
  { path: 'person/:id/briefing', component: BriefingComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' },
];
