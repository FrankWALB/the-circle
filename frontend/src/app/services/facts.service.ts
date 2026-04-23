import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { db, Fact } from '../db';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class FactsService {
  constructor(private http: HttpClient, private userService: UserService) {}

  async getByPerson(personId: string): Promise<Fact[]> {
    const userId = this.userService.userId;
    return db.facts.where('personId').equals(personId).filter(f => f.userId === userId).toArray();
  }

  async create(personId: string, key: string, value: string, category?: string): Promise<Fact> {
    const userId = this.userService.userId;
    const now = new Date().toISOString();
    const fact: Fact = {
      id: uuidv4(),
      personId,
      userId,
      key,
      value,
      category,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    await db.facts.put(fact);
    if (navigator.onLine) {
      try {
        const saved = await this.http.post<Fact>(`${environment.apiUrl}/facts`, fact).toPromise();
        if (saved) await db.facts.put({ ...saved, synced: true });
      } catch (err) {
        console.warn('[FactsService] create sync failed:', err);
      }
    }
    return fact;
  }

  async delete(id: string): Promise<void> {
    await db.facts.delete(id);
    if (navigator.onLine) {
      try {
        await this.http.delete(`${environment.apiUrl}/facts/${id}`).toPromise();
      } catch (err) {
        console.warn('[FactsService] delete sync failed:', err);
      }
    }
  }

  parseQuickInput(input: string): { key: string; value: string; category?: string } {
    const predefined: Record<string, string> = {
      'kinder': 'family',
      'kind': 'family',
      'beruf': 'work',
      'job': 'work',
      'urlaub': 'travel',
      'reise': 'travel',
      'hobby': 'interests',
      'geburtstag': 'birthday',
      'telefon': 'contact',
      'email': 'contact',
    };
    const colonIdx = input.indexOf(':');
    if (colonIdx > 0) {
      const key = input.substring(0, colonIdx).trim();
      const value = input.substring(colonIdx + 1).trim();
      const category = predefined[key.toLowerCase()];
      return { key, value, category };
    }
    return { key: 'Notiz', value: input.trim(), category: 'notes' };
  }
}
