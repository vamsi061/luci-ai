# Luci — AI Holographic Companion 🌸

A real-time, **voice-to-voice** AI companion that lives in your browser. Luci uses the **Gemini Live API** for low-latency speech streaming, a custom WebSocket bridge for live audio, a persistent memory core, and an embedded web browser agent she can drive by voice.

Ask her anything out loud — search the web, play a YouTube video, open Google Maps, remember facts about you, analyze your screen — all in a cozy holographic HUD.

---

## ✨ Features

- 🎙️ **Real-time voice conversation** — speak to Luci, she speaks back (16 kHz mic in, 24 kHz audio out), with interruption support and live captions.
- 🌸 **Anime companion persona** — warm, soft-spoken, and expressive, with an emotion-reactive holographic visualizer.
- 🧠 **Persistent memory** — Luci remembers who you are, your preferences, and your goals across sessions. Memories are auto-consolidated in the background and stored in `memories.json`.
- 🌐 **Voice-driven browser agent** — "search for X", "open YouTube", "show me this on Maps". Pages render inside a sandboxed proxy browser; sites that can't be embedded (YouTube, GitHub, etc.) auto-open in a real browser tab.
- 🖥️ **Multimodal screen vision** — share your screen and Luci can see it, describe errors, review designs, and explain code.
- 📺 **Real YouTube search** — live video results with thumbnails, durations, and one-click playback.
- 🧮 **Holographic HUD** — status telemetry, waveform visualizers, notes/calendar/tasks/files/terminal modals, themes, and a Clean View (zen) mode.
- 🕵️ **Optional local Playwright agent** — run `local-agent.js` to give Luci control of a real headed Chrome browser on your desktop.

---

## 🧠 How It Works

```
┌─────────────────────────────  Browser  ─────────────────────────────┐
│  React App  (served on :3000)                                       │
│  ┌──────────────┐   WebSocket /live   ┌───────────────────────────┐ │
│  │  Luci HUD     │◄──────────────────►│  Node server (server.ts)  │ │
│  │  · Visualizer │  audio / video /   │  · WebSocket bridge       │ │
│  │  · Browser    │  tool calls        │  · tool-call orchestration│ │
│  │  · Memory     │                    │  · memory engine          │ │
│  └──────┬───────┘                    └────────────┬──────────────┘ │
│         │ iframe  /api/web-proxy                   │ @google/genai  │
│         ▼                                          ▼                │
│  Embedded proxy browser                    Gemini Live API          │
└─────────────────────────────────────────────────────────────────────┘
           │ http://localhost:3001  (optional)
           ▼
   local-agent.js — real headed Chromium on your desktop
```

**The audio path:** your mic is captured at 16 kHz, converted to raw PCM, and streamed over the WebSocket to the server, which forwards it to the Gemini Live session. Gemini's spoken replies come back as 24 kHz PCM chunks and are played back through a gapless double-buffer audio scheduler. Screen-share frames are compressed to JPEG and streamed the same way for multimodal vision.

**The browser path:** voice commands become Gemini *function calls* (e.g. `browserOpen`, `browserSearch`, `browserClick`). The client executes them against the embedded browser agent. Most sites render through a server-side HTML proxy (`/api/web-proxy`) that strips framing restrictions and rewrites links so clicks work in-app. Google search URLs are transparently routed to DuckDuckGo's server-rendered HTML search, since Google requires JavaScript and cannot be proxied.

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS 4, Motion, Lucide icons |
| Backend | Node.js, Express, `ws` (WebSocket bridge) |
| AI | `@google/genai` — Gemini Live (`gemini-3.1-flash-live-preview`, voice *Aoede*) |
| Memory | `memories.json` + background consolidation with `gemini-3.5-flash` |
| Optional | Playwright (`local-agent.js`) for real-browser control |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (20+ recommended)
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Install dependencies

```bash
npm install
```

### 2. Set your API key

Copy the example env file and add your key:

```bash
cp .env.example .env
```

```bash
# .env
GEMINI_API_KEY="your_key_here"
```

> `GEMINI_API_KEY` is **required** — the server refuses to start a live session without it. `APP_URL` is only needed for hosted/self-referential links.

### 3. Run the dev server

```bash
npm run dev
```

Then open **http://localhost:3000**, click the mic button, allow microphone access, and start talking to Luci. 🎤

### 4. (Optional) Enable the real-browser agent

For a real headed Chrome browser that Luci fully controls on your desktop:

```bash
npm install playwright express cors
npx playwright install chromium
node local-agent.js    # listens on http://localhost:3001
```

