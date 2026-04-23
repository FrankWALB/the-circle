jest.mock('../db', () => ({
  db: {
    persons: { put: jest.fn().mockResolvedValue(undefined) },
    facts: { put: jest.fn().mockResolvedValue(undefined) },
    events: { put: jest.fn().mockResolvedValue(undefined) },
  },
}));

import { of, Subject, throwError } from 'rxjs';
import { SyncService } from './sync.service';
import { db } from '../db';

function makeService(onLine = true, userId = 'u1') {
  Object.defineProperty(navigator, 'onLine', { value: onLine, configurable: true });
  const mockHttp = { get: jest.fn().mockReturnValue(of([])) };
  const mockUser = { userId };
  return { service: new SyncService(mockHttp as any, mockUser as any), mockHttp };
}

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  describe('syncAll – guard conditions', () => {
    it('does nothing when the device is offline', async () => {
      const { service, mockHttp } = makeService(false);

      await service.syncAll();

      expect(mockHttp.get).not.toHaveBeenCalled();
    });

    it('does nothing when a sync is already in progress', async () => {
      const subject = new Subject<any[]>();
      const { service, mockHttp } = makeService();
      mockHttp.get.mockReturnValue(subject.asObservable());

      // Start first sync — suspends at firstValueFrom(subject) with syncing=true
      const first = service.syncAll();
      // Second sync should see syncing=true and return immediately
      const second = service.syncAll();

      subject.next([]);
      subject.complete();
      await Promise.all([first, second]);

      expect(mockHttp.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncAll – API call', () => {
    it('calls the persons endpoint (userId is sent via x-user-id header by interceptor)', async () => {
      const { service, mockHttp } = makeService(true, 'user-42');

      await service.syncAll();

      expect(mockHttp.get).toHaveBeenCalledWith(expect.stringContaining('/persons'));
    });

    it('does not throw when the API request fails', async () => {
      const { service, mockHttp } = makeService();
      mockHttp.get.mockReturnValue(throwError(() => new Error('network error')));

      await expect(service.syncAll()).resolves.not.toThrow();
    });
  });

  describe('syncAll – local db writes', () => {
    it('writes each person to the local db with synced=true', async () => {
      const { service, mockHttp } = makeService();
      mockHttp.get.mockReturnValue(of([{ id: 'p1', name: 'Alice', facts: [], events: [] }]));

      await service.syncAll();

      expect(db.persons.put as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', synced: true }),
      );
    });

    it('writes all nested facts to the local db with synced=true', async () => {
      const { service, mockHttp } = makeService();
      mockHttp.get.mockReturnValue(of([
        { id: 'p1', facts: [{ id: 'f1', key: 'beruf', value: 'Ärztin' }], events: [] },
      ]));

      await service.syncAll();

      expect(db.facts.put as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'f1', synced: true }),
      );
    });

    it('writes all nested events to the local db with synced=true', async () => {
      const { service, mockHttp } = makeService();
      mockHttp.get.mockReturnValue(of([
        { id: 'p1', facts: [], events: [{ id: 'e1', title: 'Geburtstag', date: '1990-03-15' }] },
      ]));

      await service.syncAll();

      expect(db.events.put as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'e1', synced: true }),
      );
    });

    it('writes all persons, facts, and events in a single sync run', async () => {
      const { service, mockHttp } = makeService();
      mockHttp.get.mockReturnValue(of([
        {
          id: 'p1',
          name: 'Alice',
          facts: [{ id: 'f1', key: 'beruf', value: 'Ärztin' }],
          events: [{ id: 'e1', title: 'Geburtstag', date: '1990-03-15' }],
        },
        {
          id: 'p2',
          name: 'Bob',
          facts: [{ id: 'f2', key: 'hobby', value: 'Lesen' }],
          events: [],
        },
      ]));

      await service.syncAll();

      expect((db.persons.put as jest.Mock).mock.calls.length).toBe(2);
      expect((db.facts.put as jest.Mock).mock.calls.length).toBe(2);
      expect((db.events.put as jest.Mock).mock.calls.length).toBe(1);
    });
  });
});
