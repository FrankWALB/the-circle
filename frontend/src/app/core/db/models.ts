export interface Person {
  id: string;
  userId: string;
  name: string;
  nickname?: string;
  occupation?: string;
  company?: string;
  birthday?: string;
  location?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface Note {
  id: string;
  personId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface Fact {
  id: string;
  personId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface CircleEvent {
  id: string;
  personId: string;
  title: string;
  date: string;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface SyncQueueEntry {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  resourceType: 'person' | 'note' | 'fact' | 'event';
  resourceId: string;
  parentId?: string;
  payload?: unknown;
  timestamp: number;
  retries: number;
}

export interface PersonWithRelations extends Person {
  notes: Note[];
  facts: Fact[];
  events: CircleEvent[];
}
