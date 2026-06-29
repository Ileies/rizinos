# RizinOS - Feature Roadmap

A full, web-native operating system. Hardware-independent by design. Built with Rust WASM modules and a NixOS-inspired architecture.

**Status tags:** `[done]` = implemented and working, `[partial]` = schema/skeleton exists, `[planned]` = not started

---

## Adaptive UI `[partial]`

RizinOS detects the device type and screen size at runtime and renders a UI that feels native to that context. There is no separate mobile app — the same codebase adapts automatically.

- **Phone** - Android-inspired layout: bottom navigation, full-screen apps, swipe gestures, notification drawer, no visible window chrome
- **Tablet** - Split-view capable, side dock, adaptive panels
- **Desktop** `[partial]` - Windowed apps, taskbar, desktop icons, right-click context menus, keyboard shortcuts
- **Touch detection** - Input method (touch vs. pointer) adjusts tap targets, gesture recognition, and interaction patterns
- **Responsive windows** `[partial]` - App windows respect viewport constraints; on small screens apps run full-screen automatically
- **Consistent core** - Same filesystem, same apps, same account — only the shell chrome adapts

---

## Core OS

- **Window manager** `[partial]` - Drag, resize, minimize, maximize, snap-to-edge, multi-window focus management
- **Process model** - Isolated WASM process per app, typed IPC messaging between processes
- **Virtual file system** `[partial]` - Hierarchical VFS with POSIX-like paths, DB-backed (`file_meta` table)
- **Declarative configuration** - NixOS-inspired system config: version-controlled, reproducible, rollback-able
- **Immutable updates** - Atomic system updates; any update can be reverted instantly
- **Session restore** - Full OS state persisted across tab reloads and browser restarts
- **Multi-user support** - Isolated user environments sharing no state, per-user permissions
- **Theme engine** - System-wide light/dark/custom themes, per-app color overrides
- **i18n** `[done]` - Full interface translation (German, English, Chinese, Russian); per-topic JSON files compiled at build time; locale cookie; 4 locales: de, en, cn, ru
- **Notification center** `[partial]` - Priority-based notifications (client state exists)
- **Context menus** `[partial]` - Right-click menus (client menu system exists)
- **System sounds** `[partial]` - Sound state management exists

---

## Rust WASM Modules (kernel layer)

- **WASM kernel** - Core OS logic written in Rust, compiled to WebAssembly; runs in a dedicated worker
- **Memory management** - Per-process memory isolation, garbage-collected sandbox per app
- **Scheduler** - Cooperative multitasking scheduler for concurrent WASM processes
- **IPC bus** - Typed inter-process communication between WASM modules and JS shell
- **Module registry** - Hot-loadable WASM modules; new OS capabilities ship without page reload
- **Crypto primitives** - Rust-backed cryptographic operations (AES-GCM, Ed25519, Blake3)
- **Compression** - Zstd/LZ4 via WASM for file storage and transfer

---

## Background App (native companion)

- **File sync** - Bidirectional sync between device filesystem and cloud VFS; delta-based
- **Cloud backup** - Continuous versioned backups with configurable retention
- **Drag-and-drop upload** - Drop files from device desktop directly into the browser OS
- **Peripheral access** - Camera, microphone, USB, serial devices bridged to the browser OS
- **Push notifications** - OS notifications delivered even when the browser tab is closed
- **Offline mode** - Queue operations offline, sync automatically on reconnect
- **Tray integration** - System tray icon for quick status, upload, and settings access
- **Auto-update** - Background app self-updates silently
- **Platforms** - Linux, macOS, Windows (planned)

---

## Built-in Applications

### Files

- Full file manager with tree navigation, grid/list views
- Cut, copy, paste, drag-and-drop between windows
- Bulk rename, tagging, color labels
- Preview pane for images, text, PDFs, audio

### Terminal

- POSIX shell (bash-compatible) running in WASM
- Tab completion, history, split panes
- SSH client for remote servers
- Custom shell plugins

### Browser

- Sandboxed in-OS web browser
- Tab management, bookmarks, history
- Ad/tracker blocking built in

### Notes

