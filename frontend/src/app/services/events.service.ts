import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { db, CircleEvent } from '../db';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class EventsService {
  constructor(private http: HttpClient, private userService: UserService) {}

  async getByPerson(personId: string): Promise<CircleEvent[]> {
    const userId = this.userService.userId;
    return db.events.where('personId').equals(personId).filter(e => e.userId === userId).toArray();
  }

  async create(personId: string, title: string, date: string, recurring = false, notes?: string): Promise<CircleEvent> {
    const userId = this.userService.userId;
    const now = new Date().toISOString();
    const event: CircleEvent = {
      id: uuidv4(),
      personId,
      userId,
      title,
      date,
      recurring,
      notes,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    await db.events.put(event);
    if (navigator.onLine) {
      try {
        const saved = await this.http.post<CircleEvent>(`${environment.apiUrl}/events`, event).toPromise();
        if (saved) await db.events.put({ ...saved, synced: true });
      } catch (err) {
        console.warn('[EventsService] create sync failed:', err);
      }
    }
    return event;
  }

  async delete(id: string): Promise<void> {
    await db.events.delete(id);
    if (navigator.onLine) {
      try {
        await this.http.delete(`${environment.apiUrl}/events/${id}`).toPromise();
      } catch (err) {
        console.warn('[EventsService] delete sync failed:', err);
      }
    }
  }

  getUpcoming(events: CircleEvent[], days = 90): CircleEvent[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const currentYear = now.getFullYear();
    return events
      .map(e => {
        if (!e.recurring) return { ...e, nextDate: new Date(e.date) };
        const d = new Date(e.date);
        let next = new Date(currentYear, d.getMonth(), d.getDate());
        if (next < now) next = new Date(currentYear + 1, d.getMonth(), d.getDate());
        return { ...e, nextDate: next };
      })
      .filter(e => e.nextDate <= cutoff && e.nextDate >= now)
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }
}
