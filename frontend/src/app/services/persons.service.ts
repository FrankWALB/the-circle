import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { db, Person } from '../db';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class PersonsService {
  constructor(private http: HttpClient, private userService: UserService) {}

  async getAll(search?: string): Promise<Person[]> {
    const userId = this.userService.userId;
    let persons = await db.persons.where('userId').equals(userId).toArray();
    if (search) {
      const q = search.toLowerCase();
      persons = persons.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.occupation || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q) ||
        (p.metAt || '').toLowerCase().includes(q)
      );
    }
    return persons.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getOne(id: string): Promise<Person | undefined> {
    return db.persons.get(id);
  }

  async create(name: string, occupation?: string, notes?: string): Promise<Person> {
    const userId = this.userService.userId;
    const now = new Date().toISOString();
    const person: Person = {
      id: uuidv4(),
      userId,
      name,
      occupation,
      notes,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    await db.persons.put(person);
    if (navigator.onLine) {
      try {
        const saved = await this.http.post<Person>(`${environment.apiUrl}/persons`, person).toPromise();
        if (saved) {
          await db.persons.put({ ...saved, synced: true });
          return saved;
        }
      } catch (err) {
        console.warn('[PersonsService] create sync failed:', err);
      }
    }
    return person;
  }

  async update(id: string, updates: Partial<Person>): Promise<void> {
    const now = new Date().toISOString();
    await db.persons.update(id, { ...updates, updatedAt: now, synced: false });
    if (navigator.onLine) {
      try {
        await this.http.put(`${environment.apiUrl}/persons/${id}`, updates).toPromise();
        await db.persons.update(id, { synced: true });
      } catch (err) {
        console.warn('[PersonsService] update sync failed:', err);
      }
    }
  }

  async delete(id: string): Promise<void> {
    await db.persons.delete(id);
    if (navigator.onLine) {
      try {
        await this.http.delete(`${environment.apiUrl}/persons/${id}`).toPromise();
      } catch (err) {
        console.warn('[PersonsService] delete sync failed:', err);
      }
    }
  }
}
