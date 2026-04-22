import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PersonsService } from '../../services/persons.service';
import { FactsService } from '../../services/facts.service';
import { Person } from '../../db';

@Component({
  selector: 'app-resolve-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatListModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Person auswählen</h2>
    <mat-dialog-content>
      <p style="color:#666;font-size:14px">Eingabe: <strong>{{data.query}}</strong></p>
      <mat-nav-list *ngIf="data.matches.length > 0">
        <mat-list-item *ngFor="let p of data.matches" (click)="selectPerson(p)">
          <mat-icon matListItemIcon>person</mat-icon>
          <span matListItemTitle>{{p.name}}</span>
          <span matListItemLine *ngIf="p.occupation">{{p.occupation}}</span>
        </mat-list-item>
      </mat-nav-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Abbrechen</button>
      <button mat-raised-button color="primary" (click)="createNew()">
        <mat-icon>person_add</mat-icon> Neue Person anlegen
      </button>
    </mat-dialog-actions>
  `,
})
export class ResolveDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ResolveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { query: string; name: string; matches: Person[] },
    private personsService: PersonsService,
    private factsService: FactsService,
    private router: Router,
  ) {}

  async selectPerson(p: Person) {
    await this.addFactIfNeeded(p.id);
    this.dialogRef.close(true);
    this.router.navigate(['/person', p.id]);
  }

  async createNew() {
    const p = await this.personsService.create(this.data.name);
    await this.addFactIfNeeded(p.id);
    this.dialogRef.close(true);
    this.router.navigate(['/person', p.id]);
  }

  private async addFactIfNeeded(personId: string) {
    const colonIdx = this.data.query.indexOf(':');
    if (colonIdx > 0) {
      const raw = this.data.query.substring(colonIdx + 1).trim();
      const colonIdx2 = raw.indexOf(':');
      let key: string, value: string, category: string | undefined;
      if (colonIdx2 > 0) {
        key = raw.substring(0, colonIdx2).trim();
        value = raw.substring(colonIdx2 + 1).trim();
      } else {
        const parsed = this.factsService.parseQuickInput(raw);
        key = parsed.key;
        value = parsed.value;
        category = parsed.category;
      }
      await this.factsService.create(personId, key, value, category);
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
