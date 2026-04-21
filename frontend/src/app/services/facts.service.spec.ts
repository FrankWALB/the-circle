jest.mock('../db', () => ({ db: {} }));

import { FactsService } from './facts.service';

describe('FactsService.parseQuickInput', () => {
  let service: FactsService;

  beforeEach(() => {
    service = new FactsService(null as any, null as any);
  });

  describe('colon-separated input', () => {
    it('splits on the first colon and trims whitespace', () => {
      expect(service.parseQuickInput('hobby: chess')).toEqual({
        key: 'hobby',
        value: 'chess',
        category: 'interests',
      });
    });

    it('handles input without spaces around the colon', () => {
      expect(service.parseQuickInput('hobby:chess')).toEqual({
        key: 'hobby',
        value: 'chess',
        category: 'interests',
      });
    });

    it('uses the full remainder as value when the value itself contains a colon', () => {
      expect(service.parseQuickInput('email: user:example.de')).toEqual({
        key: 'email',
        value: 'user:example.de',
        category: 'contact',
      });
    });
  });

  describe('keyword-to-category mapping', () => {
    const cases: [string, string, string, string][] = [
      ['kinder: 2',             'kinder',     '2',             'family'],
      ['kind: Lisa',            'kind',        'Lisa',          'family'],
      ['beruf: Ärztin',         'beruf',       'Ärztin',        'work'],
      ['job: Developer',        'job',         'Developer',     'work'],
      ['urlaub: Mallorca',      'urlaub',      'Mallorca',      'travel'],
      ['reise: Japan',          'reise',       'Japan',         'travel'],
      ['hobby: Lesen',          'hobby',       'Lesen',         'interests'],
      ['geburtstag: 01.01.90',  'geburtstag',  '01.01.90',      'birthday'],
      ['telefon: 0123456',      'telefon',     '0123456',       'contact'],
      ['email: a@b.de',         'email',       'a@b.de',        'contact'],
    ];

    test.each(cases)('"%s" → key=%s value=%s category=%s', (input, key, value, category) => {
      expect(service.parseQuickInput(input)).toEqual({ key, value, category });
    });

    it('is case-insensitive for keywords', () => {
      expect(service.parseQuickInput('HOBBY: chess')).toEqual({
        key: 'HOBBY',
        value: 'chess',
        category: 'interests',
      });
    });

    it('returns undefined category for an unknown key', () => {
      const result = service.parseQuickInput('unbekannt: irgendwas');
      expect(result).toEqual({ key: 'unbekannt', value: 'irgendwas', category: undefined });
    });
  });

  describe('fallback to Notiz', () => {
    it('returns key=Notiz when there is no colon in the input', () => {
      expect(service.parseQuickInput('just a free text note')).toEqual({
        key: 'Notiz',
        value: 'just a free text note',
        category: 'notes',
      });
    });

    it('returns key=Notiz when the colon is the first character (no key)', () => {
      expect(service.parseQuickInput(':no-key')).toEqual({
        key: 'Notiz',
        value: ':no-key',
        category: 'notes',
      });
    });

    it('trims the fallback value', () => {
      const result = service.parseQuickInput('  free text  ');
      expect(result.key).toBe('Notiz');
      expect(result.value).toBe('free text');
    });
  });
});
