import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Person } from '../../core/db/models';
import { SearchService } from '../../core/search/search.service';

export interface ResolveModalData {
  text: string;
  candidates: Person[];
}

export interface ResolveModalResult {
  action: 'existing' | 'new';
  person?: Person;
  newName?: string;
  noteText: string;
}

@Component({
  selector: 'app-resolve-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatListModule, MatDividerModule,
  ],
  template: `
    <div class="resolve-modal">
      <div class="modal-header">
        <span class="material-icons-round">person_search</span>
        <h2>Zu wem gehört das?</h2>
      </div>

      <div class="note-preview">
        <span class="material-icons-round">notes</span>
        <span class="note-text">{{ data.text }}</span>
      </div>

      @if (data.candidates.length > 0) {
        <p class="hint">Passende Personen:</p>
        <mat-list class="candidate-list">
          @for (person of data.candidates; track person.id) {
            <mat-list-item (click)="selectExisting(person)" class="candidate-item">
              <div class="candidate-avatar" matListItemAvatar>
                {{ person.name[0].toUpperCase() }}
              </div>
              <span matListItemTitle>{{ person.name }}</span>
              <span matListItemLine>{{ person.occupation ?? person.company ?? '' }}</span>
              <mat-icon matListItemMeta fontSet="material-icons-round">chevron_right</mat-icon>
            </mat-list-item>
          }
        </mat-list>
        <mat-divider />
      }

      <div class="new-person-section">
        <p class="hint">Neue Person anlegen:</p>
        <div class="new-person-input">
          <input
            [(ngModel)]="newName"
            placeholder="Name der Person"
            class="name-input"
            (keydown.enter)="createNew()"
            #nameInput
          />
          <button mat-flat-button color="primary" (click)="createNew()" [disabled]="!newName().trim()">
            <mat-icon fontSet="material-icons-round">person_add</mat-icon>
            Anlegen
          </button>
        </div>
      </div>

      <div class="modal-actions">
        <button mat-button (click)="cancel()">Abbrechen</button>
      </div>
    </div>
  `,
  styles: [`
    .resolve-modal {
      padding: 20px;
      min-width: 300px;
      max-width: 480px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;

      .material-icons-round { color: #7986cb; font-size: 22px; }
      h2 { margin: 0; font-size: 18px; font-weight: 600; }
    }

    .note-preview {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      color: rgba(255,255,255,0.7);

      .material-icons-round { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
      .note-text { line-height: 1.4; word-break: break-word; }
    }

    .hint {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin: 12px 0 4px;
    }

    .candidate-list { padding: 0; }

    .candidate-item {
      cursor: pointer;
      border-radius: 8px;
      margin-bottom: 2px;
      transition: background 0.15s;
      &:hover { background: rgba(121,134,203,0.15); }
    }

    .candidate-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #5c6bc0, #7986cb);
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 14px; color: white;
    }

    .new-person-section { margin-top: 12px; }

    .new-person-input {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .name-input {
      flex: 1;
      padding: 10px 12px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      &:focus { border-color: #7986cb; }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  `],
})
export class ResolveModalComponent {
  readonly data: ResolveModalData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ResolveModalComponent, ResolveModalResult>);

  newName = signal(this.extractName(this.data.text));

  private extractName(text: string): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= 2) return text.trim();
    return words.slice(0, 2).join(' ');
  }

  selectExisting(person: Person) {
    this.dialogRef.close({ action: 'existing', person, noteText: this.data.text });
  }

  createNew() {
    const name = this.newName().trim();
    if (!name) return;
    this.dialogRef.close({ action: 'new', newName: name, noteText: this.data.text });
  }

  cancel() {
    this.dialogRef.close();
  }
}
