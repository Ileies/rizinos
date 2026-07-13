# RizinOS - Offene Punkte

## Entfernte Funktionalität - wiederherstellen

- [ ] **onprogress-Callback** in `uploadFiles`, `promptUploadFiles`, `promptUploadFolder` (`src/lib/client/index.svelte.ts`)
  - XHR für den Byte-Transfer-Schritt, fetch für hash/check
  - Neuer Flow ist multi-step (hash → check → upload), Progress nur für Upload-Schritt relevant
- [ ] **traverseDirectory / FileEntry** in `FileSystemObject.svelte` - rekursives Directory-Traversal beim Drag-and-Drop via `webkitGetAsEntry`, mit neuer `uploadFiles(files, dirId)`-API

## Phase 1 - noch offen

- [ ] **Kontext-Menü** für `FileSystemObject` erweitern - Download/Umbenennen/Löschen sind erledigt; es fehlen noch: Verschieben (Ziel-Ordner-Dialog), Eigenschaften, Symlink erstellen
- [ ] **Doppelklick** in `FileSystemObject` - lädt Dateien aktuell nur herunter (kein echtes `launchApp` je `mimeType`, da es noch keine App-Plattform gibt); Ordner tun bewusst nichts, bis es eine Explorer-App gibt (siehe Architektur-Visionen/App-Plattform)

## Architektur-Visionen (nicht vergessen)

- [ ] **Upload über WebSocket** statt REST - alle FSO-Calls in den WebSocket-Layer migrieren sobald das Protokoll definiert ist
- [ ] **Upload-Feedback** im UI - Benachrichtigung/Fortschrittsanzeige sobald Upload startet
- [ ] **Eigener MCP-Server für RizinOS** - OS-Funktionen (VFS, Apps, Notifications, etc.) als MCP-Tools bereitstellen, damit LLM-Agenten direkt mit dem OS interagieren können

## Phase 2 - Datei-UI im Desktop

- [ ] `FileSystemObject`-Komponente: Multi-Select (Shift/Ctrl-Klick) - Icons, einzelne Auswahl und Desktop-Laden aus VFS sind erledigt
- [ ] Einfacher File-Manager als erste Built-in App

## Phase 3 - Viewer-Apps

- [ ] Bild-Viewer (JPEG, PNG, WebP, GIF, SVG)
- [ ] Media Player (Audio: MP3, OGG, FLAC - Video: MP4, WebM)
- [ ] Text-Viewer / Editor

## Internationalisierung / Lokalisierung

- [ ] **`manifest.webmanifest` `lang` dynamisch** - Statt hardcoded `"en"`: Server-Route `/manifest.webmanifest/+server.ts` die `LOCALE`-Cookie ausliest und das Manifest mit dem passenden BCP-47-Tag zurückgibt
- [ ] **Sprache in User-Settings** - Sprachpräferenz pro Nutzer in der DB speichern; in den OS-Einstellungen umschaltbar; `LOCALE`-Cookie beim Login auf die gespeicherte Präferenz setzen

## Mobile Shell

- [ ] **`os.isMobile` aufteilen** in zwei Variablen - eine für Touch-Erkennung, eine für Bildschirmgröße (`src/lib/os.svelte.ts`), da beide Eigenschaften unabhängig voneinander gebraucht werden (u.a. `Dock.svelte`, `Window.svelte`, `Notifications.svelte`, Resize-Listener in `+page.svelte`)
- [ ] **Mobile-Taskleiste komplett neu gestalten** - aktuelles Dock-Design hat auf Touch-Geräten zu kleine Buttons (schlechte UX), braucht ein eigenständiges Design statt nur einer schmaleren Desktop-Variante
- [ ] **App-Switcher-Übersicht für Mobile** - eigenständige Kachel-Ansicht zum Wechseln zwischen offenen Apps (wie bei iOS/Android), kein Teil der Taskleiste selbst
- [ ] **Mobile-Desktop-Inhalt** (offene Design-Frage, noch nicht entschieden) - auf Mobile sollen tendenziell mehr Inhalte sichtbar sein als auf Desktop (Apps, Ordner, ggf. einzelne Dateien statt nur Apps), um UX zu maximieren, aber es ist unklar ob Dateien auf dem Mobile-Desktop überhaupt sinnvoll sind oder durch Widgets ersetzt werden sollten - braucht weiteres Nachdenken/Gespräch vor jeder Umsetzung

## OS Skin/Theme-Engine (niedrige Priorität, für später)

- [ ] **Umschaltbare OS-Skins** in den Einstellungen - komplette optische Presets (Windows 7 / 10 / 11, GNOME, KDE, Android, iOS, macOS, etc.), frei wählbar
- [ ] **Offene Design-Entscheidung**: gilt die Skin-Auswahl global (ein Design pro Account), pro Gerät, oder pro Bildschirmgröße? Präferenz falls angegangen: zuerst die Variante "pro Bildschirmgröße" verfolgen - aktuell aber explizit nicht priorisiert

## Change User / Sessions (niedrige Priorität, für später)

- [ ] **Device/Session-Datenmodell neu entwerfen** (`src/lib/server/models/device.ts:23`, bisher nur die Notiz "Think about this. Repair it") - Tabellen/Beziehung Device↔User↔Session, braucht ein gemeinsames Gespräch bevor daran gebaut wird. Blockiert den folgenden Punkt.
- [ ] **"Change User"** im `AppLauncher` (`AppLauncher.svelte`, Button tut aktuell nichts) - einfacher Account-Chooser: kompletter Seiten-Reload beim Wechsel, kein echtes Multi-Session-Switching. Kein Limit für die Anzahl auf einem Gerät gemerkter Accounts (analog zu Google-Accounts im Browser). Nicht dringend, aber nicht vergessen.
- [ ] **Fast User Switching** (echtes gleichzeitiges Multi-User-Switching mit im Hintergrund weiterlaufenden Sessions, wie unter Windows/macOS) - eigener, deutlich größerer Nachfolge-Task zu "Change User", explizit für "sehr viel später in der Zukunft" vorgemerkt

---

## Phase 4 - OS-Erfahrung

- [ ] Snap-to-edge im Window Manager
- [ ] App-Launcher mit echten Apps
- [ ] Kontext-Menüs systemweit verdrahten