Luci automatically detects the agent and prefers it over the embedded browser. (You can also create `local-agent.js` anywhere on your machine from the repo root.)

> 🔑 **Logins persist:** the agent uses a **persistent profile** stored in `~/.luci-browser-profile`. The first time it launches, log into your sites (GitHub, Google, etc.) once in the window that opens — those logins are remembered across restarts, so Luci's real browser stays signed in.

---

## 🗣️ Things You Can Say

| Say this… | Luci does |
|---|---|
| "Search Google for **MovieRules**" | Opens real search results in the browser |
| "Open YouTube and play **Naruto openings**" | Live YouTube results grid → plays the video |
| "Show me **cafes nearby** on maps" | Opens Google Maps embed for the place |
| "Remember my favorite language is **Telugu**" | Saves it to the memory core |
| "Open **github.com**" | Auto-launches the real site in a native browser tab |
| "What is on my screen?" | Analyzes your shared screen via vision |
| "Change the background to **violet**" | Shifts the HUD theme |

Tool calls available to the model: `browserOpen`, `browserSearch`, `browserClick`, `browserMediaControl`, `browserScroll`, `browserType`, `browserGoBack`, `browserTabAction`, `browserReadContent`, `changeBackground`, `saveCustomMemory`.

---

## 📁 Project Structure

```
├── server.ts                 # Express + WebSocket bridge + Gemini Live + proxy APIs
├── server_memory.ts          # Memory file I/O + background memory consolidation
├── local-agent.js            # Optional Playwright real-browser agent (:3001)
├── memories.json             # Persistent memory store (auto-managed)
├── index.html                # Vite entry
├── vite.config.ts
└── src/
    ├── App.tsx               # Main HUD, session wiring, tool-call queue
    ├── main.tsx
    ├── index.css             # Tailwind + theme styles
    ├── components/
    │   ├── LuciCoreVisualizer.tsx   # Holographic character + emotion canvas
    │   ├── BrowserAgent.tsx         # Embedded proxy browser + automation
    │   ├── MemoryDashboard.tsx      # Memories UI
    │   ├── HudModals.tsx            # Notes / calendar / tasks / files / terminal / settings
    │   └── HolographicProjector.tsx
    └── lib/
        ├── audio.ts          # Live audio session (mic in, playback out, WS)
        ├── memoryTypes.ts
        └── urlUtils.ts       # Google → DuckDuckGo embeddable-search rewrite
```

### Server API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/memories` · `POST` · `DELETE /:id` | Memory CRUD |
| `GET /api/web-proxy?url=` | Server-side HTML proxy for the embedded browser |
| `GET /api/proxy?url=` | Structured page scraper (title, headings, links, text) |
| `GET /api/youtube-search?q=` | Real YouTube search results |
| `WS /live` | Live audio/video bridge to Gemini Live |

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Express + Vite middleware) on `:3000` |
| `npm run build` | Production build (Vite client + bundled `dist/server.cjs`) |
| `npm start` | Run the production server from `dist` |
| `npm run preview` | Vite preview of the built client |
| `npm run lint` | Type-check with `tsc --noEmit` |

---

## 🔧 Troubleshooting

- **Session ends right after Luci saves a memory** — older dev servers reload the page whenever `memories.json` is written. This is fixed: Vite's watcher now ignores `memories.json`. **Restart** with `npm run dev` to pick up the fix.
- **Browser shows a blank frame / status stuck on `ANALYZING`** — usually a stale page from before the tab-init fix. Hard-refresh the browser with `Cmd/Ctrl + Shift + R`.
- **Google search results don't render** — Google blocks iframes and server-side fetches, so search URLs are rewritten to DuckDuckGo's HTML engine (which renders real results). This is intentional.
- **`net::ERR_CONNECTION_REFUSED` on `:3001`** — harmless: that's Luci polling for the optional local Playwright agent, which isn't running. The embedded browser is used instead.
- **The real browser opens a site but shows a login page** — the local agent keeps its own **persistent profile** (`~/.luci-browser-profile`). Log into the site *once* in Luci's browser window; logins persist afterward. If a previous agent instance was killed abruptly and the profile is locked, close other Luci browser windows or delete that folder and retry.
- **Browser blocked the auto-open tab** — popup blockers can block Luci from opening restricted sites (especially on voice commands with no click). Use the **RE-LAUNCH NATIVE TAB** button on the portal, or run `local-agent.js`.

---

## 📝 License

Private project — all rights reserved.
