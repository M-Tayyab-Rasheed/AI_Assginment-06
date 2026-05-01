# ◈ WUMPUS.AI — Knowledge-Based Dynamic Pathfinding Agent

> A web-based intelligent agent that navigates a Wumpus World grid using Propositional Logic and automated Resolution Refutation to deduce safe cells in real time.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://your-vercel-url.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)

---

## What Is This?

WUMPUS.AI is a fully client-side web application implementing a **Knowledge-Based Agent** for the classic Wumpus World problem. The agent:

1. **Perceives** its environment (Breeze → nearby Pit, Stench → nearby Wumpus)
2. **Updates** a Propositional Logic Knowledge Base (KB) in CNF form
3. **Reasons** via automated **Resolution Refutation** to prove cells safe
4. **Navigates** intelligently — preferring logically proven safe cells over random exploration

---

## Architecture

```
src/
├── engine/
│   ├── wumpusLogic.js       # KB, CNF clause system, Resolution Refutation engine
│   └── agent.js             # Agent state, visit logic, percept processing, move picker
└── components/
    ├── Grid.jsx              # Visual grid — color-coded cell states
    ├── MetricsDashboard.jsx  # Real-time inference metrics
    ├── KBViewer.jsx          # Live CNF clause browser
    ├── LogPanel.jsx          # Expandable resolution step log
    └── SetupModal.jsx        # Grid configuration UI
```

---

## Core Algorithms

### Knowledge Base (Propositional Logic in CNF)

When the agent visits cell (r, c) and perceives a **Breeze**, it adds the biconditional:

```
B_{r,c} ↔ (P_{r-1,c} ∨ P_{r+1,c} ∨ P_{r,c-1} ∨ P_{r,c+1})
```

Converted to CNF clauses:
- Forward: `¬B_{r,c} ∨ P_n1 ∨ P_n2 ∨ ...`
- Backward: `¬P_ni ∨ B_{r,c}` for each neighbor

No breeze → all neighbors proven safe immediately via unit clauses.

### Resolution Refutation

To prove cell (r, c) has **no pit**, the engine:

1. Negates the goal — assumes pit IS present → adds `[P_{r,c}]`
2. Resolves clause pairs on complementary literals
3. If empty clause `□` is derived → contradiction → cell is SAFE

---

## Features

| Feature | Description |
|---|---|
| Dynamic Grid | User-defined size (3×3 to 12×12), default 4×4 |
| Live KB Viewer | Browse all CNF clauses with source annotations |
| Step / Auto Mode | Step through agent moves or watch it run automatically |
| Resolution Log | Click any inference entry to expand full resolution proof |
| World Reveal | On game over, hidden pits and Wumpus are revealed |
| Real-Time Metrics | Inference steps, KB clause count, cells visited |

---

## Running Locally

```bash
git clone https://github.com/talhaamehmood/Wumpus-Agent.git
cd wumpus-agent
npm install
npm run dev
```

Open http://localhost:5173

---

## Deployment

Deployed on **Vercel**:

```bash
npm install -g vercel
vercel --prod
```

---

## Project Context

**Project:** Dynamic Wumpus Logic Agent (Web App)
**Institution:** FAST-NUCES CFD Campus

Requirements fulfilled:
- Dynamic grid sizing (user-defined rows x cols)
- Random pit and Wumpus placement per episode
- Percept generation (Breeze / Stench)
- Propositional Logic KB with CNF representation
- Automated Resolution Refutation engine
- Web-based GUI with color-coded grid
- Real-time metrics dashboard
- Deployed on Vercel

---

## Tech Stack

- React 18 + Vite 5
- Framer Motion for animations
- Pure JavaScript logic engine (no external AI/logic libraries)

---

## License

MIT
