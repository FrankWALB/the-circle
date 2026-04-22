import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatTableModule, MatExpansionModule, MatChipsModule],
  template: `
    <div class="page-container">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <button mat-icon-button (click)="router.navigate(['/'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 style="margin:0">Admin - Alle Daten</h2>
      </div>

      <div *ngIf="!online" style="background:#fff3e0;padding:12px;border-radius:8px;margin-bottom:16px">
        <mat-icon style="vertical-align:middle;color:#ff9800">wifi_off</mat-icon>
        Admin-Ansicht erfordert eine Online-Verbindung.
      </div>

      <mat-form-field class="full-width" appearance="outline">
        <mat-label>Suche...</mat-label>
        <input matInput [(ngModel)]="search" (ngModelChange)="filter()" data-testid="admin-search">
      </mat-form-field>

      <mat-accordion>
        <mat-expansion-panel *ngFor="let p of filtered" data-testid="admin-person">
          <mat-expansion-panel-header>
            <mat-panel-title>{{p.name}}</mat-panel-title>
            <mat-panel-description>
              User: {{p.userId?.substring(0,8)}}... | Facts: {{p.facts?.length || 0}}
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div *ngIf="p.occupation"><strong>Beruf:</strong> {{p.occupation}}</div>
          <div *ngIf="p.notes"><strong>Notizen:</strong> {{p.notes}}</div>

          <h4>Informationen:</h4>
          <mat-chip-set>
            <mat-chip *ngFor="let f of p.facts">
              <strong>{{f.key}}</strong>: {{f.value}}
            </mat-chip>
          </mat-chip-set>
          <div *ngIf="!p.facts?.length" style="color:#999">Keine</div>

          <h4>Events:</h4>
          <div *ngFor="let e of p.events" style="margin:4px 0">
            {{e.title}} - {{e.date}}
          </div>
          <div *ngIf="!p.events?.length" style="color:#999">Keine</div>
        </mat-expansion-panel>
      </mat-accordion>

      <div *ngIf="filtered.length === 0 && online" style="text-align:center;color:#999;margin-top:32px">
        <p>Keine Daten gefunden.</p>
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  all: any[] = [];
  filtered: any[] = [];
  search = '';
  online = navigator.onLine;

  constructor(private http: HttpClient, public router: Router) {}

  ngOnInit() {
    if (this.online) {
      this.http.get<any[]>(`${environment.apiUrl}/persons/admin`).subscribe({
        next: data => {
          this.all = data;
          this.filter();
        },
        error: () => {}
      });
    }
  }

  filter() {
    const q = this.search.toLowerCase();
    this.filtered = this.all.filter(p =>
      !q || p.name.toLowerCase().includes(q) || (p.userId || '').toLowerCase().includes(q)
    );
  }
}
