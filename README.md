# The Circle — Personal CRM

Persönliches CRM zum blitzschnellen Erfassen und Wiederfinden von Informationen zu Freunden und Bekannten. Offline-first PWA.

## Stack

| Layer | Technologie |
|---|---|
| Frontend | Angular 21 (standalone), Angular Material, Dexie (IndexedDB) |
| Backend | NestJS 11, Prisma 6, PostgreSQL 16 |
| Infra | Docker Compose, nginx (Port 80) |
| CI | GitLab CI (lint → unit → e2e → build → docker → deploy) |
| E2E | Playwright (mobile viewport, offline-mode) |

**DB-Entscheidung:** Prisma statt TypeORM — besserer Type-Safety durch generierten Client, saubere deklarative Schema-Datei, einfacheres Migrations-Handling.

---

## Schnellstart

```bash
# Starten (alles hinter nginx auf Port 80)
docker compose up --build

# App öffnen
open http://localhost
```

### Lokale Entwicklung

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run start:dev

# Frontend (anderes Terminal)
cd frontend
npm install
npm start
# → http://localhost:4200
```

### E2E Tests

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

---

## Architektur

```
Browser (PWA)
  └─ Angular App
       ├─ Dexie (IndexedDB) ← Primary store
       └─ SyncService → /api/* (wenn online)

nginx (Port 80)
  ├─ / → Angular static files
  └─ /api/ → NestJS backend (Port 3000, intern)

NestJS
  └─ Prisma → PostgreSQL
```

**Offline-First:** Alle Schreib- und Leseoperationen gehen zuerst gegen Dexie (IndexedDB). Schreiboperationen werden in eine `syncQueue` eingereiht und bei Onlinewerden an das Backend gesendet (Last-write-wins).

---

## Kernflows

### Quick Add (< 5 Sekunden)
1. Text ins obere Suchfeld tippen
2. Enter drücken
3. Resolve-Modal: bestehende Person auswählen oder neue anlegen
4. Notiz wird lokal gespeichert, Person wird geöffnet

### Suche (instant, clientseitig)
- Fuzzy-Suche gegen Dexie — kein Netzwerk nötig
- Gewichtung: exakter Name > Prefix > enthält > Beruf/Firma

### Briefing
- Erreichbar über ✨-Button auf der Personendetailseite
- Key-Facts, letzte 5 Notizen, bevorstehende Termine (30 Tage)

---

## Umgebungsvariablen

### Backend `.env`
```
DATABASE_URL=postgresql://thecircle:thecircle@postgres:5432/thecircle
PORT=3000
NODE_ENV=development
```

### Auth (MVP)
Ohne Auth-System: User wird per `x-user-id` Header identifiziert (Default: `default-user`).  
Admin-Zugriff: Header `x-user-role: ADMIN` setzen.  
In der Auth-Phase wird dieser Header durch ein JWT-Middleware ersetzt.

---

## API-Übersicht

```
GET    /persons               Liste aller Personen (user-scoped)
POST   /persons               Person anlegen
GET    /persons/:id           Person mit Notizen/Facts/Events
PUT    /persons/:id           Person aktualisieren
DELETE /persons/:id           Person löschen

POST   /persons/:id/notes     Notiz anlegen
PUT    /persons/:id/notes/:nid  Notiz aktualisieren
DELETE /persons/:id/notes/:nid  Notiz löschen

POST   /persons/:id/facts     Fact anlegen
PUT    /persons/:id/facts/:fid  Fact aktualisieren
DELETE /persons/:id/facts/:fid  Fact löschen

POST   /persons/:id/events    Event anlegen
DELETE /persons/:id/events/:eid Event löschen

GET    /admin/stats           Statistiken (Admin)
GET    /admin/persons         Alle Personen (Admin)
GET    /admin/persons/:id     Eine Person (Admin)
GET    /admin/users           Alle Nutzer (Admin)
```

---

## GitLab CI Deployment

Deployment-Variablen in GitLab CI/CD Settings:
- `DEPLOY_SSH_KEY` — SSH-Key für Deployment-Server
- `DEPLOY_HOST` — Server-IP/Hostname
- `DEPLOY_USER` — SSH-User
- `CI_REGISTRY_*` — wird automatisch gesetzt

Auf dem Server: `docker-compose.yml` nach `/opt/the-circle/` kopieren.
