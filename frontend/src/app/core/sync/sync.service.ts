import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { db } from '../db/circle-db';
import { Person, Note, Fact, CircleEvent, PersonWithRelations, SyncQueueEntry } from '../db/models';
import { v4 as uuid } from 'uuid';

// User is identified by a fixed local ID for MVP; replaced by JWT sub in auth phase.
const USER_ID = 'default-user';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';
  private readonly headers = { 'x-user-id': USER_ID };

  // ── Local CRUD (offline-first) ─────────────────────────────────────────────

  async getPersons(): Promise<Person[]> {
    return db.persons.orderBy('updatedAt').reverse().toArray();
  }

  async getPerson(id: string): Promise<PersonWithRelations | undefined> {
    const person = await db.persons.get(id);
    if (!person) return undefined;
    const [notes, facts, events] = await Promise.all([
      db.notes.where('personId').equals(id).reverse().sortBy('createdAt'),
      db.facts.where('personId').equals(id).toArray(),
      db.events.where('personId').equals(id).sortBy('date'),
    ]);
    return { ...person, notes, facts, events };
  }

  async createPerson(data: Partial<Person>): Promise<Person> {
    const now = new Date().toISOString();
    const person: Person = {
      id: uuid(),
      userId: USER_ID,
      name: data.name ?? '',
      nickname: data.nickname,
      occupation: data.occupation,
      company: data.company,
      birthday: data.birthday,
      location: data.location,
      phone: data.phone,
      email: data.email,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    await db.persons.add(person);
    await this.enqueuePush('create', 'person', person.id, undefined, person);
    this.trySync();
    return person;
  }

  async updatePerson(id: string, data: Partial<Person>): Promise<void> {
    const now = new Date().toISOString();
    await db.persons.update(id, { ...data, updatedAt: now, synced: false });
    const person = await db.persons.get(id);
    await this.enqueuePush('update', 'person', id, undefined, person);
    this.trySync();
  }

  async deletePerson(id: string): Promise<void> {
    await db.transaction('rw', [db.persons, db.notes, db.facts, db.events], async () => {
      await db.notes.where('personId').equals(id).delete();
      await db.facts.where('personId').equals(id).delete();
      await db.events.where('personId').equals(id).delete();
      await db.persons.delete(id);
    });
    await this.enqueuePush('delete', 'person', id);
    this.trySync();
  }

  async addNote(personId: string, content: string): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = { id: uuid(), personId, content, createdAt: now, updatedAt: now, synced: false };
    await db.notes.add(note);
    await db.persons.update(personId, { updatedAt: now });
    await this.enqueuePush('create', 'note', note.id, personId, note);
    this.trySync();
    return note;
  }

  async updateNote(noteId: string, content: string): Promise<void> {
    const now = new Date().toISOString();
    await db.notes.update(noteId, { content, updatedAt: now, synced: false });
    const note = await db.notes.get(noteId);
    if (note) {
      await this.enqueuePush('update', 'note', noteId, note.personId, { content });
    }
    this.trySync();
  }

  async deleteNote(noteId: string): Promise<void> {
    const note = await db.notes.get(noteId);
    if (!note) return;
    await db.notes.delete(noteId);
    await this.enqueuePush('delete', 'note', noteId, note.personId);
    this.trySync();
  }

  async addFact(personId: string, key: string, value: string): Promise<Fact> {
    const now = new Date().toISOString();
    const fact: Fact = { id: uuid(), personId, key, value, createdAt: now, updatedAt: now, synced: false };
    await db.facts.add(fact);
    await this.enqueuePush('create', 'fact', fact.id, personId, fact);
    this.trySync();
    return fact;
  }

  async updateFact(factId: string, value: string): Promise<void> {
    const now = new Date().toISOString();
    await db.facts.update(factId, { value, updatedAt: now, synced: false });
    const fact = await db.facts.get(factId);
    if (fact) await this.enqueuePush('update', 'fact', factId, fact.personId, { value });
    this.trySync();
  }

  async deleteFact(factId: string): Promise<void> {
    const fact = await db.facts.get(factId);
    if (!fact) return;
    await db.facts.delete(factId);
    await this.enqueuePush('delete', 'fact', factId, fact.personId);
    this.trySync();
  }

  async addEvent(personId: string, data: Partial<CircleEvent>): Promise<CircleEvent> {
    const now = new Date().toISOString();
    const event: CircleEvent = {
      id: uuid(), personId,
      title: data.title ?? '',
      date: data.date ?? now,
      recurring: data.recurring ?? false,
      createdAt: now, updatedAt: now, synced: false,
    };
    await db.events.add(event);
    await this.enqueuePush('create', 'event', event.id, personId, event);
    this.trySync();
    return event;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const event = await db.events.get(eventId);
    if (!event) return;
    await db.events.delete(eventId);
    await this.enqueuePush('delete', 'event', eventId, event.personId);
    this.trySync();
  }

  // ── Sync queue ─────────────────────────────────────────────────────────────

  private async enqueuePush(
    operation: 'create' | 'update' | 'delete',
    resourceType: 'person' | 'note' | 'fact' | 'event',
    resourceId: string,
    parentId?: string,
    payload?: unknown,
  ) {
    await db.syncQueue.add({ operation, resourceType, resourceId, parentId, payload, timestamp: Date.now(), retries: 0 });
  }

  startAutoSync() {
    window.addEventListener('online', () => this.trySync());
    this.trySync();
    setInterval(() => this.trySync(), 30_000);
  }

  async trySync() {
    if (!navigator.onLine) return;
    await this.pullFromServer();
    await this.flushQueue();
  }

  private async flushQueue() {
    const entries = await db.syncQueue.orderBy('timestamp').toArray();
    for (const entry of entries) {
      try {
        await this.pushEntry(entry);
        await db.syncQueue.delete(entry.id!);
      } catch {
        if (entry.retries >= 3) await db.syncQueue.delete(entry.id!);
        else await db.syncQueue.update(entry.id!, { retries: entry.retries + 1 });
      }
    }
  }

  private async pushEntry(entry: SyncQueueEntry) {
    const h = this.headers;
    switch (entry.resourceType) {
      case 'person':
        if (entry.operation === 'create')
          await firstValueFrom(this.http.post(`${this.base}/persons`, entry.payload, { headers: h }));
        else if (entry.operation === 'update')
          await firstValueFrom(this.http.put(`${this.base}/persons/${entry.resourceId}`, entry.payload, { headers: h }));
        else
          await firstValueFrom(this.http.delete(`${this.base}/persons/${entry.resourceId}`, { headers: h }));
        break;
      case 'note':
        if (entry.operation === 'create')
          await firstValueFrom(this.http.post(`${this.base}/persons/${entry.parentId}/notes`, entry.payload, { headers: h }));
        else if (entry.operation === 'update')
          await firstValueFrom(this.http.put(`${this.base}/persons/${entry.parentId}/notes/${entry.resourceId}`, entry.payload, { headers: h }));
        else
          await firstValueFrom(this.http.delete(`${this.base}/persons/${entry.parentId}/notes/${entry.resourceId}`, { headers: h }));
        break;
      case 'fact':
        if (entry.operation === 'create')
          await firstValueFrom(this.http.post(`${this.base}/persons/${entry.parentId}/facts`, entry.payload, { headers: h }));
        else if (entry.operation === 'update')
          await firstValueFrom(this.http.put(`${this.base}/persons/${entry.parentId}/facts/${entry.resourceId}`, entry.payload, { headers: h }));
        else
          await firstValueFrom(this.http.delete(`${this.base}/persons/${entry.parentId}/facts/${entry.resourceId}`, { headers: h }));
        break;
      case 'event':
        if (entry.operation === 'create')
          await firstValueFrom(this.http.post(`${this.base}/persons/${entry.parentId}/events`, entry.payload, { headers: h }));
        else
          await firstValueFrom(this.http.delete(`${this.base}/persons/${entry.parentId}/events/${entry.resourceId}`, { headers: h }));
        break;
    }
  }

  private async pullFromServer() {
    try {
      const persons = await firstValueFrom(
        this.http.get<PersonWithRelations[]>(`${this.base}/persons`, { headers: this.headers }),
      );
      await db.transaction('rw', [db.persons, db.notes, db.facts, db.events], async () => {
        for (const p of persons) {
          const local = await db.persons.get(p.id);
          if (!local || new Date(p.updatedAt) > new Date(local.updatedAt)) {
            const { notes, facts, events, ...personData } = p;
            await db.persons.put({ ...personData, synced: true });
            for (const n of notes) await db.notes.put({ ...n, synced: true });
            for (const f of facts) await db.facts.put({ ...f, synced: true });
            for (const e of events) await db.events.put({ ...e, synced: true });
          }
        }
      });
    } catch {
      // offline or server error — use local data
    }
  }
}
