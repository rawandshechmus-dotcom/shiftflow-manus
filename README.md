# ShiftFlow – Dokumentation

## Überblick

ShiftFlow ist eine moderne Webanwendung zur Verwaltung von Schichtplänen, Mitarbeitern und Maschinen in Fertigungsbetrieben.  
Die Anwendung ersetzt papierbasierte Übergaben und bietet einen **rollenbasierten Zugriff** für Admins, Teamleiter und Werker.

| Kategorie | Beschreibung |
|-----------|--------------|
| **Name** | ShiftFlow |
| **Version** | 1.0.0 |
| **Technologien** | React, Express, PostgreSQL, tRPC, Tailwind |
| **Zielgruppe** | Fertigungsunternehmen mit 3‑Schicht‑System |
| **Sicherheit** | bcrypt, 2FA (Google Authenticator), HTTP‑only Cookies |
| **Entwickler** | Rawand Shechmus |

---

## Einleitung

ShiftFlow wurde für die Praxis entwickelt: Ein **Admin‑Dashboard** ermöglicht die Planung, ein **Viewer‑Board** zeigt Schichten live an, und ein **Mitarbeiter‑Portal** gibt jedem Werker seinen persönlichen Plan an die Hand.  
Die Kommunikation zwischen den Schichten erfolgt über die **integrierte Schichtübergabe**.

**Erste Schritte:**  
1. Repository klonen  
2. `pnpm install` ausführen  
3. `.env`‑Datei mit Datenbankverbindung anlegen  
4. `pnpm dev` starten  
5. Mit `admin@shiftflow.local` / `admin123` einloggen

---

## Zugriff

### Systemvoraussetzungen

| Komponente | Minimalversion |
|------------|----------------|
| Node.js | 20.x oder höher |
| PostgreSQL | 14.x oder höher |
| pnpm | 10.x oder höher |
| Browser | Chrome 120+, Edge 120+, Firefox 128+ |

### Installation (lokal)

```bash
git clone https://github.com/rawandshechmus-dotcom/shiftflow-manus.git
cd shiftflow-manus
pnpm install
