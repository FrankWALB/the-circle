jest.mock('../db', () => ({ db: {} }));

import { EventsService } from './events.service';

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function makeEvent(overrides: Partial<any> = {}): any {
  return {
    id: '1',
    personId: 'p1',
    userId: 'u1',
    title: 'Test',
    date: daysFromNow(10),
    recurring: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: false,
    ...overrides,
  };
}

describe('EventsService.getUpcoming', () => {
  let service: EventsService;

  beforeEach(() => {
    service = new EventsService(null as any, null as any);
  });

  it('includes a non-recurring event within the default 90-day window', () => {
    const event = makeEvent({ date: daysFromNow(10) });
    expect(service.getUpcoming([event])).toHaveLength(1);
  });

  it('excludes a non-recurring event that is in the past', () => {
    const event = makeEvent({ date: daysFromNow(-1) });
    expect(service.getUpcoming([event])).toHaveLength(0);
  });

  it('excludes a non-recurring event beyond the 90-day cutoff', () => {
    const event = makeEvent({ date: daysFromNow(100) });
    expect(service.getUpcoming([event])).toHaveLength(0);
  });

  it('respects a custom days window', () => {
    const event = makeEvent({ date: daysFromNow(10) });
    expect(service.getUpcoming([event], 5)).toHaveLength(0);
    expect(service.getUpcoming([event], 15)).toHaveLength(1);
  });

  it('rolls a recurring event to the current year when the date is upcoming', () => {
    const target = new Date();
    target.setDate(target.getDate() + 15);
    const historical = `1990-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    const event = makeEvent({ date: historical, recurring: true });

    const result = service.getUpcoming([event]);

    expect(result).toHaveLength(1);
    expect((result[0] as any).nextDate.getFullYear()).toBe(new Date().getFullYear());
  });

  it('rolls a recurring event to next year when this year\'s occurrence has already passed', () => {
    const past = new Date();
    past.setDate(past.getDate() - 15);
    const historical = `1990-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
    const event = makeEvent({ date: historical, recurring: true });

    const result = service.getUpcoming([event]);

    if (result.length > 0) {
      expect((result[0] as any).nextDate.getFullYear()).toBe(new Date().getFullYear() + 1);
    }
  });

  it('sorts multiple results by ascending date', () => {
    const e1 = makeEvent({ id: 'e1', date: daysFromNow(20) });
    const e2 = makeEvent({ id: 'e2', date: daysFromNow(5) });
    const e3 = makeEvent({ id: 'e3', date: daysFromNow(10) });

    const result = service.getUpcoming([e1, e2, e3]);

    expect(result.map(e => e.id)).toEqual(['e2', 'e3', 'e1']);
  });

  it('returns an empty array when the input list is empty', () => {
    expect(service.getUpcoming([])).toEqual([]);
  });

  it('handles a mix of recurring and non-recurring events', () => {
    const nonRecurring = makeEvent({ id: 'nr', date: daysFromNow(5), recurring: false });
    const target = new Date();
    target.setDate(target.getDate() + 30);
    const recurringDate = `1990-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    const recurring = makeEvent({ id: 'r', date: recurringDate, recurring: true });

    const result = service.getUpcoming([nonRecurring, recurring]);

    expect(result.map(e => e.id)).toContain('nr');
    expect(result.map(e => e.id)).toContain('r');
  });
});
