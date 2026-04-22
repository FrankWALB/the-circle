# The Circle

Eine Offline-first Progressive Web App zur persönlichen Beziehungspflege. The Circle hilft dir, wichtige Informationen über Menschen in deinem Umfeld festzuhalten — Fakten, Jahrestage und Notizen — und immer griffbereit zu haben, wenn du sie brauchst.

---

## Features

- **Personen verwalten** — Kontakte anlegen, suchen und löschen über eine schnelle Eingabemaske
- **Fakten erfassen** — Strukturierte Schlüssel-Wert-Paare mit automatischer Kategorisierung (Beruf, Familie, Hobbys, Geburtstag …)
- **Jahrestage & Events** — Einmalige und jährlich wiederkehrende Ereignisse mit Vorschau auf die nächsten 90 Tage
- **Briefing-Ansicht** — Kompakte Zusammenfassung mit den aktuellsten Fakten und bevorstehenden Events auf einen Blick
- **Woher kenne ich diese Person?** — Notiz zum Kennenlernen-Kontext (Uni, Arbeit, über Maria …)
- **Quick-Add** — Personen und Fakten in einem Schritt anlegen mit `Name: Schlüssel: Wert`-Syntax
- **Offline-first** — Alle Daten werden lokal in IndexedDB gespeichert und bei Verbindung mit dem Backend synchronisiert
- **PWA** — Installierbar auf dem Home-Screen, funktioniert ohne Netzwerk

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| Frontend Framework | Angular 21 (Standalone Components) |
| UI | Angular Material 21 |
| Lokale Datenbank | Dexie 4 (IndexedDB) |
| Backend Framework | NestJS 11 |
| Datenbank | PostgreSQL mit TypeORM 0.3 |
| Tests | Jest 30 + ts-jest |
| Linting | ESLint 10 + typescript-eslint 8 |
| CI | GitHub Actions (Node 24) |

---

## Projektstruktur

```
the-circle/
├── backend/                        # NestJS REST API
│   └── src/
│       ├── persons/                # Personen (Entity, DTO, Controller, Service)
│       ├── facts/                  # Fakten (Entity, DTO, Controller, Service)
│       └── events/                 # Events (Entity, DTO, Controller, Service)
├── frontend/                       # Angular PWA
│   └── src/
│       ├── app/
│       │   ├── pages/
│       │   │   ├── home/           # Suche & Personenliste
│       │   │   ├── person-detail/  # Person bearbeiten (Fakten, Events, Notizen)
│       │   │   ├── briefing/       # Zusammenfassung
│       │   │   └── admin/          # Admin-Panel
│       │   ├── services/           # Persons, Facts, Events, Sync, User
│       │   ├── components/         # ResolveDialog (Namenskonflikte)
│       │   └── db.ts               # Dexie-Schema
│       └── environments/
└── .github/workflows/ci.yml        # CI Pipeline
```

---

## Lokale Entwicklung

### Voraussetzungen

- Node.js ≥ 24
- PostgreSQL

### Backend starten

```bash
cd backend
npm install
# Umgebungsvariablen setzen (siehe unten)
npm run start:dev
```

Das Backend läuft auf `http://localhost:3000`.

**Umgebungsvariablen:**

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=circle
```

### Frontend starten

```bash
cd frontend
npm install
npm start
```

Die App läuft auf `http://localhost:4200`. API-Calls werden automatisch an `localhost:3000` weitergeleitet.

---

## API-Übersicht

Alle Endpunkte erwarten einen `userId`-Query-Parameter zur Datenisolation.

### Personen

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/persons?userId=&search=` | Alle Personen (optional gefiltert) |
| `GET` | `/persons/:id?userId=` | Eine Person mit Fakten & Events |
| `POST` | `/persons` | Person anlegen |
| `PUT` | `/persons/:id?userId=` | Person aktualisieren |
| `DELETE` | `/persons/:id?userId=` | Person löschen |
| `GET` | `/persons/admin` | Alle Personen (Admin) |

### Fakten

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/facts?personId=&userId=` | Fakten einer Person |
| `POST` | `/facts` | Fakt anlegen |
| `PUT` | `/facts/:id?userId=` | Fakt aktualisieren |
| `DELETE` | `/facts/:id?userId=` | Fakt löschen |