- Rich-text editor with markdown support
- Notebooks, tags, full-text search
- Automatic versioning and conflict resolution
- Offline-first, synced

### Mail

- Multi-account IMAP/SMTP client
- Threaded conversations, labels, filters
- GPG signing/encryption support

### Calendar

- Multi-calendar (CalDAV sync)
- Event invites, reminders, recurring events

### Chat (iChat)

- Real-time messaging between RizinOS users
- Group channels, direct messages
- File sharing, reactions, threads
- Bridged to Discord via Minechat

### Video Calls

- WebRTC P2P video and audio calling
- Group calls, screen sharing, virtual backgrounds

### Photos

- Gallery with albums, search by date/tag
- Non-destructive edits (crop, brightness, filters)

### Music

- Audio player supporting common formats via WASM decoder
- Playlists, queue management, media key integration

### Diary

- Private encrypted journal with daily entries
- Search, tagging, mood tracking

### App Store

- Installable third-party apps as WASM modules
- Sandboxed permissions model per app
- Auto-updates, ratings, developer portal

### Settings

- System preferences: display, sound, accounts, privacy
- App permissions manager
- Storage analytics
- Network configuration

---

## Storage & Files

- **Cloud VFS** - Every user gets a cloud-backed virtual filesystem (default 10 GB, expandable)
- **File metadata** - Custom metadata, tags, color labels, comments per file
- **Versioning** - Automatic version history for every file (configurable depth)
- **Sharing** - Per-file/folder share links with expiry, password, and permission levels
- **Encryption** - Client-side E2E encryption; server never sees plaintext
- **CDN delivery** - Static assets and downloads served from CDN edge

---

## Authentication & Accounts

- **Password login** `[done]` - Email + password auth with hashed passwords
- **Email magic link** `[planned]` - Passwordless email login
- **Google OAuth** `[done]` - Sign in with Google (Arctic library)
- **Email verification** `[done]` - Confirm-email flow after signup
- **Device trust** `[done]` - Recognized devices (deviceToken cookie) skip re-auth
- **Session management** - View and revoke active sessions per-device
- **2FA** - TOTP-based two-factor authentication (planned)

---

## Developer Platform

- **App SDK** - TypeScript SDK for building WASM-based OS apps
- **App sandbox** - Each third-party app runs in an isolated process with declared capabilities
- **Permissions API** - Apps request capabilities (file access, camera, network) at install time
- **IPC API** - Apps communicate through the OS IPC bus; no direct DOM access
- **CLI tools** - `rizinos-cli` for scaffolding, packaging, and publishing apps
- **Hot reload** - Live-reload of app WASM modules during development

---

## Infrastructure & Platform

- **WebSocket server** `[done]` - Custom Bun WebSocket server at `/ws` for live OS events
- **Horizontal scaling** - Stateless app servers behind load balancer; session state in DB
- **PostgreSQL** `[done]` - Primary data store via Drizzle ORM
- **Object storage** - S3-compatible storage for user files
- **Admin dashboard** `[done]` - User management (roles, edit, delete), Minecraft integration controls
- **Analytics** - Privacy-respecting usage analytics (PostHog self-hosted)

---

## Integrations

- **Minecraft** `[done]` - Server management: start/stop, worlds/world groups, inventories, warps, permissions, credit system, ban/mute, home locations, Mojang API validation for player creation
- **Minechat** `[partial]` - Schema + API endpoints for Discord-Minecraft bridge; full logic incomplete
- **Discord** `[partial]` - Schema for Discord users; bot integration not fully wired
- **Stripe** - Subscription billing and in-OS micropayments (planned)
- **OpenAI** - AI assistant integrated at OS level (planned)

---

## Homepage & Marketing `[done]`

- Internationalized homepage (Hero, header, footer) in de/en/cn/ru
- Inline signup flow on hero section
- Login page with Google OAuth + password auth
- About, legal, privacy, terms pages
- Redirect to `/app` after login; `?redirect=` param support

---

## Status Legend

- `[done]` - Implemented and working in the current codebase
- `[partial]` - Schema, skeleton, or state management exists; not fully functional
- `[planned]` - Designed but not yet started
- No tag = planned but not yet started
- Roadmap is subject to change as the project evolves.
