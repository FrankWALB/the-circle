import {
  Component, inject, signal, OnInit, Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SyncService } from '../../core/sync/sync.service';
import { PersonWithRelations, Fact, CircleEvent } from '../../core/db/models';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatIconModule, MatButtonModule, MatTooltipModule,
  ],
  template: `
    <div class="detail">
      @if (person()) {
        <!-- Header -->
        <div class="detail-header">
          <button mat-icon-button (click)="back()">
            <mat-icon fontSet="material-icons-round">arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <div class="header-avatar">{{ person()!.name[0].toUpperCase() }}</div>
            <div>
              @if (editingName()) {
                <input
                  [(ngModel)]="nameEdit"
                  class="inline-edit"
                  (keydown.enter)="saveName()"
                  (blur)="saveName()"
                  #nameInput
                />
              } @else {
                <h1 class="header-name" (click)="startEditName()">{{ person()!.name }}</h1>
              }
              @if (person()!.occupation || person()!.company) {
                <p class="header-sub">
                  {{ joinMeta(person()!.occupation, person()!.company) }}
                </p>
              }
            </div>
          </div>
          <a [routerLink]="['/persons', person()!.id, 'briefing']" mat-icon-button matTooltip="Briefing">
            <mat-icon fontSet="material-icons-round">auto_awesome</mat-icon>
          </a>
        </div>

        <!-- Quick Note Add -->
        <div class="quick-note-bar">
          <input
            [(ngModel)]="noteInput"
            placeholder="Schnell eine Info erfassen…"
            class="note-input"
            (keydown.enter)="addNote()"
            data-testid="quick-note-input"
          />
          <button class="note-submit" (click)="addNote()" [disabled]="!noteInput().trim()">
            <span class="material-icons-round">send</span>
          </button>
        </div>

        <!-- Key Facts -->
        <section class="section">
          <div class="section-header">
            <span class="section-title">Key Facts</span>
            <button mat-icon-button class="small-btn" (click)="showAddFact.set(true)">
              <mat-icon fontSet="material-icons-round">add</mat-icon>
            </button>
          </div>

          <div class="facts-grid">
            @if (person()!.birthday) {
              <div class="fact-chip">
                <span class="material-icons-round">cake</span>
                {{ formatDate(person()!.birthday!) }}
              </div>
            }
            @if (person()!.location) {
              <div class="fact-chip">
                <span class="material-icons-round">place</span>
                {{ person()!.location }}
              </div>
            }
            @if (person()!.phone) {
              <div class="fact-chip">
                <span class="material-icons-round">phone</span>
                {{ person()!.phone }}
              </div>
            }
            @if (person()!.email) {
              <div class="fact-chip">
                <span class="material-icons-round">email</span>
                {{ person()!.email }}
              </div>
            }
            @for (fact of person()!.facts; track fact.id) {
              <div class="fact-chip removable" (click)="removeFact(fact)">
                <span class="fact-key">{{ fact.key }}:</span>
                <span>{{ fact.value }}</span>
                <span class="material-icons-round remove-icon">close</span>
              </div>
            }
          </div>

          @if (showAddFact()) {
            <div class="add-fact-form">
              <input [(ngModel)]="factKey" placeholder="Schlüssel (z.B. Kinder)" class="mini-input" />
              <input [(ngModel)]="factValue" placeholder="Wert" class="mini-input" (keydown.enter)="addFact()" />
              <button mat-flat-button color="primary" (click)="addFact()">OK</button>
              <button mat-button (click)="showAddFact.set(false)">Abbruch</button>
            </div>
          }
        </section>

        <!-- Events -->
        <section class="section">
          <div class="section-header">
            <span class="section-title">Termine & Jahrestage</span>
            <button mat-icon-button class="small-btn" (click)="showAddEvent.set(true)">
              <mat-icon fontSet="material-icons-round">add</mat-icon>
            </button>
          </div>

          @if (person()!.events.length === 0 && !showAddEvent()) {
            <p class="muted-text">Keine Termine</p>
          }

          @for (event of person()!.events; track event.id) {
            <div class="event-item">
              <span class="material-icons-round event-icon">{{ event.recurring ? 'repeat' : 'event' }}</span>
              <div class="event-info">
                <span class="event-title">{{ event.title }}</span>
                <span class="event-date">{{ formatDate(event.date) }}</span>
              </div>
              <button mat-icon-button class="small-btn" (click)="removeEvent(event)">
                <mat-icon fontSet="material-icons-round">delete_outline</mat-icon>
              </button>
            </div>
          }

          @if (showAddEvent()) {
            <div class="add-fact-form">
              <input [(ngModel)]="eventTitle" placeholder="Titel (z.B. Geburtstag)" class="mini-input" />
              <input [(ngModel)]="eventDate" type="date" class="mini-input" />
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="eventRecurring" />
                Jährlich
              </label>
              <button mat-flat-button color="primary" (click)="addEvent()">OK</button>
              <button mat-button (click)="showAddEvent.set(false)">Abbruch</button>
            </div>
          }
        </section>

        <!-- Notes Timeline -->
        <section class="section">
          <span class="section-title">Notizen</span>

          @if (person()!.notes.length === 0) {
            <p class="muted-text">Noch keine Notizen</p>
          }

          <div class="notes-list">
            @for (note of person()!.notes; track note.id) {
              <div class="note-item" data-testid="note-item">
                <div class="note-content">{{ note.content }}</div>
                <div class="note-footer">
                  <span class="note-date">{{ formatDateTime(note.createdAt) }}</span>
                  <button class="icon-btn" (click)="deleteNote(note.id)">
                    <span class="material-icons-round">delete_outline</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </section>
      } @else if (loading()) {
        <div class="loading">Lade…</div>
      } @else {
        <div class="empty-state">
          <span class="material-icons-round">error_outline</span>
          <h3>Person nicht gefunden</h3>
          <button mat-button (click)="back()">Zurück</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail { padding-bottom: 80px; }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .header-avatar {
      width: 48px; height: 48px; flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #3949ab, #7986cb);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: white;
    }

    .header-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      &:hover { color: #9fa8da; }
    }

    .header-sub {
      margin: 2px 0 0;
      font-size: 13px;
      color: rgba(255,255,255,0.5);
    }

    .inline-edit {
      font-size: 18px;
      font-weight: 600;
      background: rgba(255,255,255,0.08);
      border: 1px solid #7986cb;
      border-radius: 6px;
      padding: 4px 8px;
      color: #e0e0e0;
      font-family: inherit;
      outline: none;
      width: 100%;
    }

    .quick-note-bar {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .note-input {
      flex: 1;
      padding: 10px 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #e0e0e0;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      &:focus { border-color: rgba(121,134,203,0.6); }
    }

    .note-submit {
      background: #3949ab;
      border: none;
      border-radius: 10px;
      width: 42px;
      cursor: pointer;
      color: white;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      &:disabled { opacity: 0.4; cursor: default; }
      .material-icons-round { font-size: 18px; }
    }

    .section {
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }

    .small-btn { width: 28px; height: 28px; line-height: 28px; }

    .facts-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .fact-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      font-size: 13px;
      color: rgba(255,255,255,0.75);

      .material-icons-round { font-size: 14px; color: #7986cb; }
      .fact-key { color: rgba(255,255,255,0.45); }

      &.removable {
        cursor: pointer;
        .remove-icon { display: none; font-size: 12px; }
        &:hover .remove-icon { display: inline; }
      }
    }

    .add-fact-form {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
      align-items: center;
    }

    .mini-input {
      padding: 7px 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      min-width: 120px;
      &:focus { border-color: #7986cb; }
    }

    .checkbox-label {
      display: flex; align-items: center; gap: 4px;
      font-size: 13px; cursor: pointer;
    }

    .event-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
    }

    .event-icon { color: #7986cb; font-size: 18px; }

    .event-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .event-title { font-size: 14px; font-weight: 500; }
    .event-date { font-size: 12px; color: rgba(255,255,255,0.45); }

    .notes-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }

    .note-item {
      padding: 10px 12px;
      background: rgba(255,255,255,0.04);
      border-radius: 8px;
      border-left: 2px solid rgba(121,134,203,0.4);
    }

    .note-content { font-size: 14px; line-height: 1.5; word-break: break-word; }

    .note-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
    }

    .note-date { font-size: 11px; color: rgba(255,255,255,0.35); }

    .icon-btn {
      background: none; border: none; cursor: pointer;
      padding: 2px; color: rgba(255,255,255,0.3);
      .material-icons-round { font-size: 16px; }
      &:hover { color: #ef5350; }
    }

    .muted-text { font-size: 13px; color: rgba(255,255,255,0.3); margin: 4px 0; }
    .loading { padding: 40px; text-align: center; color: rgba(255,255,255,0.4); }
  `],
})
export class PersonDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly sync = inject(SyncService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  person = signal<PersonWithRelations | null>(null);
  loading = signal(true);
  editingName = signal(false);
  nameEdit = signal('');
  noteInput = signal('');
  showAddFact = signal(false);
  showAddEvent = signal(false);
  factKey = signal('');
  factValue = signal('');
  eventTitle = signal('');
  eventDate = signal('');
  eventRecurring = signal(false);

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    const p = await this.sync.getPerson(this.id);
    this.person.set(p ?? null);
    this.loading.set(false);
  }

  back() { this.router.navigate(['/']); }

  startEditName() {
    this.nameEdit.set(this.person()!.name);
    this.editingName.set(true);
  }

  async saveName() {
    const name = this.nameEdit().trim();
    if (!name) { this.editingName.set(false); return; }
    await this.sync.updatePerson(this.id, { name });
    this.editingName.set(false);
    await this.load();
  }

  async addNote() {
    const content = this.noteInput().trim();
    if (!content) return;
    await this.sync.addNote(this.id, content);
    this.noteInput.set('');
    await this.load();
    this.snackBar.open('Notiz gespeichert', '', { duration: 1500 });
  }

  async deleteNote(noteId: string) {
    await this.sync.deleteNote(noteId);
    await this.load();
  }

  async addFact() {
    const key = this.factKey().trim();
    const value = this.factValue().trim();
    if (!key || !value) return;
    await this.sync.addFact(this.id, key, value);
    this.factKey.set('');
    this.factValue.set('');
    this.showAddFact.set(false);
    await this.load();
  }

  async removeFact(fact: Fact) {
    await this.sync.deleteFact(fact.id);
    await this.load();
  }

  async addEvent() {
    const title = this.eventTitle().trim();
    const date = this.eventDate();
    if (!title || !date) return;
    await this.sync.addEvent(this.id, { title, date, recurring: this.eventRecurring() });
    this.eventTitle.set('');
    this.eventDate.set('');
    this.eventRecurring.set(false);
    this.showAddEvent.set(false);
    await this.load();
  }

  async removeEvent(event: CircleEvent) {
    await this.sync.deleteEvent(event.id);
    await this.load();
  }

  joinMeta(...parts: (string | undefined | null)[]): string {
    return parts.filter(p => !!p).join(' · ');
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return iso; }
  }

  formatDateTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  }
}