### Events

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/events?personId=&userId=` | Events einer Person |
| `POST` | `/events` | Event anlegen |
| `PUT` | `/events/:id?userId=` | Event aktualisieren |
| `DELETE` | `/events/:id?userId=` | Event löschen |

---

## Datenschema

### Person

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Primärschlüssel |
| `userId` | string | Browser-UUID des Besitzers |
| `name` | string | Vollständiger Name |
| `occupation` | string? | Beruf / Rolle |
| `notes` | string? | Freie Notizen |
| `metAt` | string? | Kontext des Kennenlernens |
| `createdAt` | Date | Angelegt am |
| `updatedAt` | Date | Zuletzt geändert |

### Fakt

| Feld | Typ | Beschreibung |
|---|---|---|
| `key` | string | Bezeichnung (z. B. „Beruf") |
| `value` | string | Wert (z. B. „Ärztin") |
| `category` | string? | `work`, `family`, `travel`, `interests`, `birthday`, `contact`, `notes` |

### Event

| Feld | Typ | Beschreibung |
|---|---|---|
| `title` | string | Bezeichnung (z. B. „Geburtstag") |
| `date` | string | Datum (ISO 8601) |
| `recurring` | boolean | Jährlich wiederkehrend |

---

## Quick-Add Syntax

Im Suchfeld unterstützt The Circle eine Schnelleingabe-Syntax:

| Eingabe | Ergebnis |
|---|---|
| `Alice` | Person „Alice" anlegen und direkt öffnen |
| `Alice: Beruf: Ärztin` | Person „Alice" suchen und Fakt „Beruf: Ärztin" hinzufügen |

Schlüsselwörter werden automatisch kategorisiert:

| Schlüsselwort | Kategorie |
|---|---|
| beruf, job | `work` |
| kinder, kind | `family` |
| urlaub, reise | `travel` |
| hobby | `interests` |
| geburtstag | `birthday` |
| telefon, email | `contact` |
| alles andere | `notes` |

---

## Offline-Strategie

The Circle schreibt jede Änderung sofort in die lokale IndexedDB. Ist das Gerät online, werden die Daten zusätzlich an das Backend gesendet. Beim App-Start und jedem Wechsel von Offline zu Online wird ein vollständiger Sync vom Server gezogen.

```
Aktion (create/update/delete)
  └─► Dexie (sofort, synced: false)
       └─► Backend (wenn online, synced: true bei Erfolg)

App-Start / back online
  └─► SyncService.syncAll()
       └─► GET /persons (mit Fakten & Events) → Dexie
```

Die Nutzeridentität wird als UUID im `localStorage` des Browsers gespeichert — es gibt keine Registrierung oder Anmeldung.

---

## Tests

```bash
# Backend (52 Tests)
cd backend && npm test

# Frontend (74 Tests)
cd frontend && npm test
```

Getestet werden:

- **Backend**: Services (CRUD, NotFoundException, ILike-Suche) und Controller per `@nestjs/testing`
- **Frontend Services**: `parseQuickInput`-Kategorisierung, `getUpcoming`-Datumslogik, Sync-Concurrency-Guard
- **Frontend Components**: `ngOnInit`-Datenladung, alle User-Actions (addFact, deleteEvent, saveNotes, deletePerson …)

---

## CI/CD

Die GitHub Actions Pipeline läuft bei jedem Push auf `main`, `feature/**` und `claude/**`:

```
┌──────────────┐  ┌───────────────┐
│ test-backend │  │ test-frontend │   (parallel)
└──────┬───────┘  └───────┬───────┘
       │                  │
┌──────▼───────┐  ┌───────▼───────┐
│ lint-backend │  │ lint-frontend │   (parallel)
└──────┬───────┘  └───────┬───────┘
       └─────────┬─────────┘
           ┌─────▼─────┐
           │   build   │
           └───────────┘
```

Alle Jobs verwenden Node 24.

---

## Lizenz

MIT
