import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PersonsService } from '../../services/persons.service';
import { Person } from '../../db';
import { ResolveDialogComponent } from '../../components/resolve-dialog/resolve-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatCardModule, MatChipsModule, MatDialogModule],
  template: `
    <div class="page-container">
      <mat-form-field class="full-width" appearance="outline">
        <mat-label>Schnellsuche oder Quick-Add...</mat-label>
        <input matInput
               [(ngModel)]="query"
               (ngModelChange)="onSearch()"
               (keydown.enter)="onEnter()"
               data-testid="quick-input"
               placeholder="Name oder 'Name: Info'">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="card-list">
        <mat-card *ngFor="let p of persons" class="person-card" (click)="openPerson(p)">
          <mat-card-header>
            <mat-card-title data-testid="person-name">{{p.name}}</mat-card-title>
            <mat-card-subtitle *ngIf="p.occupation || p.metAt">
              <span *ngIf="p.occupation">{{p.occupation}}</span>
              <span *ngIf="p.occupation && p.metAt"> · </span>
              <span *ngIf="p.metAt">Kennt: {{p.metAt}}</span>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content *ngIf="p.notes">
            <p>{{p.notes}}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="openBriefing(p, $event)">
              <mat-icon>info</mat-icon> Briefing
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div *ngIf="persons.length === 0 && query" style="text-align:center;margin-top:32px;color:#666">
        <p>Keine Person gefunden.</p>
        <button mat-raised-button color="primary" (click)="quickAdd()">
          <mat-icon>person_add</mat-icon> "{{query}}" als neue Person anlegen
        </button>
      </div>

      <div *ngIf="persons.length === 0 && !query" style="text-align:center;margin-top:32px;color:#999">
        <mat-icon style="font-size:48px;width:48px;height:48px">people</mat-icon>
        <p>Noch keine Personen. Tippe einen Namen ein!</p>
      </div>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  query = '';
  persons: Person[] = [];

  constructor(
    private personsService: PersonsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.persons = await this.personsService.getAll(this.query || undefined);
  }

  async onSearch() {
    await this.load();
  }

  async onEnter() {
    if (!this.query.trim()) return;
    const colonIdx = this.query.indexOf(':');
    if (colonIdx > 0) {
      const possibleName = this.query.substring(0, colonIdx).trim();
      const matches = await this.personsService.getAll(possibleName);
      const dialogRef = this.dialog.open(ResolveDialogComponent, {
        width: '360px',
        data: { query: this.query, name: possibleName, matches }
      });
      dialogRef.afterClosed().subscribe(async result => {
        if (result) {
          this.query = '';
          await this.load();
        }
      });
    } else {
      const matches = await this.personsService.getAll(this.query);
      if (matches.length === 1) {
        this.router.navigate(['/person', matches[0].id]);
      } else if (matches.length > 1) {
        const dialogRef = this.dialog.open(ResolveDialogComponent, {
          width: '360px',
          data: { query: this.query, name: this.query, matches }
        });
        dialogRef.afterClosed().subscribe(async result => {
          if (result) {
            this.query = '';
            await this.load();
          }
        });
      } else {
        await this.quickAdd();
      }
    }
  }

  async quickAdd() {
    if (!this.query.trim()) return;
    const person = await this.personsService.create(this.query.trim());
    this.query = '';
    this.router.navigate(['/person', person.id]);
  }

  openPerson(p: Person) {
    this.router.navigate(['/person', p.id]);
  }

  openBriefing(p: Person, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/person', p.id, 'briefing']);
  }
}
