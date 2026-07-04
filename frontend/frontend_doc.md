# Frontend Developer Documentation - Aetheris OS

This document outlines the architectural specifications, folder layouts, visual components, and styling protocols for the Aetheris OS client application.

---

## 📂 Project Structure (`d:\robovanthehack`)

```
robovanthehack/
├── public/                 # Static assets (logo, audio sweeps)
├── src/
│   ├── assets/             # Raw icons, images, backgrounds
│   ├── components/         # Reusable presentation and layout components
│   │   ├── AuthBackground.jsx # Fluid vector-field filament canvas background
│   │   ├── AuthCard.jsx       # GSAP-powered login/signup card
│   │   ├── AuthScreen.jsx     # Entrance coordinator
│   │   ├── Dashboard/         # Dashboard layout sections
│   │   │   ├── Boardroom.jsx  # Interactive AI debate node graph
│   │   │   ├── ControlRoom.jsx# Executive telemetry & crisis buttons
│   │   │   ├── Onboarding.jsx # Drag-and-drop document parser viewport
│   │   │   └── Simulator.jsx  # Monte Carlo timeline visualizer
│   ├── store/              # Zustand global state stores
│   │   └── authStore.js       # Authentication, theme, and mute settings
│   ├── utils/              # Helper utility scripts
│   │   └── AudioSynth.js      # Procedural sound synthesizer
│   ├── App.css
│   ├── App.jsx             # Main routing switcher
│   ├── index.css           # Global theme variables, fonts, and grid layout
│   └── main.jsx            # React root mount controller
├── package.json
└── vite.config.js
```

---

## 🎨 Design System & Custom Styling Variables
We avoid standard UI frameworks. All visual cards are built using a hybrid "Frosted Clinical Glass" (Glassmorphism) and embossed plate structure (Neumorphism).

Theme variables are stored in `src/index.css` and managed via a `[data-theme]` attribute on the document root:
* **Dark Mode (`[data-theme="dark"]`)**: Deep obsidian backgrounds (`#06070d`), glowing neon cyber cyan (`#00f2fe`) and purple (`#7f00ff`) borders, and low-opacity cyber grid matrices.
* **Light Mode (`[data-theme="light"]`)**: High-contrast clinical slate (`#f4f6fa`), soft sky blue highlights (`#0284c7`), and clean coordinate ticks.

---

## 🌪️ Canvas Animation Mechanics
The main background runs a custom **Fluid Vector-Field Filament System** on a 2D/WebGL-like HTML5 Canvas context:
* Generates 75 dynamic filaments with position histories to draw glowing trails.
* Updates positions via a trigonometric vector flow-field (`Math.sin` and `Math.cos` waves).
* Introduces a mouse radius listener; coordinate velocity vectors are warped perpendicularly to generate an orbital vortex swarm around the cursor.

---

## 🔗 Real-time State & Socket Integrations
The frontend uses **Zustand** to keep states simple and fast:
* Caches user configurations, session tokens, and visual mode flags.
* Connects to a `Socket.io` client instance when a session starts.
* Listens to the following events:
  * `boardroom_debate_packet`: Telemetry packets containing agent conversation logs and active voting arrays to update the boardroom graph.
  * `simulation_result`: Returns data trees for the Monte Carlo growth simulator.
  * `telemetry_tick`: Live patient/buyer telemetry signals to update the Recharts grid.
