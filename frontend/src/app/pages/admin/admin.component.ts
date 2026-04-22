import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { firstValueFrom } from 'rxjs';

interface AdminPerson {
  id: string;
  name: string;
  occupation?: string;
  company?: string;
  updatedAt: string;
  user: { name: string; externalId: string };
  notes: unknown[];
  facts: unknown[];
  events: unknown[];
}

interface AdminUser {
  id: string;
  name: string;
  externalId: string;
  email?: string;
  role: string;
  createdAt: string;
  _count: { persons: number };
}

interface AdminStats {
  users: number;
  persons: number;
  notes: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, MatTabsModule],
  template: `
    <div class="admin">
      <div class="admin-header">
        <button mat-icon-button routerLink="/">
          <mat-icon fontSet="material-icons-round">arrow_back</mat-icon>
        </button>
        <div>
          <h1>Admin</h1>
          <p>Read-only Übersicht</p>
        </div>
      </div>

      @if (error()) {
        <div class="error-banner">
          <span class="material-icons-round">lock</span>
          Kein Admin-Zugriff. Setze den Header <code>x-user-role: ADMIN</code>.
        </div>
      } @else {
        <!-- Stats -->
        @if (stats()) {
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.users }}</span>
              <span class="stat-label">Nutzer</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.persons }}</span>
              <span class="stat-label">Personen</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.notes }}</span>
              <span class="stat-label">Notizen</span>
            </div>
          </div>
        }

        <mat-tab-group>
          <!-- Persons Tab -->
          <mat-tab label="Personen">
            <div class="tab-content">
              <div class="search-row">
                <input
                  [(ngModel)]="personSearch"
                  placeholder="Suche…"
                  class="admin-search"
                  (input)="searchPersons()"
                  data-testid="admin-search"
                />
              </div>

              @for (p of persons(); track p.id) {
                <div
                  class="admin-row"
                  (click)="selectedPerson.set(p)"
                  [class.selected]="selectedPerson()?.id === p.id"
                  data-testid="admin-person-row"
                >
                  <div class="admin-avatar">{{ p.name[0].toUpperCase() }}</div>
                  <div class="admin-row-info">
                    <span class="row-name">{{ p.name }}</span>
                    <span class="row-sub">
                      {{ p.occupation ?? p.company ?? '' }}
                      <span class="owner-badge">{{ p.user.externalId }}</span>
                    </span>
                  </div>
                  <span class="row-counts">
                    {{ p.notes.length }}N · {{ p.facts.length }}F
                  </span>
                </div>
              }

              @if (selectedPerson()) {
                <div class="detail-panel" data-testid="admin-detail-panel">
                  <div class="detail-panel-header">
                    <h3>{{ selectedPerson()!.name }}</h3>
                    <button mat-icon-button (click)="selectedPerson.set(null)">
                      <mat-icon fontSet="material-icons-round">close</mat-icon>
                    </button>
                  </div>
                  <p class="detail-owner">Nutzer: {{ selectedPerson()!.user.name }} ({{ selectedPerson()!.user.externalId }})</p>
                  @if (selectedPerson()!.occupation) {
                    <p class="detail-field"><strong>Beruf:</strong> {{ selectedPerson()!.occupation }}</p>
                  }
                  <div class="detail-section-title">Notizen ({{ selectedPerson()!.notes.length }})</div>
                  @for (note of $any(selectedPerson()!.notes); track note.id) {
                    <div class="detail-note">{{ note.content }}</div>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <!-- Users Tab -->
          <mat-tab label="Nutzer">
            <div class="tab-content">
              @for (u of users(); track u.id) {
                <div class="admin-row" data-testid="admin-user-row">
                  <div class="admin-avatar">{{ u.name[0].toUpperCase() }}</div>
                  <div class="admin-row-info">
                    <span class="row-name">{{ u.name }}</span>
                    <span class="row-sub">{{ u.externalId }}</span>
                  </div>
                  <div class="user-meta">
                    <span class="role-badge" [class.admin]="u.role === 'ADMIN'">{{ u.role }}</span>
                    <span class="row-counts">{{ u._count.persons }} P</span>
                  </div>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .admin { padding-bottom: 80px; }

    .admin-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);

      h1 { margin: 0; font-size: 18px; font-weight: 700; }
      p { margin: 2px 0 0; font-size: 12px; color: rgba(255,255,255,0.4); }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 16px;
      padding: 12px 16px;
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 8px;
      font-size: 14px;
      color: #ef9a9a;

      code {
        background: rgba(255,255,255,0.1);
        padding: 1px 6px;
        border-radius: 4px;
        font-family: monospace;
      }
    }

    .stats-row {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
    }

    .stat-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
    }

    .stat-value { font-size: 24px; font-weight: 700; color: #7986cb; }
    .stat-label { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }

    .tab-content { padding: 12px; }

    .search-row { margin-bottom: 12px; }

    .admin-search {
      width: 100%;
      padding: 10px 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #e0e0e0;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      &:focus { border-color: #7986cb; }
    }

    .admin-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.05); }
      &.selected { background: rgba(121,134,203,0.15); }
    }

    .admin-avatar {
      width: 36px; height: 36px; flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #3949ab, #7986cb);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 600; color: white;
    }

    .admin-row-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .row-name { font-size: 14px; font-weight: 500; }
    .row-sub { font-size: 12px; color: rgba(255,255,255,0.4); display: flex; gap: 8px; align-items: center; }
    .row-counts { font-size: 11px; color: rgba(255,255,255,0.3); flex-shrink: 0; }

    .owner-badge {
      background: rgba(255,255,255,0.07);
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 10px;
    }

    .user-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }

    .role-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 8px;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.5);
      &.admin { background: rgba(255,183,77,0.2); color: #ffcc80; }
    }

    .detail-panel {
      margin-top: 12px;
      padding: 16px;
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .detail-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      h3 { margin: 0; font-size: 16px; }
    }

    .detail-owner { font-size: 12px; color: rgba(255,255,255,0.4); margin: 4px 0 12px; }
    .detail-field { font-size: 14px; margin: 4px 0; }

    .detail-section-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin: 12px 0 6px;
    }

    .detail-note {
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.7);
    }
  `],
})
export class AdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  persons = signal<AdminPerson[]>([]);
  users = signal<AdminUser[]>([]);
  stats = signal<AdminStats | null>(null);
  error = signal(false);
  selectedPerson = signal<AdminPerson | null>(null);
  personSearch = '';

  private readonly adminHeaders = { 'x-user-id': 'admin', 'x-user-role': 'ADMIN' };

  async ngOnInit() {
    try {
      const [stats, persons, users] = await Promise.all([
        firstValueFrom(this.http.get<AdminStats>('/api/admin/stats', { headers: this.adminHeaders })),
        firstValueFrom(this.http.get<AdminPerson[]>('/api/admin/persons', { headers: this.adminHeaders })),
        firstValueFrom(this.http.get<AdminUser[]>('/api/admin/users', { headers: this.adminHeaders })),
      ]);
      this.stats.set(stats);
      this.persons.set(persons);
      this.users.set(users);
    } catch {
      this.error.set(true);
    }
  }

  async searchPersons() {
    try {
      const persons = await firstValueFrom(
        this.http.get<AdminPerson[]>(`/api/admin/persons?search=${this.personSearch}`, {
          headers: this.adminHeaders,
        }),
      );
      this.persons.set(persons);
    } catch { /* ignore */ }
  }
}
