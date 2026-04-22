import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { PersonsService } from '../../services/persons.service';
import { FactsService } from '../../services/facts.service';
import { EventsService } from '../../services/events.service';
import { Person, Fact, CircleEvent } from '../../db';

@Component({
  selector: 'app-briefing',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule],
  template: `
    <div class="page-container" *ngIf="person">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <button mat-icon-button (click)="router.navigate(['/person', person.id])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 style="margin:0">Briefing: {{person.name}}</h2>
      </div>

      <div class="briefing-section" data-testid="briefing-section">
        <h3><mat-icon style="vertical-align:middle">info</mat-icon> Key Facts</h3>
        <div *ngIf="facts.length === 0" style="color:#999">Keine Informationen erfasst.</div>
        <mat-chip-set>
          <mat-chip *ngFor="let f of facts">
            <strong>{{f.key}}</strong>: {{f.value}}
          </mat-chip>
        </mat-chip-set>
      </div>

      <mat-divider style="margin:16px 0"></mat-divider>

      <div class="briefing-section">
        <h3><mat-icon style="vertical-align:middle">event</mat-icon> Kommende Ereignisse (90 Tage)</h3>
        <div *ngIf="upcoming.length === 0" style="color:#999">Keine bevorstehenden Ereignisse.</div>
        <mat-card *ngFor="let e of upcoming" style="margin-bottom:8px">
          <mat-card-content style="padding:8px 16px">
            <strong>{{e.title}}</strong> - {{e.date}}
            <span *ngIf="e.recurring" style="color:#666;font-size:12px"> (jährlich)</span>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-divider style="margin:16px 0"></mat-divider>

      <div class="briefing-section">
        <h3><mat-icon style="vertical-align:middle">update</mat-icon> Letzte Änderungen</h3>
        <mat-card *ngFor="let f of recentFacts" style="margin-bottom:8px">
          <mat-card-content style="padding:8px 16px">
            <strong>{{f.key}}</strong>: {{f.value}}
            <div style="font-size:11px;color:#999">{{f.updatedAt | date:'short'}}</div>
          </mat-card-content>
        </mat-card>
        <div *ngIf="recentFacts.length === 0" style="color:#999">Keine aktuellen Änderungen.</div>
      </div>

      <mat-divider style="margin:16px 0"></mat-divider>

      <div class="briefing-section" *ngIf="person.notes">
        <h3><mat-icon style="vertical-align:middle">notes</mat-icon> Notizen</h3>
        <p style="white-space:pre-wrap">{{person.notes}}</p>
      </div>
    </div>
  `,
})
export class BriefingComponent implements OnInit {
  person: Person | undefined;
  facts: Fact[] = [];
  events: CircleEvent[] = [];
  upcoming: any[] = [];
  recentFacts: Fact[] = [];

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
      this.facts = await this.factsService.getByPerson(this.person.id);
      this.events = await this.eventsService.getByPerson(this.person.id);
      this.upcoming = this.eventsService.getUpcoming(this.events);
      this.recentFacts = [...this.facts]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5);
    }
  }
}
