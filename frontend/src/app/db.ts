import Dexie, { Table } from 'dexie';

export interface Person {
  id: string;
  userId: string;
  name: string;
  occupation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface Fact {
  id: string;
  personId: string;
  userId: string;
  key: string;
  value: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface CircleEvent {
  id: string;
  personId: string;
  userId: string;
  title: string;
  date: string;
  recurring: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export class CircleDb extends Dexie {
  persons!: Table<Person>;
  facts!: Table<Fact>;
  events!: Table<CircleEvent>;

  constructor() {
    super('circle-db');
    this.version(1).stores({
      persons: 'id, userId, name, updatedAt',
      facts: 'id, personId, userId, key, updatedAt',
      events: 'id, personId, userId, date, updatedAt',
    });
  }
}

export const db = new CircleDb();
