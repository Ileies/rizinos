# RizinOS - Offene Punkte

## Entfernte Funktionalität - wiederherstellen

- [ ] **onprogress-Callback** in `uploadFiles`, `promptUploadFiles`, `promptUploadFolder` (`src/lib/client/index.svelte.ts`)
  - XHR für den Byte-Transfer-Schritt, fetch für hash/check
  - Neuer Flow ist multi-step (hash → check → upload), Progress nur für Upload-Schritt relevant
- [ ] **traverseDirectory / FileEntry** in `FileSystemObject.svelte` - rekursives Directory-Traversal beim Drag-and-Drop via `webkitGetAsEntry`, mit neuer `uploadFiles(files, dirId)`-API

## Phase 1 - noch offen

- [ ] **Kontext-Menü** für `FileSystemObject` - Aktionen definieren: Öffnen, Herunterladen, Umbenennen, Verschieben, Löschen, Eigenschaften, Symlink erstellen
- [ ] **Doppelklick** in `FileSystemObject` - `launchApp` mit passender App je nach `mimeType`
- [ ] Desktop-Icons aktivieren (in `Desktop.svelte` auskommentiert)

## Architektur-Visionen (nicht vergessen)

- [ ] **Upload über WebSocket** statt REST - alle FSO-Calls in den WebSocket-Layer migrieren sobald das Protokoll definiert ist
- [ ] **Upload-Feedback** im UI - Benachrichtigung/Fortschrittsanzeige sobald Upload startet

## Phase 2 - Datei-UI im Desktop

- [ ] `FileSystemObject`-Komponente vollständig (Icons, Auswahl, Multi-Select)
- [ ] Desktop-Icons aus VFS laden (root-Verzeichnis des Nutzers)
- [ ] Einfacher File-Manager als erste Built-in App

## Phase 3 - Viewer-Apps

- [ ] Bild-Viewer (JPEG, PNG, WebP, GIF, SVG)
- [ ] Media Player (Audio: MP3, OGG, FLAC - Video: MP4, WebM)
- [ ] Text-Viewer / Editor

## Internationalisierung / Lokalisierung

- [ ] **`manifest.webmanifest` `lang` dynamisch** - Statt hardcoded `"en"`: Server-Route `/manifest.webmanifest/+server.ts` die `LOCALE`-Cookie ausliest und das Manifest mit dem passenden BCP-47-Tag zurückgibt
- [ ] **Sprache in User-Settings** - Sprachpräferenz pro Nutzer in der DB speichern; in den OS-Einstellungen umschaltbar; `LOCALE`-Cookie beim Login auf die gespeicherte Präferenz setzen

---

## Phase 4 - OS-Erfahrung

- [ ] Snap-to-edge im Window Manager
- [ ] App-Launcher mit echten Apps
- [ ] Kontext-Menüs systemweit verdrahten
