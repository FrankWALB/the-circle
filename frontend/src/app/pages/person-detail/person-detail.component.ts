import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { PersonsService } from '../../services/persons.service';
import { FactsService } from '../../services/facts.service';
import { EventsService } from '../../services/events.service';
import { Person, Fact, CircleEvent } from '../../db';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatChipsModule, MatDividerModule, MatListModule],
  template: `
    <div class="page-container" *ngIf="person">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <button mat-icon-button (click)="router.navigate(['/'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 style="margin:0;flex:1" data-testid="person-detail-name">{{person.name}}</h2>
        <button mat-icon-button (click)="router.navigate(['/person', person.id, 'briefing'])" title="Briefing">
          <mat-icon>info</mat-icon>
        </button>
        <button mat-icon-button color="warn" (click)="deletePerson()" title="Löschen">
          <mat-icon>delete</mat-icon>
        </button>
      </div>

      <mat-form-field class="full-width" appearance="outline">
        <mat-label>Info hinzufügen (z.B. "Beruf: Arzt")</mat-label>
        <input matInput
               [(ngModel)]="quickFact"
               (keydown.enter)="addFact()"
               data-testid="fact-input"
               placeholder="key: value oder freier Text">
        <button mat-icon-button matSuffix (click)="addFact()">
          <mat-icon>add</mat-icon>
        </button>
      </mat-form-field>

      <mat-card style="margin-bottom:16px">
        <mat-card-header>
          <mat-card-title>Informationen</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="facts.length === 0" style="color:#999;font-size:14px;padding:8px 0">
            Noch keine Infos. Füge oben eine hinzu!
          </div>
          <mat-chip-set>
            <mat-chip *ngFor="let f of facts" class="fact-chip" data-testid="fact-chip"
                      (removed)="deleteFact(f)">
              <strong>{{f.key}}</strong>: {{f.value}}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip>
          </mat-chip-set>
        </mat-card-content>
      </mat-card>

      <mat-card style="margin-bottom:16px">
        <mat-card-header>
          <mat-card-title>Jahrestage & Events</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="events.length === 0" style="color:#999;font-size:14px;padding:8px 0">
            Noch keine Events.
          </div>
          <mat-list>
            <mat-list-item *ngFor="let e of events">
              <mat-icon matListItemIcon>event</mat-icon>
              <span matListItemTitle>{{e.title}}</span>
              <span matListItemLine>{{e.date}} <span *ngIf="e.recurring">(jährlich)</span></span>
              <button mat-icon-button matListItemMeta color="warn" (click)="deleteEvent(e)">
                <mat-icon>delete</mat-icon>
              </button>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
        <mat-card-actions>
          <div style="display:flex;gap:8px;padding:8px">
            <input type="text" [(ngModel)]="newEventTitle" placeholder="Event Titel" style="flex:1;border:1px solid #ccc;border-radius:4px;padding:8px">
            <input type="date" [(ngModel)]="newEventDate" style="border:1px solid #ccc;border-radius:4px;padding:8px">
            <button mat-raised-button color="primary" (click)="addEvent()">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </mat-card-actions>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Notizen</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field class="full-width" appearance="outline">
            <textarea matInput [(ngModel)]="person.notes" (blur)="saveNotes()" rows="4" placeholder="Freie Notizen..."></textarea>
          </mat-form-field>
        </mat-card-content>
      </mat-card>
    </div>
    <div *ngIf="!person" class="page-container" style="text-align:center;margin-top:64px">
      <mat-icon style="font-size:48px;width:48px;height:48px;color:#999">person_off</mat-icon>
      <p>Person nicht gefunden.</p>
      <button mat-raised-button (click)="router.navigate(['/'])">Zurück</button>
    </div>
  `,
})
export class PersonDetailComponent implements OnInit {
  person: Person | undefined;
  facts: Fact[] = [];
  events: CircleEvent[] = [];
  quickFact = '';
  newEventTitle = '';
  newEventDate = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private personsService: PersonsService,
    private factsService: FactsService,
    private eventsService: EventsService,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.person = await this.personsService.getOne(id);
    if (this.person) {
      await this.loadFacts();
      await this.loadEvents();
    }
  }

  async loadFacts() {
    this.facts = await this.factsService.getByPerson(this.person!.id);
  }

  async loadEvents() {
    this.events = await this.eventsService.getByPerson(this.person!.id);
  }

  async addFact() {
    if (!this.quickFact.trim() || !this.person) return;
    const parsed = this.factsService.parseQuickInput(this.quickFact);
    await this.factsService.create(this.person.id, parsed.key, parsed.value, parsed.category);
    this.quickFact = '';
    await this.loadFacts();
  }

  async deleteFact(f: Fact) {
    await this.factsService.delete(f.id);
    await this.loadFacts();
  }

  async addEvent() {
    if (!this.newEventTitle.trim() || !this.newEventDate || !this.person) return;
    await this.eventsService.create(this.person.id, this.newEventTitle, this.newEventDate, false);
    this.newEventTitle = '';
    this.newEventDate = '';
    await this.loadEvents();
  }

  async deleteEvent(e: CircleEvent) {
    await this.eventsService.delete(e.id);
    await this.loadEvents();
  }

  async saveNotes() {
    if (!this.person) return;
    await this.personsService.update(this.person.id, { notes: this.person.notes });
  }

  async deletePerson() {
    if (!this.person || !confirm(`"${this.person.name}" wirklich löschen?`)) return;
    await this.personsService.delete(this.person.id);
    this.router.navigate(['/']);
  }
}
