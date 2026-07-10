# Architektur & Roadmap

Dieses Dokument hält die Produktvision von RizinOS und den Bauplan zur App-Plattform fest, damit Design-Entscheidungen nicht nur im Kopf existieren.

## Vision

RizinOS ist ein **persönliches Web-OS**: eine Desktop-Shell im Browser mit Fenstermanagement, VFS und einer **offenen App-Plattform**. Minecraft-Integration, Minechat und Discord sind vorerst Sondermodule, sollen aber langfristig als native Apps auf derselben Plattform laufen wie Apps von Drittanbietern.

Die Desktop-Shell selbst (Fenster, Dock, Kontextmenü, VFS) ist kein Endprodukt, sondern der Wirt für Apps. Ohne funktionierendes App-System ist die Shell eine Hülle ohne Inhalt - das ist aktuell der größte Flaschenhals.

## App-Plattform

### Manifest & Registry

Jede App besitzt ein Manifest (Name, Icon, Entry-Point, angeforderte Permissions, Version). Die `apps`-Tabelle (`schemaApps.ts`) wird zur Registry ausgebaut; ein Review-Flow für Drittanbieter-Einreichungen nutzt vermutlich `schemaModeration.ts`.

### Sandbox & Isolation

Sicherheit hat Priorität vor Schnelligkeit beim Ausrollen. Grundprinzip: Apps laufen **client-seitig in eigenen `<iframe>`s** mit striktem CSP, eigener Origin (Content-Hash- oder Subdomain-basiert) und einer `postMessage`-Bridge zur Shell - kein direktes DOM- oder Origin-Sharing mit der Shell oder anderen Apps.

Offene Designfrage, die vor Implementierungsbeginn geklärt werden muss: Dürfen Apps eigenen Server-Code ausführen (z.B. via WASM/Worker-Isolation), oder bleiben sie reine Client-UIs gegen die bestehenden `/api/os/*`-Endpunkte? Das entscheidet, ob zusätzlich eine Server-seitige Sandbox-Runtime nötig wird.

### Berechtigungsmodell

Granulare Permissions (VFS-Zugriff, Netzwerk, Notifications, Clipboard) analog zum `restrict`-Konzept in den Minecraft-Tabellen, aber neu für Apps. Nutzer bestätigen angeforderte Permissions beim ersten Start einer App.

### API-Tokens

Apps erhalten scoped Tokens statt vollem User-Kontext, um gegen `fso`- und `os`-Endpunkte zu sprechen. Löst das offene TODO in `src/routes/+page.server.ts`.

### Ressourcenlimits

`ProcessHandler.ts` wird um Zeit-/Ressourcenlimits pro App-Instanz erweitert, damit eine einzelne App nicht die Shell oder andere Apps beeinträchtigen kann.

## Phasen

**Phase 0 - Fundament (aktuell)**
Desktop-Shell lückenlos machen: Kontextmenü-Actions, Desktop-Icons/VFS-Darstellung, Mobile-Layout. Blockiert alles Weitere, weil die App-Plattform auf einer funktionierenden Shell aufsetzt.

**Phase 1 - App-Plattform, Kern**
Manifest & Registry, Sandbox-Runtime, Berechtigungsmodell, API-Token-System, Ressourcenlimits. Der größte Einzelblock der Roadmap.

**Phase 2 - App-Store & Distribution**
Einreichung/Review-Flow für Drittanbieter-Apps, App-Launcher an echte Registry anbinden, Autostart-Services.

**Phase 3 - Bestehende Module andocken**
Minecraft-Integration als erste native App umziehen (Realitätstest für Sandbox/Permissions), danach Minechat/Discord. Payment/Transaction-Flow (`api/mc/pay`) bewusst erst hier fertigstellen - kein kurzfristiger Druck.

## Offene Fragen

- Server-seitige App-Ausführung: ja/nein, und wenn ja mit welcher Isolationstechnik?
- Zweck von `@threlte/core`/`three` in den Dependencies: geplantes 3D-Desktop-Feature oder toter Code?
