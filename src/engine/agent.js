// ============================================================
//  WUMPUS AGENT — Decision-Making & Navigation
// ============================================================
import {
  KnowledgeBase,
  generateWorld,
  getPercepts,
  getNeighbors,
} from './wumpusLogic';

export const CELL_UNKNOWN = 'unknown';
export const CELL_SAFE = 'safe';
export const CELL_VISITED = 'visited';
export const CELL_PIT = 'pit';
export const CELL_WUMPUS = 'wumpus';
export const CELL_GOLD = 'gold';

export function createAgentState(rows, cols) {
  const world = generateWorld(rows, cols);
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      status: CELL_UNKNOWN,
      breeze: null,
      stench: null,
      glitter: false,
    }))
  );

  return {
    rows,
    cols,
    world,
    grid,
    agentPos: [0, 0],
    kb: new KnowledgeBase(),
    log: [],         // Array<{type, text, steps?}>
    percepts: [],    // current percepts
    gameOver: false,
    won: false,
    totalInferenceSteps: 0,
    moveCount: 0,
  };
}

/** Process arrival at (r,c): update grid, KB, run inferences */
export function agentVisit(state, r, c) {
  const { world, grid, kb, rows, cols } = state;
  const percept = getPercepts(r, c, world, rows, cols);
  const log = [...state.log];
  let gameOver = state.gameOver;
  let won = state.won;

  // Mark visited
  grid[r][c].status = CELL_VISITED;
  grid[r][c].breeze = percept.breeze;
  grid[r][c].stench = percept.stench;
  grid[r][c].glitter = percept.glitter;

  const perceptList = [];
  if (percept.breeze) perceptList.push('Breeze');
  if (percept.stench) perceptList.push('Stench');
  if (percept.glitter) perceptList.push('Glitter ✨');
  if (!percept.breeze && !percept.stench && !percept.glitter) perceptList.push('None');

  log.push({ type: 'move', text: `Moved to (${r},${c}). Percepts: ${perceptList.join(', ')}` });

  // Death checks
  if (percept.pit) {
    log.push({ type: 'death', text: `☠️ Fell into a pit at (${r},${c})! Game over.` });
    grid[r][c].status = CELL_PIT;
    return { ...state, grid, log, gameOver: true, won: false, percepts: perceptList };
  }
  if (percept.wumpusThere) {
    log.push({ type: 'death', text: `☠️ Eaten by the Wumpus at (${r},${c})! Game over.` });
    grid[r][c].status = CELL_WUMPUS;
    return { ...state, grid, log, gameOver: true, won: false, percepts: perceptList };
  }
  if (percept.glitter) {
    log.push({ type: 'win', text: `🏆 Found the Gold at (${r},${c})! You win!` });
    grid[r][c].status = CELL_GOLD;
    return { ...state, grid, log, gameOver: true, won: true, percepts: perceptList };
  }

  // Update KB with percepts
  kb.assertSafe(r, c);
  if (percept.breeze) {
    kb.assertBreeze(r, c);
    kb.addBreezePercept(r, c, rows, cols);
  } else {
    kb.assertNoBreeze(r, c);
    // No breeze → all neighbors safe from pits
    for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
      kb.assertSafe(nr, nc);
    }
  }
  if (percept.stench) {
    kb.assertStench(r, c);
    kb.addStenchPercept(r, c, rows, cols);
  } else {
    kb.assertNoStench(r, c);
  }

  // Run resolution on all unknown neighbors
  let totalInferenceSteps = state.totalInferenceSteps;
  const inferenceResults = [];
  for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
    if (grid[nr][nc].status !== CELL_UNKNOWN) continue;
    const pitProof = kb.proveNoPit(nr, nc);
    totalInferenceSteps = kb.inferenceSteps;
    if (pitProof.safe) {
      const wumpusProof = kb.proveNoWumpus(nr, nc);
      totalInferenceSteps = kb.inferenceSteps;
      if (wumpusProof.safe) {
        grid[nr][nc].status = CELL_SAFE;
        inferenceResults.push({
          type: 'inference',
          text: `KB proved (${nr},${nc}) is SAFE (no pit, no wumpus).`,
          steps: [...pitProof.steps, ...wumpusProof.steps],
        });
      }
    }
  }

  if (inferenceResults.length === 0) {
    log.push({
      type: 'inference',
      text: `KB inference: no new safe cells proven from (${r},${c}).`,
      steps: [],
    });
  } else {
    log.push(...inferenceResults);
  }

  return {
    ...state,
    grid,
    kb,
    log,
    agentPos: [r, c],
    percepts: perceptList,
    gameOver,
    won,
    totalInferenceSteps,
    moveCount: state.moveCount + 1,
  };
}

/** Pick next move: prefer proven safe unvisited → fallback to random neighbor */
export function pickNextMove(state) {
  const { grid, agentPos, rows, cols } = state;
  const [r, c] = agentPos;
  const neighbors = getNeighbors(r, c, rows, cols);

  // Priority 1: proven safe unvisited neighbors
  const safeNeighbors = neighbors.filter(
    ([nr, nc]) => grid[nr][nc].status === CELL_SAFE
  );
  if (safeNeighbors.length > 0) {
    return safeNeighbors[0];
  }

  // Priority 2: any unvisited proven safe cell (BFS)
  for (let nr = 0; nr < rows; nr++) {
    for (let nc = 0; nc < cols; nc++) {
      if (grid[nr][nc].status === CELL_SAFE) return [nr, nc];
    }
  }

  // Fallback: random unvisited unknown neighbor
  const unknown = neighbors.filter(([nr, nc]) => grid[nr][nc].status === CELL_UNKNOWN);
  if (unknown.length > 0) {
    return unknown[Math.floor(Math.random() * unknown.length)];
  }

  return null; // stuck
}