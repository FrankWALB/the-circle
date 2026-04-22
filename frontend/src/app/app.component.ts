import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, MatToolbarModule, MatIconModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary">
      <a routerLink="/" style="color:white;text-decoration:none;font-weight:bold">The Circle</a>
      <span style="flex:1"></span>
      <span *ngIf="!online" class="offline-badge">Offline</span>
      <button mat-icon-button routerLink="/admin" title="Admin">
        <mat-icon>admin_panel_settings</mat-icon>
      </button>
    </mat-toolbar>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent implements OnInit {
  online = navigator.onLine;

  constructor(private syncService: SyncService) {}

  ngOnInit() {
    window.addEventListener('online', () => {
      this.online = true;
      this.syncService.syncAll();
    });
    window.addEventListener('offline', () => { this.online = false; });
    this.syncService.syncAll();
  }
}
