import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, map } from 'rxjs/operators';
import { SyncService } from './core/sync/sync.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, merge, of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, CommonModule,
    MatToolbarModule, MatIconModule, MatButtonModule, MatTooltipModule,
  ],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <a routerLink="/" class="app-logo">
          <span class="logo-icon">◎</span>
          <span class="logo-text">The Circle</span>
        </a>

        <div class="header-actions">
          <span
            class="online-badge"
            [class.offline]="!isOnline()"
            [matTooltip]="isOnline() ? 'Online – synchronisiert' : 'Offline – lokal gespeichert'"
          ></span>

          @if (showAdmin()) {
            <a routerLink="/admin" mat-icon-button matTooltip="Admin">
              <mat-icon fontSet="material-icons-round">admin_panel_settings</mat-icon>
            </a>
          }
        </div>
      </header>

      <main class="app-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      max-width: 600px;
      margin: 0 auto;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(15,15,15,0.95);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .app-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: inherit;
    }

    .logo-icon {
      font-size: 22px;
      color: #7986cb;
      line-height: 1;
    }

    .logo-text {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: #e0e0e0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .online-badge {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #4caf50;
      transition: background 0.3s;
      &.offline { background: #ef5350; }
    }

    .app-content {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  `],
})
export class AppComponent implements OnInit {
  private readonly sync = inject(SyncService);
  private readonly router = inject(Router);

  isOnline = toSignal(
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
    ),
    { initialValue: navigator.onLine },
  );

  showAdmin = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => false),
    ),
    { initialValue: true },
  );

  ngOnInit() {
    this.sync.startAutoSync();
  }
}
