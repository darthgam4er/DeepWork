<p align="center">
  <h1 align="center">⚡ DeepWork</h1>
  <p align="center">A premium, free, offline desktop Pomodoro app with gamified productivity.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28-47848F?logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## ✨ Features

### 🎯 Pomodoro Timer
- Configurable work/break/long-break durations
- Auto-start options for work and break sessions
- Visual progress ring with animated pulse effects
- Session cycle tracking with dot indicators
- Mini timer overlay mode (always-on-top, glassmorphic)
- Global keyboard shortcut to toggle timer

### 📋 Task Management
- Create, edit, and organize tasks with priority levels
- Link tasks to focus sessions for tracking
- Pomodoro estimation and progress per task
- Drag-and-drop reordering

### 📊 Analytics Dashboard
- Weekly focus history with bar charts
- Session heatmap by hour
- Day streak tracking
- Task completion rate
- Focus time trends (week-over-week comparison)
- Today's progress ring with daily goal
- Task focus breakdown

### 🎨 Theme Studio
- **4 built-in themes**, each with unique personality:
  - 🖥️ **Retro (Pip-Boy)** — CRT scanlines, green phosphor glow, monospace font
  - 🌗 **Modern** — Clean glassmorphism, smooth gradients, subtle noise texture
  - 💀 **Deadpool** — Comic-book Bangers font, chaotic rotations, rough borders
  - 💎 **Liquid Glass** — Floating orbs, blur effects, premium transparency
- Full color customization with live preview
- Create and save custom themes

### 🔊 Theme-Specific Sounds
- Every theme has its own completion sounds (generated via Web Audio API — no files needed):
  - **Retro** — 8-bit chiptune victory fanfare
  - **Modern** — Clean ascending/descending chimes
  - **Deadpool** — Chaotic power-chord riffs and snarky alarms
  - **Liquid Glass** — Ethereal crystal harmonics with ambient pads
- Preview sounds in Settings

### 🦊 Nova — AI Pet Companion
- Animated Cyber Fox pet widget on the dashboard
- Pet levels up with XP earned from focus sessions
- **Daily Missions** — Focus time goals, task completion, interactions
- **Cyber Store** — Spend earned credits on cosmetic items (Legendary to Common rarity)
- Mood system that reacts to your productivity

### 📅 Schedule
- Weekly schedule planner
- Assign focus blocks to days

### ⚙️ Settings
- Desktop notifications toggle
- Sound effects toggle with preview buttons
- Debug speed mode for testing
- Data export/import (JSON)
- Factory reset

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm or yarn

### Install & Run

```bash
# Clone the repo
git clone https://github.com/darthgam4er/DeepWork.git
cd DeepWork

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

This compiles TypeScript, bundles with Vite, and packages with `electron-builder`. The installer is output to `dist-electron_installer/`.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Electron 28 |
| **UI** | React 18 + TypeScript 5 |
| **Bundler** | Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **Animations** | Framer Motion 11 |
| **State** | Zustand 4 |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Persistence** | electron-store |
| **Audio** | Web Audio API (programmatic) |
| **Testing** | Vitest + Happy DOM |

---

## 📁 Project Structure

```
src/
├── pages/           # Main app pages
│   ├── Dashboard    # Overview with stats, quick actions, pet widget
│   ├── Timer        # Pomodoro timer with progress ring
│   ├── Tasks        # Task management
│   ├── Analytics    # Charts, streaks, heatmaps
│   ├── ThemeStudio  # Theme creation & customization
│   ├── Schedule     # Weekly planner
│   └── Settings     # App configuration
├── components/      # Shared UI components
│   ├── MiniTimer    # Always-on-top mini overlay
│   ├── Sidebar      # Navigation
│   ├── TitleBar     # Custom window controls
│   ├── pet/         # Nova pet companion system
│   └── ...
├── store/           # Zustand state management
├── lib/             # Utilities, sounds, themes, animations
├── styles/          # Global CSS with theme-specific styles
└── types/           # TypeScript type definitions

electron/
├── main.ts          # Electron main process
└── preload.ts       # Context bridge API
```

---

## 🧪 Testing

```bash
npm test
```

---

## 📝 License

MIT © Youssef

---

<p align="center">
  <b>Built with ❤️ and maximum effort.</b>
</p>
