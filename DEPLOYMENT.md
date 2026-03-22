# WERA Songbook – Deployment-Anleitung

Dieses Dokument beschreibt Schritt für Schritt, wie du die App lokal testest und auf einem Hetzner Dedicated Server (ESXi) mit Coolify deployst.

**Ziel-Setup:**
- Hetzner Dedicated Server mit ESXi
- Ubuntu VM auf ESXi
- Coolify in der VM (verwaltet Docker, SSL, Auto-Deploy)
- Supabase self-hosted (gleiche oder separate VM)
- Domain: `songbook.weraforum.de`
- PWA installierbar auf allen Geraeten

---

## Inhaltsverzeichnis

0. [Lokales Testen (localhost)](#0-lokales-testen-localhost)
1. [Infrastruktur: ESXi VM aufsetzen](#1-infrastruktur-esxi-vm-aufsetzen)
2. [Coolify installieren](#2-coolify-installieren)
3. [Supabase einrichten](#3-supabase-einrichten)
4. [Datenbank-Migrationen ausfuehren](#4-datenbank-migrationen-ausfuehren)
5. [Custom Access Token Hook aktivieren](#5-custom-access-token-hook-aktivieren)
6. [Ersten Admin-User anlegen](#6-ersten-admin-user-anlegen)
7. [Environment-Variablen vorbereiten](#7-environment-variablen-vorbereiten)
8. [Coolify: App konfigurieren](#8-coolify-app-konfigurieren)
9. [DNS einrichten](#9-dns-einrichten)
10. [Erster Start und Verifizierung](#10-erster-start-und-verifizierung)
11. [PWA-Installation fuer Endnutzer](#11-pwa-installation-fuer-endnutzer)
12. [Updates und Wartung](#12-updates-und-wartung)
13. [PWA-Icons ersetzen](#13-pwa-icons-ersetzen)
14. [Troubleshooting](#14-troubleshooting)

---

## 0. Lokales Testen (localhost)

Du kannst die App komplett lokal testen, bevor du irgendwas auf einem Server deployst. Dafuer brauchst du nur eine Supabase-Instanz (self-hosted oder Supabase Cloud zum Testen).

### 0.1 Supabase bereitstellen

**Option A: Supabase Cloud (schnellster Weg zum Testen)**

1. Gehe zu https://supabase.com und erstelle ein kostenloses Projekt
2. Warte bis das Projekt bereit ist (~2 Min)
3. Notiere dir unter **Project Settings -> API**:
   - Project URL
   - `anon` public Key
   - `service_role` secret Key

**Option B: Lokales Supabase (via Docker)**

```bash
# Supabase CLI installieren
npm install -g supabase

# Im Projektverzeichnis Supabase lokal starten
cd /pfad/zu/wera-songbook
npx supabase start
```

Nach dem Start zeigt die CLI alle URLs und Keys an. Standardwerte:
- URL: `http://127.0.0.1:54321`
- Anon Key: wird angezeigt
- Service Role Key: wird angezeigt
- Dashboard: `http://127.0.0.1:54323`

### 0.2 Migrationen ausfuehren

```bash
# Option A: Gegen Supabase Cloud
npx supabase db push --db-url "postgresql://postgres:PASSWORT@db.PROJEKT.supabase.co:5432/postgres"

# Option B: Gegen lokales Supabase (automatisch, wenn supabase start die migrations/ findet)
# Falls nicht automatisch:
npx supabase db push --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### 0.3 Custom Access Token Hook aktivieren

- **Supabase Cloud**: Dashboard -> Authentication -> Hooks -> Custom Access Token -> Schema: `public`, Function: `custom_access_token_hook` -> Save
- **Lokales Supabase**: Dashboard unter `http://127.0.0.1:54323` -> gleiche Schritte

### 0.4 Testdaten anlegen

Im Supabase SQL-Editor (Dashboard -> SQL Editor -> New Query):

```sql
-- 1. Organisation
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'WERA Test')
RETURNING id;

-- 2. Abteilung
INSERT INTO public.departments (id, org_id, name)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Hauptgemeinde')
RETURNING id;
```

Dann unter **Authentication -> Users -> Add User**:
- Email: `admin@test.de`
- Password: `test1234`
- Auto Confirm: Ja
- User-ID kopieren

Dann im SQL-Editor:

```sql
-- 3. Admin-Mitgliedschaft (USER_ID ersetzen!)
INSERT INTO public.org_members (org_id, department_id, user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'DEINE_USER_ID_HIER',
  'admin'
);
```

### 0.5 .env.local erstellen

```bash
cp .env.example .env.local
```

Dann `.env.local` bearbeiten:

```env
# Fuer Supabase Cloud:
NEXT_PUBLIC_SUPABASE_URL=https://DEIN_PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...dein-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...dein-service-role-key

# Fuer lokales Supabase:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...lokaler-anon-key
# SUPABASE_SERVICE_ROLE_KEY=eyJ...lokaler-service-role-key

# App URL fuer localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 0.6 App starten

```bash
npm run dev
```

Oeffne http://localhost:3000 -> du wirst zum Login weitergeleitet.

Login mit: `admin@test.de` / `test1234`

### 0.7 Was du testen kannst

| Feature | URL | Was pruefen |
|---------|-----|------------|
| Login | `/login` | Email + Passwort, Weiterleitung zu `/songs` |
| Song-Liste | `/songs` | Leere Liste, Suche funktioniert, "Neuer Song" Button sichtbar (Admin) |
| Song erstellen | `/songs/new` | Formular ausfuellen, ChordPro-Preview rechts (Desktop) |
| Song-Detail | `/songs/[id]` | ChordPro gerendert, Transponieren (+/- Buttons) |
| Setlists | `/setlists` | Liste, Filter, "Neue Setlist" Button (Admin) |
| Admin-Panel | `/admin` | Tabs: Nutzer (1 Eintrag) + Abteilungen (1 Eintrag) |
| Admin: Nutzer anlegen | `/admin` | Dialog oeffnen, Formular ausfuellen, neuer User in Liste |
| Offline-Banner | DevTools -> Network -> Offline | Gelbe Leiste: "Du bist offline" |
| PWA | DevTools -> Application -> Manifest | Manifest wird angezeigt |
| Responsive | DevTools -> Geraete-Modus | Mobile: Bottom Nav, Desktop: Sidebar |

### 0.8 Hinweise

- **Service Worker** funktioniert nur im Production-Build (`npm run build && npm start`), nicht in `npm run dev`
- **PWA-Installation** funktioniert nur ueber HTTPS oder `localhost` (nicht ueber IP-Adressen)
- **Hot Reload** funktioniert normal mit `npm run dev`
- Falls Supabase-Fehler auftreten: Pruefe ob die `.env.local` Werte korrekt sind und ob die Migrationen gelaufen sind

---

## 1. Infrastruktur: ESXi VM aufsetzen

### 1.1 Ueberblick

```
Hetzner Dedicated Server
  └── VMware ESXi
        ├── VM 1: "songbook" (App + Coolify + Supabase)
        │     ├── Coolify (verwaltet Docker Container)
        │     │    └── WERA Songbook Container (Next.js)
        │     └── Supabase (Docker Compose Stack)
        └── VM 2: ... (andere Dienste)
```

Alternativ kannst du Supabase auf einer separaten VM laufen lassen. Fuer eine kleine Gemeinde (50-200 Nutzer) reicht eine einzelne VM.

### 1.2 VM erstellen

Im ESXi vSphere Client:

1. **New Virtual Machine** -> Typical
2. **Name**: `songbook`
3. **Guest OS**: Linux -> Ubuntu Linux (64-bit)
4. **Resources** (Minimum fuer App + Supabase):
   - CPU: 4 vCPUs
   - RAM: 8 GB (4 GB wenn Supabase separat)
   - Disk: 50 GB (thin provisioned)
   - Network: VM Network (Bridged, oeffentliche IP oder NAT mit Port-Forwarding)
5. **ISO**: Ubuntu Server 22.04 LTS oder 24.04 LTS

### 1.3 Ubuntu installieren

Waehrend der Installation:

1. **Hostname**: `songbook`
2. **User**: deinen Admin-User anlegen
3. **OpenSSH Server**: installieren (Checkbox aktivieren)
4. **Keine zusaetzlichen Snaps** installieren

### 1.4 Nach der Installation: Basis-Setup

Per SSH verbinden:

```bash
ssh dein-user@IP_DER_VM

# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Firewall einrichten
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (fuer Let's Encrypt Challenge)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Optional: Fail2Ban fuer SSH-Schutz
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### 1.5 Netzwerk / IP

Du brauchst eine **oeffentlich erreichbare IP** fuer die VM, damit:
- Let's Encrypt SSL-Zertifikate ausgestellt werden koennen
- Endnutzer die App erreichen

**Option A: Oeffentliche IP direkt an VM**
- Im ESXi die VM direkt mit einer oeffentlichen IP versorgen (Hetzner zusaetzliche IP oder Subnet)

**Option B: NAT + Port-Forwarding**
- ESXi Host hat die oeffentliche IP
- Port 80 und 443 an die VM weiterleiten
- Im ESXi Firewall oder vorgeschaltetem Router konfigurieren

---

## 2. Coolify installieren

Coolify ist eine self-hosted Deployment-Plattform (vergleichbar mit Vercel/Netlify, aber auf deinem eigenen Server). Es verwaltet Docker Container, SSL-Zertifikate und Auto-Deploys.

### 2.1 Installation

```bash
ssh dein-user@IP_DER_VM

# Coolify mit einem Befehl installieren (installiert auch Docker)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Die Installation dauert 2-5 Minuten und installiert:
- Docker + Docker Compose
- Coolify (als Docker Container)
- Traefik (Reverse Proxy fuer SSL)

### 2.2 Erster Login

1. Oeffne `http://IP_DER_VM:8000` im Browser
2. Erstelle deinen Admin-Account
3. Du landest im Coolify Dashboard

### 2.3 Coolify absichern

Nach dem ersten Login:

1. **Settings -> General**: Instance URL auf `https://coolify.weraforum.de` setzen (oder die IP lassen)
2. Optional: Eigene Domain fuer Coolify-Dashboard einrichten

> **Wichtig:** Port 8000 sollte nach dem Setup nur noch intern oder per VPN erreichbar sein. Coolify Dashboard nicht oeffentlich ohne Schutz lassen.

---

## 3. Supabase einrichten

Supabase laeuft als Docker Compose Stack auf der gleichen VM (oder einer separaten).

### 3.1 Supabase installieren

```bash
# Supabase Docker Repo klonen
git clone --depth 1 https://github.com/supabase/supabase.git /opt/supabase
cd /opt/supabase/docker

# Konfiguration erstellen
cp .env.example .env
```

### 3.2 .env anpassen

Die wichtigsten Werte in `/opt/supabase/docker/.env`:

```env
# Sichere Passwoerter generieren (z.B. mit: openssl rand -base64 32)
POSTGRES_PASSWORD=SICHERES_PASSWORT_HIER
JWT_SECRET=SICHERER_JWT_SECRET_HIER
ANON_KEY=WIRD_AUTOMATISCH_GENERIERT
SERVICE_ROLE_KEY=WIRD_AUTOMATISCH_GENERIERT

# Domain unter der Supabase erreichbar sein soll
SITE_URL=https://songbook.weraforum.de
API_EXTERNAL_URL=https://supabase.weraforum.de

# Signup deaktivieren (Nutzer werden nur von Admins angelegt)
GOTRUE_DISABLE_SIGNUP=true

# Sessions
GOTRUE_JWT_EXP=3600
```

> **Tipp:** Die `ANON_KEY` und `SERVICE_ROLE_KEY` werden aus dem `JWT_SECRET` generiert. Folge der offiziellen Anleitung: https://supabase.com/docs/guides/self-hosting/docker

### 3.3 Supabase starten

```bash
cd /opt/supabase/docker
docker compose up -d
```

### 3.4 Supabase ueber HTTPS erreichbar machen

**Option A: Ueber Coolify (empfohlen)**

In Coolify einen neuen Dienst anlegen, der den Supabase Kong-Port (8000) per Reverse Proxy unter `supabase.weraforum.de` mit SSL verfuegbar macht.

**Option B: Nginx Reverse Proxy manuell**

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Nginx Config `/etc/nginx/sites-available/supabase`:

```nginx
server {
    server_name supabase.weraforum.de;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket Support (fuer Realtime)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL-Zertifikat ausstellen
sudo certbot --nginx -d supabase.weraforum.de
```

### 3.5 Wichtige Supabase-Einstellungen

Oeffne das Supabase Dashboard (`https://supabase.weraforum.de`) und pruefe:

1. **Authentication -> Settings -> General**:
   - `Enable email signup` = **AUS**
   - `Enable email confirmations` = AUS (wir bestaetigen beim Anlegen direkt)

2. **Authentication -> Settings -> Sessions**:
   - JWT Expiry: `3600` (1 Stunde)
   - Refresh Token Rotation: aktiviert

3. **Notiere dir diese Werte** (findest du unter Project Settings -> API):
   - `Project URL` -> wird zu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` Key -> wird zu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` Key -> wird zu `SUPABASE_SERVICE_ROLE_KEY`

> **ACHTUNG:** Der `service_role` Key hat vollen Zugriff auf die Datenbank ohne RLS!
> Dieser Key darf **NIEMALS** im Frontend oder in oeffentlichem Code stehen.

---

## 4. Datenbank-Migrationen ausfuehren

Die Migrationen erstellen alle Tabellen, Enums, RLS-Policies und Indexes.

### Option A: Ueber Supabase CLI (empfohlen)

```bash
# 1. Supabase CLI installieren (auf deinem lokalen Rechner)
npm install -g supabase

# 2. Im Projektverzeichnis:
cd /pfad/zu/wera-songbook

# 3. Migrationen ausfuehren
npx supabase db push --db-url "postgresql://postgres:DEIN_DB_PASSWORT@supabase.weraforum.de:5432/postgres"
```

### Option B: Manuell in SQL-Editor

Falls die CLI nicht funktioniert, fuehre die 4 Migrationsdateien **in dieser Reihenfolge** im Supabase SQL-Editor aus:

1. **`supabase/migrations/20260220000001_enums_and_tables.sql`**
   - Erstellt: Enums (`app_role`, `song_category`, `event_type`, `resource_type`)
   - Erstellt: Alle Tabellen (`organizations`, `departments`, `org_members`, `songs`, `song_resources`, `setlists`, `setlist_songs`, `user_preferences`, `push_subscriptions`)
   - Erstellt: `updated_at`-Trigger fuer automatische Zeitstempel

2. **`supabase/migrations/20260220000002_rls_policies.sql`**
   - Aktiviert Row Level Security auf allen Tabellen
   - Erstellt Policies: Wer darf was lesen/schreiben
   - Prinzip: Jeder sieht nur Daten seiner Organisation/Abteilung

3. **`supabase/migrations/20260220000003_indexes.sql`**
   - Performance-Indexes auf haeufig abgefragte Spalten

4. **`supabase/migrations/20260220000004_custom_access_token_hook.sql`**
   - PostgreSQL-Funktion die `org_id`, `department_id` und `role` in den JWT einbettet
   - **Muss danach noch in den Supabase-Einstellungen aktiviert werden** (siehe Schritt 5)

### Verifizierung

Nach den Migrationen solltest du im Supabase Table Editor diese Tabellen sehen:
- `organizations`, `departments`, `org_members`
- `songs`, `song_resources`
- `setlists`, `setlist_songs`
- `user_preferences`, `push_subscriptions`

---

## 5. Custom Access Token Hook aktivieren

Der Hook bettet die Rolle des Nutzers direkt in den JWT ein, damit die App nicht bei jedem Request die Datenbank abfragen muss.

1. Oeffne Supabase Dashboard -> **Authentication -> Hooks**
2. Aktiviere **"Custom Access Token Hook"**
3. Waehle:
   - **Schema**: `public`
   - **Function**: `custom_access_token_hook`
4. Speichern

### Testen

Du kannst testen ob der Hook funktioniert, indem du dich einloggst und den JWT inspizierst. In `app_metadata` sollte stehen:
```json
{
  "org_id": "uuid-der-organisation",
  "department_id": "uuid-der-abteilung",
  "role": "admin"
}
```

---

## 6. Ersten Admin-User anlegen

Da Signup deaktiviert ist, musst du den ersten Admin-User manuell anlegen.

### Schritt 6.1: Organisation + Abteilung erstellen

Im Supabase SQL-Editor:

```sql
-- Organisation erstellen
INSERT INTO public.organizations (name)
VALUES ('WERA Gemeinde')
RETURNING id;
-- Notiere die id, z.B. 'abc123...'

-- Erste Abteilung erstellen (ersetze ORG_ID mit der id von oben)
INSERT INTO public.departments (org_id, name)
VALUES ('ORG_ID_HIER', 'Hauptgemeinde')
RETURNING id;
-- Notiere die id, z.B. 'def456...'
```

### Schritt 6.2: Auth-User erstellen

Im Supabase Dashboard -> **Authentication -> Users -> Add User**:
- Email: deine Admin-E-Mail
- Password: sicheres Passwort (min. 8 Zeichen)
- "Auto Confirm User" anhaken
- User-ID notieren

### Schritt 6.3: Mitgliedschaft + Admin-Rolle zuweisen

Im SQL-Editor:

```sql
INSERT INTO public.org_members (org_id, department_id, user_id, role)
VALUES (
  'ORG_ID_HIER',        -- aus Schritt 6.1
  'DEPARTMENT_ID_HIER', -- aus Schritt 6.1
  'USER_ID_HIER',       -- aus Schritt 6.2
  'admin'
);
```

Danach kannst du dich in der App einloggen und weitere Nutzer ueber das Admin-Panel anlegen.

---

## 7. Environment-Variablen vorbereiten

Die App braucht diese Umgebungsvariablen:

```env
# ========================================
# SUPABASE
# ========================================

# Oeffentliche URL deiner Supabase-Instanz
NEXT_PUBLIC_SUPABASE_URL=https://supabase.weraforum.de

# Anon Key (oeffentlich, geht an den Browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.DEIN_ANON_KEY

# Service Role Key (GEHEIM! Nur serverseitig!)
# Dieser Key umgeht RLS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.DEIN_SERVICE_KEY

# ========================================
# APP
# ========================================

# Oeffentliche URL der App (fuer PWA Manifest, Links, etc.)
NEXT_PUBLIC_APP_URL=https://songbook.weraforum.de

# ========================================
# PUSH NOTIFICATIONS (optional, fuer PRIO 2)
# ========================================
# Generiere VAPID Keys mit: npx web-push generate-vapid-keys

# NEXT_PUBLIC_VAPID_PUBLIC_KEY=dein-vapid-public-key
# VAPID_PRIVATE_KEY=dein-vapid-private-key
# VAPID_EMAIL=mailto:admin@weraforum.de
```

### Welche Variable wird wo gebraucht?

| Variable | Wo verwendet | Oeffentlich? | Coolify-Typ |
|----------|-------------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | Ja | **Build Variable** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + Server | Ja | **Build Variable** |
| `SUPABASE_SERVICE_ROLE_KEY` | Nur Server | **NEIN** | Runtime Variable |
| `NEXT_PUBLIC_APP_URL` | Browser (PWA) | Ja | **Build Variable** |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Browser (Push) | Ja | **Build Variable** |
| `VAPID_PRIVATE_KEY` | Nur Server | **NEIN** | Runtime Variable |
| `VAPID_EMAIL` | Nur Server | **NEIN** | Runtime Variable |

> **`NEXT_PUBLIC_` Prefix**: Variablen mit diesem Prefix werden vom Next.js Build in den Browser-Code eingebettet. Sie muessen deshalb **als Build-Argumente** an Docker uebergeben werden (nicht nur als Runtime-Env).

---

## 8. Coolify: App konfigurieren

### 8.1 Neues Projekt anlegen

1. Coolify Dashboard oeffnen
2. **Projects -> New Project** -> Name: `WERA Songbook`
3. Im Projekt: **New -> Application**

### 8.2 Git Repository verbinden

1. **Source**: GitHub (private repository)
   - Falls noch nicht verbunden: Coolify -> Settings -> Sources -> GitHub App erstellen
   - Dem GitHub App Zugriff auf `nmsdavid/wera-songbook` geben
2. **Repository**: `nmsdavid/wera-songbook`
3. **Branch**: `main` (fuer Produktion)
4. **Build Pack**: `Dockerfile`
5. **Dockerfile Location**: `/Dockerfile`

### 8.3 Environment-Variablen setzen

Unter **Environment Variables** alle Variablen aus Schritt 7 eintragen.

**Wichtig fuer NEXT_PUBLIC_ Variablen:**

1. Fuer jede `NEXT_PUBLIC_` Variable:
   - Variable eintragen
   - **"Build Variable"** aktivieren (Checkbox/Toggle in Coolify)
   - Das sorgt dafuer, dass Coolify die Variable als `--build-arg` an Docker uebergibt

2. Fuer Server-Only Variablen (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`):
   - Nur als Runtime-Variable eintragen (NICHT als Build Variable)
   - Diese werden dem Container als Umgebungsvariable zur Laufzeit mitgegeben

### 8.4 Domain und SSL

1. **Domains**: `https://songbook.weraforum.de`
2. **SSL**: Let's Encrypt (automatisch ueber Coolify/Traefik)
3. **Force HTTPS**: Ja
4. **WWW Redirect**: Aus (keine www-Subdomain noetig)

### 8.5 Port

- **Exposed Port**: `3000`
- Coolify/Traefik leitet automatisch 443 (HTTPS) -> 3000 (Container)

### 8.6 Health Check (empfohlen)

- **Path**: `/`
- **Port**: `3000`
- **Interval**: `30s`

### 8.7 Auto-Deploy einrichten

Damit bei jedem Push auf `main` automatisch deployed wird:

1. In Coolify unter dem Projekt: **Webhooks** -> Webhook-URL kopieren
2. Im GitHub Repository -> **Settings -> Webhooks -> Add webhook**:
   - Payload URL: die Coolify Webhook-URL
   - Content type: `application/json`
   - Secret: leer lassen (oder Coolify-Secret eintragen falls angezeigt)
   - Events: **Just the push event**
   - Active: Ja
3. Ab jetzt deployt Coolify automatisch bei jedem Push auf `main`

### 8.8 Dev-Environment (optional)

Fuer eine zweite Instanz auf `dev.weraforum.de`:

1. Im gleichen Coolify-Projekt: **New -> Application** (zweite App)
2. Gleiche Schritte wie oben, aber:
   - **Branch**: `develop`
   - **Domain**: `https://dev.weraforum.de`
   - `NEXT_PUBLIC_APP_URL=https://dev.weraforum.de`
   - Eigene Supabase-Instanz oder gleiche DB (aber Vorsicht bei Migrationen)

---

## 9. DNS einrichten

Bei deinem Domain-Provider fuer `weraforum.de`:

| Typ | Name | Wert | TTL |
|-----|------|------|-----|
| A | `songbook` | `IP_DER_VM` | 3600 |
| A | `supabase` | `IP_DER_VM` | 3600 |
| A | `dev` (optional) | `IP_DER_VM` | 3600 |

**Wichtig:**
- Die IP muss die **oeffentliche IP der VM** sein (oder die des ESXi Hosts mit Port-Forwarding)
- Falls du Cloudflare nutzt: Proxy (orangene Wolke) **deaktivieren**, damit Coolify/Traefik das SSL-Zertifikat selbst ausstellen kann. Oder Cloudflare Full (Strict) SSL verwenden.
- DNS-Propagation kann bis zu 24h dauern, meistens aber 5-30 Minuten

### Pruefen ob DNS funktioniert

```bash
# Vom lokalen Rechner aus:
dig songbook.weraforum.de +short
# Sollte die IP der VM zurueckgeben

nslookup songbook.weraforum.de
# Gleicher Check, anderes Tool
```

---

## 10. Erster Start und Verifizierung

### 10.1 Deploy starten

In Coolify: **Deploy** klicken.

Der Build dauert ca. 2-5 Minuten:
1. Dependencies installieren (`npm ci`)
2. Next.js Build (`next build --webpack`)
3. Service Worker generieren (Serwist)
4. Docker Image erstellen (Multi-Stage: deps -> builder -> runner)

### 10.2 Checkliste nach dem ersten Deploy

- [ ] `https://songbook.weraforum.de` erreichbar
- [ ] SSL-Zertifikat gueltig (Schloss-Icon im Browser)
- [ ] Login-Seite wird angezeigt
- [ ] Mit Admin-Account einloggen (aus Schritt 6)
- [ ] Songs-Seite laedt (leer, aber ohne Fehler)
- [ ] Navigation funktioniert (Songs, Setlists, Verwaltung)
- [ ] Admin-Panel: Abteilungen werden angezeigt
- [ ] Admin-Panel: Neuen Nutzer anlegen funktioniert
- [ ] PWA installierbar (Browser zeigt "Zum Startbildschirm hinzufuegen")
- [ ] Responsive: Mobile Bottom Nav, Desktop Sidebar

### 10.3 Logs pruefen

In Coolify unter **Logs** den Container-Output pruefen. Haeufige Fehler:

- `NEXT_PUBLIC_SUPABASE_URL is undefined` -> Build-Variable nicht gesetzt
- `Invalid API key` -> Anon Key oder Service Role Key falsch
- `relation "organizations" does not exist` -> Migrationen nicht ausgefuehrt
- `ECONNREFUSED` -> Supabase nicht erreichbar (URL pruefen, Docker-Netzwerk pruefen)

---

## 11. PWA-Installation fuer Endnutzer

Die App ist eine Progressive Web App (PWA). Nutzer muessen **nichts herunterladen** — sie oeffnen einfach die URL und koennen die App auf dem Homescreen installieren.

### So kommunizierst du es an die Gemeinde

> **Anleitung fuer Gemeindemitglieder:**
>
> 1. Oeffne `songbook.weraforum.de` in deinem Browser
> 2. Logge dich mit deinem Benutzerkonto ein
> 3. Installiere die App auf deinem Geraet:
>
> **iPhone/iPad (Safari):**
> - Tippe auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben)
> - Scrolle nach unten und tippe **"Zum Home-Bildschirm"**
> - Tippe **"Hinzufuegen"**
>
> **Android (Chrome):**
> - Tippe auf die **drei Punkte** oben rechts
> - Tippe **"App installieren"** oder **"Zum Startbildschirm hinzufuegen"**
>
> **Desktop (Chrome/Edge):**
> - Klicke auf das **Installations-Icon** in der Adressleiste (Monitor mit Pfeil)
> - Klicke **"Installieren"**
>
> Nach der Installation erscheint die App als Icon auf deinem Home-/Startbildschirm.
> Sie oeffnet sich dann im Vollbild ohne Browser-Leiste.

### Wichtige Hinweise zur PWA

- **Kein App Store noetig** — die App wird direkt aus dem Browser installiert
- **Automatische Updates** — bei jedem Oeffnen laedt die App im Hintergrund die neuste Version. Der Nutzer muss nichts tun.
- **Offline-Faehig** — die naechsten 3 veroeffentlichten Setlisten + deren Songs werden automatisch gecached und sind auch ohne Internet abrufbar
- **iOS 16.4+** erforderlich fuer volle PWA-Unterstuetzung (aeltere iOS-Versionen: eingeschraenkt)
- Die App funktioniert auch ohne Installation direkt im Browser

---

## 12. Updates und Wartung

### 12.1 App-Updates deployen

**Automatisch (empfohlen):**

Der Workflow fuer Updates:

```
1. Entwicklung auf Branch "develop"
2. Testen (lokal oder auf dev.weraforum.de)
3. Pull Request: develop -> main
4. PR mergen
5. Coolify erkennt den Push auf "main" via Webhook
6. Automatischer Build + Deploy (2-5 Min)
7. Zero-Downtime: alter Container laeuft bis neuer bereit ist
```

**Manuell:**

In Coolify: Projekt oeffnen -> **Deploy** klicken.

### 12.2 Rollback

Falls ein Deploy fehlschlaegt oder einen Bug einfuehrt:

1. In Coolify: Projekt -> **Deployments** Tab
2. Fruehere erfolgreiche Deployment finden
3. **Redeploy** klicken -> stellt die alte Version wieder her

Alternativ ueber Git:

```bash
# Auf deinem lokalen Rechner:
git revert HEAD    # Letzten Commit rueckgaengig machen
git push origin main  # Push triggert Auto-Deploy
```

### 12.3 Datenbank-Migrationen (bei neuen Features)

Neue Migrationen muessen **vor** dem App-Deploy ausgefuehrt werden:

```bash
# Neue Migrationsdateien ausfuehren
npx supabase db push --db-url "postgresql://postgres:PASSWORT@supabase.weraforum.de:5432/postgres"
```

> **Reihenfolge beachten:** Zuerst Datenbank migrieren, dann App deployen. Sonst versucht die neue App auf Tabellen/Spalten zuzugreifen, die noch nicht existieren.

### 12.4 Supabase Updates

```bash
ssh dein-user@IP_DER_VM
cd /opt/supabase/docker

# Neueste Version holen
git pull

# Container aktualisieren
docker compose pull
docker compose up -d
```

### 12.5 System-Wartung

```bash
# Ubuntu Updates (monatlich empfohlen)
sudo apt update && sudo apt upgrade -y

# Docker Aufraemen (unbenutzte Images loeschen)
docker system prune -a --volumes
# Vorsicht: loescht ALLE unbenutzten Images/Volumes

# Disk Usage pruefen
df -h
docker system df
```

### 12.6 Backups

**Datenbank-Backup (wichtig!):**

```bash
# Manuelles Backup
docker exec -t supabase-db pg_dump -U postgres > backup_$(date +%Y%m%d).sql

# Automatisches taegliches Backup (Crontab)
crontab -e
# Folgende Zeile hinzufuegen:
0 3 * * * docker exec -t supabase-db pg_dump -U postgres > /opt/backups/songbook_$(date +\%Y\%m\%d).sql 2>&1
```

```bash
# Backup-Verzeichnis erstellen
sudo mkdir -p /opt/backups
sudo chown $USER:$USER /opt/backups
```

**Backup wiederherstellen:**

```bash
cat backup_20260322.sql | docker exec -i supabase-db psql -U postgres
```

### 12.7 Monitoring

In Coolify kannst du sehen:
- **Logs**: Live Container-Logs
- **Deployments**: Historie aller Deploys mit Status
- **Resource Usage**: CPU/RAM Verbrauch des Containers

Fuer Server-Level Monitoring:

```bash
# Aktuelle Auslastung
htop

# Docker Container Status
docker ps

# Supabase Health
curl -s https://supabase.weraforum.de/rest/v1/ -H "apikey: ANON_KEY" | head -1
```

---

## 13. PWA-Icons ersetzen

Die aktuellen Icons sind Platzhalter. Ersetze sie durch richtige Grafiken:

1. Erstelle ein Icon (z.B. Logo, Notensymbol) als PNG/SVG
2. Generiere die benoetigten Groessen:
   - `public/icons/icon-192.png` – 192x192px
   - `public/icons/icon-512.png` – 512x512px
   - `public/icons/icon-512-maskable.png` – 512x512px mit Padding (Safe Zone)
3. Committe und pushe -> Coolify deployt automatisch

Tool fuer maskable Icons: https://maskable.app/editor

---

## 14. Troubleshooting

### Build schlaegt fehl

```
error: This build is using Turbopack, with a `webpack` config
```
-> Der `package.json` Build-Befehl muss `next build --webpack` sein. Ist bereits so konfiguriert.

### Supabase-Verbindung schlaegt fehl

1. Pruefe ob `NEXT_PUBLIC_SUPABASE_URL` korrekt ist (mit `https://`)
2. Pruefe ob der Supabase-Server von der VM erreichbar ist:
   ```bash
   curl https://supabase.weraforum.de/rest/v1/ -H "apikey: DEIN_ANON_KEY"
   ```
3. Falls self-hosted: Pruefe ob der Kong-Proxy laeuft: `docker ps | grep kong`
4. Falls gleiche VM: Pruefe ob Docker-Netzwerke korrekt konfiguriert sind

### Login funktioniert nicht

1. Pruefe ob die Migrationen ausgefuehrt wurden
2. Pruefe ob der User in `auth.users` existiert (Supabase Dashboard -> Authentication)
3. Pruefe ob `org_members`-Eintrag existiert
4. Pruefe ob der Custom Access Token Hook aktiv ist

### Admin-Panel zeigt "Keine Berechtigung"

- Der eingeloggte User muss `role = 'admin'` in `org_members` haben
- Nach Rollenaenderung: User muss sich neu einloggen (JWT wird erst beim naechsten Login aktualisiert)

### Service Worker / PWA funktioniert nicht

- Service Worker braucht HTTPS (funktioniert nicht auf HTTP)
- Cache leeren: DevTools -> Application -> Storage -> Clear site data
- SW manuell pruefen: DevTools -> Application -> Service Workers
- iOS: PWA muss ueber Safari installiert werden (nicht Chrome)

### SSL-Zertifikat wird nicht ausgestellt

- DNS muss korrekt auf die VM zeigen: `dig songbook.weraforum.de +short`
- Port 80 muss erreichbar sein (Let's Encrypt HTTP Challenge)
- Cloudflare Proxy muss deaktiviert sein (oder Full Strict SSL nutzen)
- In Coolify Logs nach Traefik/ACME Fehlern suchen

### Container startet, aber App zeigt Fehler

1. Coolify -> Logs pruefen
2. Haeufigste Ursache: Environment-Variablen fehlen oder sind falsch
3. `NEXT_PUBLIC_` Variablen muessen als **Build Variable** markiert sein
4. Nach Aenderung von Build-Variablen: komplett neu deployen (nicht nur restart)

### VM hat nicht genug Speicher

```bash
# Pruefen
free -h
df -h

# Docker aufraemen
docker system prune -a
docker volume prune

# Alte Build-Caches loeschen
docker builder prune -a
```

---

## Zusammenfassung: Reihenfolge

```
 1. ESXi: Ubuntu VM erstellen (4 vCPU, 8 GB RAM, 50 GB Disk)
 2. VM: Firewall einrichten (22, 80, 443)
 3. VM: Coolify installieren
 4. VM: Supabase installieren + konfigurieren
 5. DNS: A-Records fuer songbook.weraforum.de + supabase.weraforum.de
 6. Supabase: Migrationen ausfuehren (4 SQL-Dateien)
 7. Supabase: Custom Access Token Hook aktivieren
 8. Supabase: Organisation + Abteilung + Admin-User anlegen
 9. Coolify: Neues Projekt, Git verbinden, Env-Variablen setzen
10. Coolify: Domain + SSL konfigurieren
11. Coolify: Deploy starten
12. Browser: Einloggen und testen
13. Icons ersetzen + an Gemeinde kommunizieren
14. GitHub Webhook fuer Auto-Deploy einrichten
```
