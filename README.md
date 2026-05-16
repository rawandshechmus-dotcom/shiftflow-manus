# ShiftFlow – Schichtzuweisungs‑Dashboard

Ein modernes, produktionsreifes Dashboard zur Verwaltung von Schichtplänen, Mitarbeitern und Maschinen in Fertigungsunternehmen.  
Entwickelt für Admins, Teamleiter und Mitarbeiter mit rollenbasierter Navigation und Zwei‑Faktor‑Authentifizierung.

![ShiftFlow Dashboard]

## 🎯 Funktionen

### 🔐 Authentifizierung & Sicherheit
- **Login** mit Email und Passwort (bcrypt‑gehashed)
- **Zwei‑Faktor‑Authentifizierung (2FA)** via Google Authenticator / TOTP
- **Rollen‑System**: Admin, Teamleiter, Viewer – jede Rolle sieht nur ihre eigenen Bereiche
- **Session‑basiert** mit HTTP‑only Cookies (`sameSite: strict`)
- **Rate‑Limiting** für 2FA‑Codes

### 👥 Mitarbeiter‑ & Maschinenverwaltung
- **CRUD** für Mitarbeiter (Anlegen, Bearbeiten, Soft‑Delete)
- **Anwesenheitsstatus**: Anwesend, Krank, Urlaub, Unentschuldigt – mit deutscher UI
- **Maschinen‑CRUD** mit Status (Aktiv, Inaktiv, Wartung, Fehler) und Stoppgrund
- **Kachelansicht** für Mitarbeiter und Maschinen

### 📅 Schichtplan & Mitarbeiter‑Portal
- **Admin‑Kalender** mit Monats‑, Wochen‑ und Tagesansicht
- **Schichtzuweisung** per Dropdown (Mitarbeiter + Maschine + Schicht)
- **Live‑Polling** im Mitarbeiter‑Portal (alle 10 Sekunden) – Schichtänderungen erscheinen automatisch
- **Historische Daten** – Schichten aus bis zu 365 Tagen sichtbar

### 🔔 Benachrichtigungen
- **Glocke mit Badge** in der Navigationsleiste
- **Personalisierte Benachrichtigungen** – jeder Mitarbeiter sieht nur seine eigenen Meldungen
- **„Alle gelesen“** und **„Alle anzeigen“** Buttons
- **Trigger**: Neue Schichtzuweisung, Statusänderung, Login

### 🔄 Schichtübergabe (Handover)
- **Popup beim Login** – offene Übergaben der Vorschicht werden automatisch eingeblendet
- **Quittierung** per Klick – dokumentiert und nachvollziehbar
- **Neue Übergabe erstellen** direkt aus der Navigation

### 🎨 Design
- **Dark Mode** global umschaltbar
- **Glassmorphism**‑Karten mit weichen Schatten
- **Responsive** – optimiert für Desktop und Tablet

### ⚙️ Technische Highlights
- **Stresstest bestanden**: 600 gleichzeitige Logins mit 0 Fehlern (bcrypt + Node.js)
- **TypeScript** durchgängig – `pnpm check` mit 0 Fehlern
- **Produktions‑Build** vorhanden (`pnpm build`)

## 📦 Technologie‑Stack

| Bereich | Technologie |
|---------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express, tRPC, Drizzle ORM |
| **Datenbank** | PostgreSQL |
| **Authentifizierung** | bcryptjs, jose (JWT), speakeasy (2FA) |
| **E‑Mail** | nodemailer (mit Ethereal für Entwicklung, Gmail für Produktion) |
| **State Management** | tRPC + React Query |
| **Testing** | Vitest, Autocannon (Stresstest) |
pnpm
## 🚀 Installation & Einrichtung

### Voraussetzungen
- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14
- **pnpm** (empfohlen)

### 1. Repository klonen
```bash
git clone https://github.com/rawandshechmus-dotcom/shiftflow.git
cd shiftflow