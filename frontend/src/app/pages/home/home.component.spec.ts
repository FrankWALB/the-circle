jest.mock('../../db', () => ({ db: {} }));
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import { HomeComponent } from './home.component';

// ─── Mocks ────────────────────────────────────────────────────────────────────

function makeRouter()    { return { navigate: jest.fn() }; }
function makeDialog()    {
  const ref = { afterClosed: () => ({ subscribe: (cb: (v: unknown) => void) => cb(false) }) };
  return { open: jest.fn().mockReturnValue(ref) };
}
function makePersonsSvc(persons: any[] = []) {
  return {
    getAll:  jest.fn().mockResolvedValue(persons),
    create:  jest.fn().mockResolvedValue({ id: 'new-id', name: 'Neu' }),
    getOne:  jest.fn(),
    update:  jest.fn(),
    delete:  jest.fn(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HomeComponent', () => {
  let component: HomeComponent;
  let personsSvc: ReturnType<typeof makePersonsSvc>;
  let router:     ReturnType<typeof makeRouter>;
  let dialog:     ReturnType<typeof makeDialog>;

  beforeEach(() => {
    jest.clearAllMocks();
    personsSvc = makePersonsSvc();
    router     = makeRouter();
    dialog     = makeDialog();
    component  = new HomeComponent(personsSvc as any, router as any, dialog as any);
  });

  // ── ngOnInit ────────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads all persons on startup', async () => {
      const persons = [{ id: '1', name: 'Alice' }];
      personsSvc.getAll.mockResolvedValue(persons);

      await component.ngOnInit();

      expect(personsSvc.getAll).toHaveBeenCalledWith(undefined);
      expect(component.persons).toEqual(persons);
    });
  });

  // ── onSearch ─────────────────────────────────────────────────────────────────

  describe('onSearch', () => {
    it('reloads with the current query string', async () => {
      personsSvc.getAll.mockResolvedValue([{ id: '2', name: 'Bob' }]);
      component.query = 'Bob';

      await component.onSearch();

      expect(personsSvc.getAll).toHaveBeenCalledWith('Bob');
      expect(component.persons).toHaveLength(1);
    });

    it('passes undefined when the query is empty', async () => {
      component.query = '';
      await component.onSearch();
      expect(personsSvc.getAll).toHaveBeenCalledWith(undefined);
    });
  });

  // ── quickAdd ────────────────────────────────────────────────────────────────

  describe('quickAdd', () => {
    it('creates a person and navigates to the detail page', async () => {
      const person = { id: 'p1', name: 'Clara' };
      personsSvc.create.mockResolvedValue(person);
      component.query = 'Clara';

      await component.quickAdd();

      expect(personsSvc.create).toHaveBeenCalledWith('Clara');
      expect(router.navigate).toHaveBeenCalledWith(['/person', 'p1']);
      expect(component.query).toBe('');
    });

    it('trims the name before creating', async () => {
      component.query = '  Diana  ';
      await component.quickAdd();
      expect(personsSvc.create).toHaveBeenCalledWith('Diana');
    });

    it('does nothing when the query is empty or whitespace', async () => {
      component.query = '   ';
      await component.quickAdd();
      expect(personsSvc.create).not.toHaveBeenCalled();
    });
  });

  // ── onEnter ─────────────────────────────────────────────────────────────────

  describe('onEnter', () => {
    it('creates a new person when no matches are found', async () => {
      personsSvc.getAll.mockResolvedValue([]);
      personsSvc.create.mockResolvedValue({ id: 'new', name: 'Eve' });
      component.query = 'Eve';

      await component.onEnter();

      expect(personsSvc.create).toHaveBeenCalledWith('Eve');
      expect(router.navigate).toHaveBeenCalledWith(['/person', 'new']);
    });

    it('navigates directly when exactly one person matches', async () => {
      personsSvc.getAll.mockResolvedValue([{ id: 'e1', name: 'Eve' }]);
      component.query = 'Eve';

      await component.onEnter();

      expect(router.navigate).toHaveBeenCalledWith(['/person', 'e1']);
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens the resolve dialog when multiple persons match', async () => {
      personsSvc.getAll.mockResolvedValue([
        { id: '1', name: 'Eva' },
        { id: '2', name: 'Eva Müller' },
      ]);
      component.query = 'Eva';

      await component.onEnter();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('opens the resolve dialog for "Name: Fact" colon syntax', async () => {
      personsSvc.getAll.mockResolvedValue([{ id: '1', name: 'Frank' }]);
      component.query = 'Frank: Liebt Pizza';

      await component.onEnter();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('does nothing when the query is empty or whitespace', async () => {
      component.query = '   ';
      await component.onEnter();
      expect(personsSvc.getAll).not.toHaveBeenCalled();
    });
  });

  // ── openPerson / openBriefing ─────────────────────────────────────────────

  describe('openPerson', () => {
    it('navigates to the person detail page', () => {
      component.openPerson({ id: 'p1', name: 'Alice' } as any);
      expect(router.navigate).toHaveBeenCalledWith(['/person', 'p1']);
    });
  });

  describe('openBriefing', () => {
    it('navigates to the briefing page and stops event propagation', () => {
      const mockEvent = { stopPropagation: jest.fn() } as any;
      component.openBriefing({ id: 'p1' } as any, mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/person', 'p1', 'briefing']);
    });
  });
});
