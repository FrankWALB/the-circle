import { Component, inject, signal, computed, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SyncService } from '../../core/sync/sync.service';
import { PersonWithRelations, CircleEvent } from '../../core/db/models';

interface UpcomingEvent {
  title: string;
  date: Date;
  daysUntil: number;
  isRecurring: boolean;
}

@Component({
  selector: 'app-briefing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="briefing">
      @if (person()) {
        <div class="briefing-header">
          <button mat-icon-button (click)="back()">
            <mat-icon fontSet="material-icons-round">arrow_back</mat-icon>
          </button>
          <div class="header-avatar">{{ person()!.name[0].toUpperCase() }}</div>
          <div>
            <h1 class="briefing-title">{{ person()!.name }}</h1>
            <p class="briefing-sub">Briefing</p>
          </div>
          <span class="briefing-badge">
            <span class="material-icons-round">auto_awesome</span>
          </span>
        </div>

        <!-- Upcoming Events Alert -->
        @if (upcomingEvents().length > 0) {
          <div class="upcoming-banner">
            <span class="material-icons-round">celebration</span>
            <div class="upcoming-list">
              @for (ev of upcomingEvents(); track ev.title) {
                <div class="upcoming-item">
                  <strong>{{ ev.title }}</strong>
                  @if (ev.daysUntil === 0) {
                    <span class="badge today">Heute!</span>
                  } @else if (ev.daysUntil === 1) {
                    <span class="badge soon">Morgen</span>
                  } @else {
                    <span class="badge">in {{ ev.daysUntil }} Tagen</span>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Key Facts Block -->
        <section class="brief-section">
          <div class="brief-section-title">
            <span class="material-icons-round">person</span>
            Auf einen Blick
          </div>
          <div class="facts-block">
            @if (person()!.occupation) {
              <div class="fact-row">
                <span class="fact-lbl">Beruf</span>
                <span class="fact-val">{{ person()!.occupation }}</span>
              </div>
            }
            @if (person()!.company) {
              <div class="fact-row">
                <span class="fact-lbl">Unternehmen</span>
                <span class="fact-val">{{ person()!.company }}</span>
              </div>
            }
            @if (person()!.birthday) {
              <div class="fact-row">
                <span class="fact-lbl">Geburtstag</span>
                <span class="fact-val">{{ formatDate(person()!.birthday!) }}</span>
              </div>
            }
            @if (person()!.location) {
              <div class="fact-row">
                <span class="fact-lbl">Ort</span>
                <span class="fact-val">{{ person()!.location }}</span>
              </div>
            }
            @for (fact of person()!.facts; track fact.id) {
              <div class="fact-row">
                <span class="fact-lbl">{{ fact.key }}</span>
                <span class="fact-val">{{ fact.value }}</span>
              </div>
            }
            @if (!person()!.occupation && !person()!.birthday && person()!.facts.length === 0) {
              <p class="muted">Noch keine Key-Facts erfasst</p>
            }
          </div>
        </section>

        <!-- Last Updates -->
        <section class="brief-section">
          <div class="brief-section-title">
            <span class="material-icons-round">history</span>
            Letzte Notizen
          </div>
          @if (person()!.notes.length === 0) {
            <p class="muted">Keine Notizen</p>
          }
          @for (note of recentNotes(); track note.id) {
            <div class="note-brief">
              <span class="material-icons-round dot">fiber_manual_record</span>
              <div>
                <div class="note-text">{{ note.content }}</div>
                <div class="note-ts">{{ formatDateTime(note.createdAt) }}</div>
              </div>
            </div>
          }
        </section>

        <!-- All Events -->
        @if (person()!.events.length > 0) {
          <section class="brief-section">
            <div class="brief-section-title">
              <span class="material-icons-round">event</span>
              Termine & Jahrestage
            </div>
            @for (event of sortedEvents(); track event.id) {
              <div class="event-brief">
                <span class="material-icons-round">{{ event.recurring ? 'repeat' : 'event' }}</span>
                <div>
                  <div class="event-brief-title">{{ event.title }}</div>
                  <div class="event-brief-date">{{ formatDate(event.date) }}</div>
                </div>
              </div>
            }
          </section>
        }

        <div class="briefing-actions">
          <a [routerLink]="['/persons', person()!.id]" mat-stroked-button>
            <mat-icon fontSet="material-icons-round">edit</mat-icon>
            Bearbeiten
          </a>
        </div>
      } @else if (loading()) {
        <div class="loading">Lade Briefing…</div>
      }
    </div>
  `,
  styles: [`
    .briefing { padding-bottom: 80px; }

    .briefing-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .header-avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3949ab, #7986cb);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: white;
      flex-shrink: 0;
    }

    .briefing-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }

    .briefing-sub {
      margin: 2px 0 0;
      font-size: 12px;
      color: #7986cb;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .briefing-badge {
      margin-left: auto;
      color: #ffb74d;
      .material-icons-round { font-size: 22px; }
    }

    .upcoming-banner {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin: 12px 16px;
      padding: 12px 14px;
      background: rgba(255, 183, 77, 0.1);
      border: 1px solid rgba(255, 183, 77, 0.25);
      border-radius: 10px;

      .material-icons-round { color: #ffb74d; flex-shrink: 0; }
    }

    .upcoming-list { flex: 1; }

    .upcoming-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      padding: 2px 0;
    }

    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);

      &.today {
        background: rgba(244, 67, 54, 0.2);
        color: #ef9a9a;
      }
      &.soon {
        background: rgba(255, 183, 77, 0.2);
        color: #ffcc80;
      }
    }

    .brief-section {
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .brief-section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin-bottom: 12px;

      .material-icons-round { font-size: 16px; color: #7986cb; }
    }

    .facts-block { display: flex; flex-direction: column; gap: 8px; }

    .fact-row {
      display: flex;
      gap: 12px;
      align-items: baseline;
      font-size: 14px;
    }

    .fact-lbl {
      color: rgba(255,255,255,0.4);
      font-size: 12px;
      min-width: 100px;
      flex-shrink: 0;
    }

    .fact-val { color: #e0e0e0; }

    .note-brief {
      display: flex;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);

      &:last-child { border: none; }

      .dot { font-size: 8px; color: #7986cb; margin-top: 6px; flex-shrink: 0; }
    }

    .note-text { font-size: 14px; line-height: 1.5; }
    .note-ts { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }

    .event-brief {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 8px 0;
      font-size: 14px;

      .material-icons-round { color: #7986cb; font-size: 18px; }
    }

    .event-brief-title { font-size: 14px; }
    .event-brief-date { font-size: 12px; color: rgba(255,255,255,0.45); }

    .muted { font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; }

    .briefing-actions {
      padding: 20px 16px;
      display: flex;
      gap: 8px;
    }

    .loading { padding: 60px; text-align: center; color: rgba(255,255,255,0.4); }
  `],
})
export class BriefingComponent implements OnInit {
  @Input() id!: string;

  private readonly sync = inject(SyncService);
  private readonly router = inject(Router);

  person = signal<PersonWithRelations | null>(null);
  loading = signal(true);

  recentNotes = computed(() => (this.person()?.notes ?? []).slice(0, 5));
  sortedEvents = computed(() =>
    [...(this.person()?.events ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    ),
  );

  upcomingEvents = computed<UpcomingEvent[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events: UpcomingEvent[] = [];

    const checkEvent = (title: string, dateStr: string, recurring: boolean) => {
      let date = new Date(dateStr);
      if (recurring) {
        date.setFullYear(today.getFullYear());
        if (date < today) date.setFullYear(today.getFullYear() + 1);
      }
      const diff = Math.floor((date.getTime() - today.getTime()) / 86400000);
      if (diff >= 0 && diff <= 30) {
        events.push({ title, date, daysUntil: diff, isRecurring: recurring });
      }
    };

    for (const ev of this.person()?.events ?? []) {
      checkEvent(ev.title, ev.date, ev.recurring);
    }
    if (this.person()?.birthday) {
      checkEvent('Geburtstag', this.person()!.birthday!, true);
    }

    return events.sort((a, b) => a.daysUntil - b.daysUntil);
  });

  async ngOnInit() {
    const p = await this.sync.getPerson(this.id);
    this.person.set(p ?? null);
    this.loading.set(false);
  }

  back() { this.router.navigate(['/persons', this.id]); }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return iso; }
  }

  formatDateTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  }
}
