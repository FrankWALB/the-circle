import {
  Component, inject, signal, computed, effect, OnInit, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { SyncService } from '../../core/sync/sync.service';
import { SearchService } from '../../core/search/search.service';
import { Person } from '../../core/db/models';
import { ResolveModalComponent, ResolveModalData, ResolveModalResult } from '../../shared/resolve-modal/resolve-modal.component';
import { db } from '../../core/db/circle-db';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatRippleModule,
  ],
  template: `
    <div class="home">
      <!-- Quick Add / Search Bar -->
      <div class="search-section">
        <div class="search-bar" [class.focused]="searchFocused()">
          <span class="material-icons-round search-icon">
            {{ searchQuery() ? 'search' : 'bolt' }}
          </span>
          <input
            #searchInput
            [(ngModel)]="searchQuery"
            placeholder="Person oder Info schnell erfassen…"
            class="search-input"
            (keydown.enter)="onEnter()"
            (focus)="searchFocused.set(true)"
            (blur)="onBlur()"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            data-testid="quick-add-input"
          />
          @if (searchQuery()) {
            <button class="clear-btn" (click)="clearSearch()">
              <span class="material-icons-round">close</span>
            </button>
          }
        </div>

        @if (searchQuery() && !isCommand()) {
          <div class="quick-hint">
            <span class="material-icons-round">keyboard_return</span>
            Enter — Person zuordnen & Notiz speichern
          </div>
        }
      </div>

      <!-- Search Results / Person List -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="32" />
        </div>
      } @else if (persons().length === 0 && !searchQuery()) {
        <div class="empty-state">
          <span class="material-icons-round">group</span>
          <h3>Noch keine Personen</h3>
          <p>Schreibe etwas oben und drücke Enter</p>
        </div>
      } @else if (persons().length === 0 && searchQuery()) {
        <div class="empty-state">
          <span class="material-icons-round">search_off</span>
          <h3>Keine Treffer</h3>
          <p>Enter zum Anlegen einer neuen Person</p>
        </div>
      } @else {
        <div class="persons-header">
          <span class="section-title">
            {{ searchQuery() ? 'Suchergebnisse' : 'Zuletzt bearbeitet' }}
          </span>
          <span class="count-badge">{{ persons().length }}</span>
        </div>

        <div class="persons-list" data-testid="persons-list">
          @for (person of persons(); track person.id) {
            <div
              class="person-card"
              matRipple
              (click)="openPerson(person)"
              data-testid="person-card"
            >
              <div class="person-avatar">{{ person.name[0].toUpperCase() }}</div>
              <div class="person-info">
                <div class="person-name">{{ person.name }}</div>
                @if (person.occupation || person.company) {
                  <div class="person-meta">
                    {{ joinMeta(person.occupation, person.company) }}
                  </div>
                }
              </div>
              <div class="person-updated">
                {{ relativeTime(person.updatedAt) }}
              </div>
              <span class="material-icons-round chevron">chevron_right</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .home { padding: 0 0 80px; }

    .search-section {
      padding: 16px;
      position: sticky;
      top: 0;
      background: rgba(15,15,15,0.97);
      backdrop-filter: blur(8px);
      z-index: 10;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      transition: border-color 0.2s, background 0.2s;

      &.focused {
        border-color: rgba(121,134,203,0.6);
        background: rgba(255,255,255,0.08);
      }
    }

    .search-icon {
      color: rgba(255,255,255,0.4);
      font-size: 20px;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #e0e0e0;
      font-size: 16px;
      font-family: inherit;
      &::placeholder { color: rgba(255,255,255,0.3); }
    }

    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      color: rgba(255,255,255,0.4);
      display: flex;
      .material-icons-round { font-size: 18px; }
    }

    .quick-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 4px 0;
      font-size: 12px;
      color: rgba(255,255,255,0.35);
      .material-icons-round { font-size: 14px; }
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .persons-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px 4px;
    }

    .count-badge {
      font-size: 11px;
      color: rgba(255,255,255,0.35);
    }

    .persons-list {
      padding: 4px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .person-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.05);
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.07); }
    }

    .person-avatar {
      width: 40px; height: 40px; flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #3949ab, #7986cb);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; color: white;
    }

    .person-info { flex: 1; min-width: 0; }

    .person-name {
      font-size: 15px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .person-meta {
      font-size: 12px;
      color: rgba(255,255,255,0.45);
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .person-updated {
      font-size: 11px;
      color: rgba(255,255,255,0.3);
      flex-shrink: 0;
    }

    .chevron {
      color: rgba(255,255,255,0.2);
      font-size: 18px;
    }
  `],
})
export class HomeComponent implements OnInit {
  private readonly sync = inject(SyncService);
  private readonly search = inject(SearchService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  searchQuery = signal('');
  searchFocused = signal(false);
  loading = signal(true);
  allPersons = signal<Person[]>([]);

  persons = computed(() => {
    const q = this.searchQuery().trim();
    if (!q) return this.allPersons();
    return this.search.fuzzyMatch(this.allPersons(), q);
  });

  isCommand = computed(() => this.searchQuery().trim().startsWith('/'));

  ngOnInit() {
    this.loadPersons();
    // live updates from Dexie
    from(liveQuery(() => db.persons.orderBy('updatedAt').reverse().toArray()))
      .subscribe(persons => {
        this.allPersons.set(persons);
        this.loading.set(false);
      });
  }

  async loadPersons() {
    const persons = await this.sync.getPersons();
    this.allPersons.set(persons);
    this.loading.set(false);
  }

  onBlur() {
    setTimeout(() => this.searchFocused.set(false), 200);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchInputRef?.nativeElement.focus();
  }

  async onEnter() {
    const text = this.searchQuery().trim();
    if (!text) return;

    const candidates = this.search.fuzzyMatch(this.allPersons(), text);

    const ref = this.dialog.open<ResolveModalComponent, ResolveModalData, ResolveModalResult>(
      ResolveModalComponent,
      { data: { text, candidates }, maxWidth: '500px', width: '95vw' },
    );

    const result = await ref.afterClosed().toPromise();
    if (!result) return;

    if (result.action === 'existing' && result.person) {
      await this.sync.addNote(result.person.id, result.noteText);
      this.searchQuery.set('');
      this.snackBar.open(`Notiz zu ${result.person.name} gespeichert`, '', { duration: 2500 });
      this.router.navigate(['/persons', result.person.id]);
    } else if (result.action === 'new' && result.newName) {
      const person = await this.sync.createPerson({ name: result.newName });
      if (result.noteText.trim() && result.noteText !== result.newName) {
        await this.sync.addNote(person.id, result.noteText);
      }
      this.searchQuery.set('');
      this.snackBar.open(`${result.newName} angelegt`, '', { duration: 2500 });
      this.router.navigate(['/persons', person.id]);
    }
  }

  openPerson(person: Person) {
    this.router.navigate(['/persons', person.id]);
  }

  joinMeta(...parts: (string | undefined | null)[]): string {
    return parts.filter(p => !!p).join(' · ');
  }

  relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'gerade';
    if (m < 60) return `vor ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `vor ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `vor ${d}d`;
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }
}
