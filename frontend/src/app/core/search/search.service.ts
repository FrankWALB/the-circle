import { Injectable } from '@angular/core';
import { db } from '../db/circle-db';
import { Person } from '../db/models';

@Injectable({ providedIn: 'root' })
export class SearchService {
  async search(query: string): Promise<Person[]> {
    if (!query.trim()) {
      return db.persons.orderBy('updatedAt').reverse().limit(20).toArray();
    }

    const q = query.toLowerCase().trim();
    const all = await db.persons.toArray();

    const scored = all
      .map(p => ({ person: p, score: this.score(p, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map(x => x.person);
  }

  private score(p: Person, q: string): number {
    let score = 0;
    const name = p.name.toLowerCase();
    const nick = p.nickname?.toLowerCase() ?? '';

    if (name === q) score += 100;
    else if (name.startsWith(q)) score += 60;
    else if (name.includes(q)) score += 40;
    else if (nick.includes(q)) score += 35;

    const parts = q.split(/\s+/);
    for (const part of parts) {
      if (name.includes(part)) score += 10;
      if (p.occupation?.toLowerCase().includes(part)) score += 5;
      if (p.company?.toLowerCase().includes(part)) score += 5;
    }

    return score;
  }

  fuzzyMatch(persons: Person[], query: string): Person[] {
    if (!query.trim()) return persons;
    const q = query.toLowerCase().trim();
    return persons
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.nickname?.toLowerCase().includes(q) ||
        p.occupation?.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }
}
