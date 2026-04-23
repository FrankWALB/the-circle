import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { db } from '../db';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private syncing = false;

  constructor(private http: HttpClient, private userService: UserService) {}

  async syncAll(): Promise<void> {
    if (this.syncing || !navigator.onLine) return;
    this.syncing = true;
    try {
      await this.pullPersons();
    } catch (e) {
      console.warn('Sync failed', e);
    } finally {
      this.syncing = false;
    }
  }

  private async pullPersons(): Promise<void> {
    try {
      const persons: any[] = await firstValueFrom(
        this.http.get<any[]>(`${environment.apiUrl}/persons`)
      );
      for (const p of persons) {
        await db.persons.put({ ...p, synced: true });
        for (const f of p.facts || []) {
          await db.facts.put({ ...f, synced: true });
        }
        for (const e of p.events || []) {
          await db.events.put({ ...e, synced: true });
        }
      }
    } catch (err) {
      console.warn('[SyncService] pull failed:', err);
    }
  }
}
