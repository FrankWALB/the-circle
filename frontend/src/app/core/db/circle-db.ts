import Dexie, { Table } from 'dexie';
import { Person, Note, Fact, CircleEvent, SyncQueueEntry } from './models';

export class CircleDatabase extends Dexie {
  persons!: Table<Person, string>;
  notes!: Table<Note, string>;
  facts!: Table<Fact, string>;
  events!: Table<CircleEvent, string>;
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super('the-circle-db');

    this.version(1).stores({
      persons: 'id, userId, name, updatedAt, synced',
      notes: 'id, personId, createdAt, synced',
      facts: 'id, personId, key, synced',
      events: 'id, personId, date, synced',
      syncQueue: '++id, resourceType, resourceId, timestamp',
    });
  }
}

export const db = new CircleDatabase();
