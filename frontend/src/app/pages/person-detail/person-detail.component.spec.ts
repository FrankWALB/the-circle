jest.mock('../../db', () => ({ db: {} }));
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import { PersonDetailComponent } from './person-detail.component';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const PERSON_ID = 'p1';

function makeRoute(id = PERSON_ID) {
  return { snapshot: { paramMap: { get: () => id } } };
}
function makeRouter() { return { navigate: jest.fn() }; }

function makePersonsSvc(person?: any) {
  return {
    getOne:  jest.fn().mockResolvedValue(person ?? { id: PERSON_ID, name: 'Alice', notes: '' }),
    update:  jest.fn().mockResolvedValue(undefined),
    delete:  jest.fn().mockResolvedValue(undefined),
    getAll:  jest.fn().mockResolvedValue([]),
    create:  jest.fn(),
  };
}
function makeFactsSvc(facts: any[] = []) {
  return {
    getByPerson:     jest.fn().mockResolvedValue(facts),
    create:          jest.fn().mockResolvedValue({ id: 'f1' }),
    delete:          jest.fn().mockResolvedValue(undefined),
    parseQuickInput: jest.fn().mockReturnValue({ key: 'Notiz', value: 'test', category: 'notes' }),
  };
}
function makeEventsSvc(events: any[] = []) {
  return {
    getByPerson: jest.fn().mockResolvedValue(events),
    create:      jest.fn().mockResolvedValue({ id: 'e1' }),
    delete:      jest.fn().mockResolvedValue(undefined),
    getUpcoming: jest.fn().mockReturnValue([]),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PersonDetailComponent', () => {
  let component:  PersonDetailComponent;
  let personsSvc: ReturnType<typeof makePersonsSvc>;
  let factsSvc:   ReturnType<typeof makeFactsSvc>;
  let eventsSvc:  ReturnType<typeof makeEventsSvc>;
  let router:     ReturnType<typeof makeRouter>;

  beforeEach(async () => {
    jest.clearAllMocks();
    personsSvc = makePersonsSvc();
    factsSvc   = makeFactsSvc();
    eventsSvc  = makeEventsSvc();
    router     = makeRouter();
    component  = new PersonDetailComponent(
      makeRoute() as any,
      router as any,
      personsSvc as any,
      factsSvc as any,
      eventsSvc as any,
    );
    await component.ngOnInit();
  });

  // ── ngOnInit ────────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads the person, facts, and events', () => {
      expect(personsSvc.getOne).toHaveBeenCalledWith(PERSON_ID);
      expect(factsSvc.getByPerson).toHaveBeenCalledWith(PERSON_ID);
      expect(eventsSvc.getByPerson).toHaveBeenCalledWith(PERSON_ID);
    });

    it('sets person to undefined when the person is not found', async () => {
      personsSvc.getOne.mockResolvedValue(undefined);
      const c = new PersonDetailComponent(
        makeRoute('missing') as any,
        router as any,
        personsSvc as any,
        factsSvc as any,
        eventsSvc as any,
      );
      await c.ngOnInit();
      expect(c.person).toBeUndefined();
    });
  });

  // ── addFact ─────────────────────────────────────────────────────────────────

  describe('addFact', () => {
    it('parses the input and calls factsService.create', async () => {
      factsSvc.parseQuickInput.mockReturnValue({ key: 'Beruf', value: 'Pilot', category: 'work' });
      component.quickFact = 'Beruf: Pilot';

      await component.addFact();

      expect(factsSvc.parseQuickInput).toHaveBeenCalledWith('Beruf: Pilot');
      expect(factsSvc.create).toHaveBeenCalledWith(PERSON_ID, 'Beruf', 'Pilot', 'work');
    });

    it('reloads the facts list after adding', async () => {
      const newFacts = [{ id: 'f1', key: 'Beruf', value: 'Pilot' }];
      factsSvc.getByPerson.mockResolvedValue(newFacts);
      component.quickFact = 'Beruf: Pilot';

      await component.addFact();

      expect(component.facts).toEqual(newFacts);
    });

    it('clears the input after adding', async () => {
      component.quickFact = 'Hobby: Lesen';
      await component.addFact();
      expect(component.quickFact).toBe('');
    });

    it('does nothing when the input is empty', async () => {
      component.quickFact = '';
      await component.addFact();
      expect(factsSvc.create).not.toHaveBeenCalled();
    });
  });

  // ── deleteFact ──────────────────────────────────────────────────────────────

  describe('deleteFact', () => {
    it('calls factsService.delete with the fact id', async () => {
      const fact = { id: 'f1', key: 'Beruf', value: 'Pilot' } as any;
      await component.deleteFact(fact);
      expect(factsSvc.delete).toHaveBeenCalledWith('f1');
    });

    it('reloads the facts list after deleting', async () => {
      factsSvc.getByPerson.mockResolvedValue([]);
      await component.deleteFact({ id: 'f1' } as any);
      expect(component.facts).toEqual([]);
    });
  });

  // ── addEvent ────────────────────────────────────────────────────────────────

  describe('addEvent', () => {
    it('calls eventsService.create with title, date, and non-recurring flag', async () => {
      component.newEventTitle = 'Geburtstag';
      component.newEventDate  = '1990-03-15';

      await component.addEvent();

      expect(eventsSvc.create).toHaveBeenCalledWith(PERSON_ID, 'Geburtstag', '1990-03-15', false);
    });

    it('clears the input fields after adding', async () => {
      component.newEventTitle = 'Geburtstag';
      component.newEventDate  = '1990-03-15';
      await component.addEvent();
      expect(component.newEventTitle).toBe('');
      expect(component.newEventDate).toBe('');
    });

    it('does nothing when the title is missing', async () => {
      component.newEventTitle = '';
      component.newEventDate  = '1990-03-15';
      await component.addEvent();
      expect(eventsSvc.create).not.toHaveBeenCalled();
    });

    it('does nothing when the date is missing', async () => {
      component.newEventTitle = 'Geburtstag';
      component.newEventDate  = '';
      await component.addEvent();
      expect(eventsSvc.create).not.toHaveBeenCalled();
    });
  });

  // ── deleteEvent ─────────────────────────────────────────────────────────────

  describe('deleteEvent', () => {
    it('calls eventsService.delete with the event id', async () => {
      const event = { id: 'e1', title: 'Geburtstag' } as any;
      await component.deleteEvent(event);
      expect(eventsSvc.delete).toHaveBeenCalledWith('e1');
    });

    it('reloads the events list after deleting', async () => {
      eventsSvc.getByPerson.mockResolvedValue([]);
      await component.deleteEvent({ id: 'e1' } as any);
      expect(component.events).toEqual([]);
    });
  });

  // ── saveNotes ───────────────────────────────────────────────────────────────

  describe('saveNotes', () => {
    it('calls personsService.update with the current notes', async () => {
      component.person!.notes = 'Neues Notizbuch';
      await component.saveNotes();
      expect(personsSvc.update).toHaveBeenCalledWith(PERSON_ID, { notes: 'Neues Notizbuch' });
    });
  });

  // ── deletePerson ────────────────────────────────────────────────────────────

  describe('deletePerson', () => {
    it('deletes the person and navigates home after confirmation', async () => {
      global.confirm = jest.fn().mockReturnValue(true);

      await component.deletePerson();

      expect(personsSvc.delete).toHaveBeenCalledWith(PERSON_ID);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('does nothing when the user cancels the confirmation', async () => {
      global.confirm = jest.fn().mockReturnValue(false);

      await component.deletePerson();

      expect(personsSvc.delete).not.toHaveBeenCalled();
    });
  });
});
