jest.mock('../../db', () => ({ db: {} }));
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import { BriefingComponent } from './briefing.component';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const PERSON_ID = 'p1';

function makeRoute(id = PERSON_ID) {
  return { snapshot: { paramMap: { get: () => id } } };
}
function makeRouter() { return { navigate: jest.fn() }; }

function makePersonsSvc(person?: any) {
  return {
    getOne: jest.fn().mockResolvedValue(person ?? { id: PERSON_ID, name: 'Alice', notes: 'Ein Test.' }),
  };
}
function makeFactsSvc(facts: any[] = []) {
  return { getByPerson: jest.fn().mockResolvedValue(facts) };
}
function makeEventsSvc(events: any[] = [], upcoming: any[] = []) {
  return {
    getByPerson: jest.fn().mockResolvedValue(events),
    getUpcoming: jest.fn().mockReturnValue(upcoming),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BriefingComponent', () => {
  let component:  BriefingComponent;
  let personsSvc: ReturnType<typeof makePersonsSvc>;
  let factsSvc:   ReturnType<typeof makeFactsSvc>;
  let eventsSvc:  ReturnType<typeof makeEventsSvc>;

  beforeEach(() => {
    jest.clearAllMocks();
    personsSvc = makePersonsSvc();
    factsSvc   = makeFactsSvc();
    eventsSvc  = makeEventsSvc();
    component  = new BriefingComponent(
      makeRoute() as any,
      makeRouter() as any,
      personsSvc as any,
      factsSvc as any,
      eventsSvc as any,
    );
  });

  // ── ngOnInit ────────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads person, facts, and events from the respective services', async () => {
      await component.ngOnInit();

      expect(personsSvc.getOne).toHaveBeenCalledWith(PERSON_ID);
      expect(factsSvc.getByPerson).toHaveBeenCalledWith(PERSON_ID);
      expect(eventsSvc.getByPerson).toHaveBeenCalledWith(PERSON_ID);
    });

    it('calls getUpcoming to compute the upcoming events list', async () => {
      const events   = [{ id: 'e1', title: 'Geburtstag', date: '1990-03-15', recurring: true }];
      const upcoming = [{ id: 'e1', title: 'Geburtstag', nextDate: new Date() }];
      eventsSvc = makeEventsSvc(events, upcoming);
      component = new BriefingComponent(
        makeRoute() as any, makeRouter() as any,
        personsSvc as any, factsSvc as any, eventsSvc as any,
      );

      await component.ngOnInit();

      expect(eventsSvc.getUpcoming).toHaveBeenCalledWith(events);
      expect(component.upcoming).toEqual(upcoming);
    });

    it('does not load data when the person is not found', async () => {
      personsSvc.getOne.mockResolvedValue(undefined);

      await component.ngOnInit();

      expect(factsSvc.getByPerson).not.toHaveBeenCalled();
      expect(eventsSvc.getByPerson).not.toHaveBeenCalled();
    });
  });

  // ── facts data ──────────────────────────────────────────────────────────────

  describe('facts display', () => {
    it('exposes all facts on the component', async () => {
      const facts = [
        { id: 'f1', key: 'Beruf', value: 'Pilot',      updatedAt: '2025-01-10T00:00:00Z' },
        { id: 'f2', key: 'Hobby', value: 'Klettern',   updatedAt: '2025-01-05T00:00:00Z' },
      ];
      factsSvc = makeFactsSvc(facts);
      component = new BriefingComponent(
        makeRoute() as any, makeRouter() as any,
        personsSvc as any, factsSvc as any, eventsSvc as any,
      );

      await component.ngOnInit();

      expect(component.facts).toHaveLength(2);
    });

    it('exposes up to 5 most-recently-updated facts as recentFacts', async () => {
      const facts = Array.from({ length: 7 }, (_, i) => ({
        id: `f${i}`, key: `Key${i}`, value: `Val${i}`,
        updatedAt: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      }));
      factsSvc = makeFactsSvc(facts);
      component = new BriefingComponent(
        makeRoute() as any, makeRouter() as any,
        personsSvc as any, factsSvc as any, eventsSvc as any,
      );

      await component.ngOnInit();

      expect(component.recentFacts).toHaveLength(5);
    });

    it('sorts recentFacts by updatedAt descending', async () => {
      const facts = [
        { id: 'f1', key: 'A', value: '1', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'f2', key: 'B', value: '2', updatedAt: '2025-03-01T00:00:00Z' },
        { id: 'f3', key: 'C', value: '3', updatedAt: '2025-02-01T00:00:00Z' },
      ];
      factsSvc = makeFactsSvc(facts);
      component = new BriefingComponent(
        makeRoute() as any, makeRouter() as any,
        personsSvc as any, factsSvc as any, eventsSvc as any,
      );

      await component.ngOnInit();

      expect(component.recentFacts[0].id).toBe('f2');
      expect(component.recentFacts[1].id).toBe('f3');
      expect(component.recentFacts[2].id).toBe('f1');
    });
  });

  // ── upcoming events ─────────────────────────────────────────────────────────

  describe('upcoming events', () => {
    it('passes all events to getUpcoming and stores the result', async () => {
      const events   = [{ id: 'e1', title: 'Geburtstag', date: '1990-06-15', recurring: true }];
      const upcoming = [{ id: 'e1', title: 'Geburtstag', nextDate: new Date() }];
      eventsSvc = makeEventsSvc(events, upcoming);
      component = new BriefingComponent(
        makeRoute() as any, makeRouter() as any,
        personsSvc as any, factsSvc as any, eventsSvc as any,
      );

      await component.ngOnInit();

      expect(component.upcoming).toEqual(upcoming);
    });

    it('stores an empty array when no events are upcoming', async () => {
      eventsSvc = makeEventsSvc([], []);
      component = new BriefingComponent(
        makeRoute() as any, makeRouter() as any,
        personsSvc as any, factsSvc as any, eventsSvc as any,
      );

      await component.ngOnInit();

      expect(component.upcoming).toEqual([]);
    });
  });
});
