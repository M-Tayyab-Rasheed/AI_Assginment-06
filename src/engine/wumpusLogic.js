// ============================================================
//  WUMPUS WORLD — KNOWLEDGE BASE & RESOLUTION ENGINE
// ============================================================

// ── Clause helpers ──────────────────────────────────────────

/** A literal is { name: string, negated: boolean } */
export const lit = (name, negated = false) => ({ name, negated });
export const neg = (l) => ({ ...l, negated: !l.negated });

/** Canonical string for a literal */
export const litStr = (l) => (l.negated ? '¬' : '') + l.name;

/** Canonical string for a clause (set of literals) */
export const clauseStr = (clause) =>
  clause.length === 0 ? '□' : clause.map(litStr).join(' ∨ ');

/** Deep-equal two literals */
const litEq = (a, b) => a.name === b.name && a.negated === b.negated;

/** Remove duplicate literals from a clause */
const dedup = (clause) =>
  clause.filter(
    (l, i, arr) => arr.findIndex((x) => litEq(x, l)) === i
  );

/** Is clause a tautology? (contains P and ¬P) */
const isTautology = (clause) =>
  clause.some((l) => clause.some((m) => l.name === m.name && l.negated !== m.negated));

/** Resolve two clauses on literal name `pivot`. Returns null if no resolvent. */
export const resolve = (c1, c2, pivot) => {
  const hasPos = c1.some((l) => l.name === pivot && !l.negated);
  const hasNeg = c2.some((l) => l.name === pivot && l.negated);
  if (!hasPos || !hasNeg) return null;
  const merged = dedup([
    ...c1.filter((l) => l.name !== pivot),
    ...c2.filter((l) => l.name !== pivot),
  ]);
  if (isTautology(merged)) return null;
  return merged;
};

// ── Knowledge Base ───────────────────────────────────────────

export class KnowledgeBase {
  constructor() {
    /** @type {Array<{id:number, clause:Array, source:string}>} */
    this.clauses = [];
    this._id = 0;
    this.inferenceSteps = 0;
  }

  _add(clause, source) {
    const c = dedup(clause);
    // Skip if already present
    const key = clauseStr(c);
    if (this.clauses.some((e) => clauseStr(e.clause) === key)) return;
    this.clauses.push({ id: ++this._id, clause: c, source });
  }

  /** Add axioms derived from a Breeze percept at (r,c) */
  addBreezePercept(r, c, rows, cols) {
    const B = `B_${r}_${c}`;
    const neighbors = getNeighbors(r, c, rows, cols);
    // B_{r,c} ↔ (P_n1 ∨ P_n2 ∨ …)
    // Forward: B → (P_n1 ∨ P_n2 ∨ …)  → ¬B ∨ P_n1 ∨ P_n2 ∨ …
    this._add(
      [lit(B, true), ...neighbors.map((n) => lit(`P_${n[0]}_${n[1]}`))],
      `Breeze axiom at (${r},${c}) forward`
    );
    // Backward: each P_ni → B  → ¬P_ni ∨ B
    for (const [nr, nc] of neighbors) {
      this._add(
        [lit(`P_${nr}_${nc}`, true), lit(B)],
        `Breeze axiom at (${r},${c}) backward`
      );
    }
  }

  /** Add axioms derived from a Stench percept at (r,c) */
  addStenchPercept(r, c, rows, cols) {
    const S = `S_${r}_${c}`;
    const neighbors = getNeighbors(r, c, rows, cols);
    this._add(
      [lit(S, true), ...neighbors.map((n) => lit(`W_${n[0]}_${n[1]}`))],
      `Stench axiom at (${r},${c}) forward`
    );
    for (const [nr, nc] of neighbors) {
      this._add(
        [lit(`W_${nr}_${nc}`, true), lit(S)],
        `Stench axiom at (${r},${c}) backward`
      );
    }
  }

  /** Assert that cell (r,c) is safe — ¬P_{r,c} and ¬W_{r,c} */
  assertSafe(r, c) {
    this._add([lit(`P_${r}_${c}`, true)], `Safe: no pit at (${r},${c})`);
    this._add([lit(`W_${r}_${c}`, true)], `Safe: no wumpus at (${r},${c})`);
  }

  /** Assert breeze fact at (r,c) */
  assertBreeze(r, c) {
    this._add([lit(`B_${r}_${c}`)], `Percept: breeze at (${r},${c})`);
  }

  /** Assert no-breeze fact at (r,c) */
  assertNoBreeze(r, c) {
    this._add([lit(`B_${r}_${c}`, true)], `Percept: no breeze at (${r},${c})`);
  }

  /** Assert stench fact at (r,c) */
  assertStench(r, c) {
    this._add([lit(`S_${r}_${c}`)], `Percept: stench at (${r},${c})`);
  }

  /** Assert no-stench fact at (r,c) */
  assertNoStench(r, c) {
    this._add([lit(`S_${r}_${c}`, true)], `Percept: no stench at (${r},${c})`);
  }

  /**
   * Resolution Refutation: prove that cell (r,c) has no pit.
   * Negated goal: P_{r,c}  (assume pit IS there)
   * If we derive □ (empty clause), contradiction → cell is SAFE.
   * Returns { safe: boolean, steps: Array<string>, inferenceCount: number }
   */
  proveNoPit(r, c) {
    return this._refute(`P_${r}_${c}`, `pit at (${r},${c})`);
  }

  /** Same but for Wumpus */
  proveNoWumpus(r, c) {
    return this._refute(`W_${r}_${c}`, `wumpus at (${r},${c})`);
  }

  _refute(propName, label) {
    const steps = [];
    // Add negated goal (assume hazard IS present)
    const negGoal = [lit(propName)];
    steps.push(`Negated goal: assume ${label} → add clause [${clauseStr(negGoal)}]`);

    // Working set = KB clauses + negated goal
    const working = [
      ...this.clauses.map((e) => ({ ...e, clause: [...e.clause] })),
      { id: ++this._id, clause: negGoal, source: 'Negated goal' },
    ];

    const seen = new Set(working.map((e) => clauseStr(e.clause)));
    let found = false;
    let iters = 0;
    const MAX_ITERS = 500;

    outer: for (let i = 0; i < working.length && iters < MAX_ITERS; i++) {
      for (let j = i + 1; j < working.length && iters < MAX_ITERS; j++) {
        iters++;
        const c1 = working[i].clause;
        const c2 = working[j].clause;
        // Try all pivot literals
        const pivots = [...new Set(c1.map((l) => l.name))];
        for (const pivot of pivots) {
          const resolvent = resolve(c1, c2, pivot);
          if (resolvent === null) continue;
          const key = clauseStr(resolvent);
          if (seen.has(key)) continue;
          seen.add(key);
          this.inferenceSteps++;
          steps.push(
            `Resolve [${clauseStr(c1)}] & [${clauseStr(c2)}] on ${pivot} → [${key}]`
          );
          if (resolvent.length === 0) {
            steps.push('□ Empty clause derived → Contradiction! Cell is SAFE.');
            found = true;
            break outer;
          }
          working.push({ id: ++this._id, clause: resolvent, source: 'Resolved' });
        }
      }
    }

    if (!found) {
      steps.push(`No contradiction found — cannot prove cell is safe from KB alone.`);
    }

    return { safe: found, steps, inferenceCount: this.inferenceSteps };
  }

  get clauseCount() {
    return this.clauses.length;
  }

  snapshot() {
    return this.clauses.map((e) => ({
      id: e.id,
      display: clauseStr(e.clause),
      source: e.source,
    }));
  }
}

// ── Grid helpers ─────────────────────────────────────────────

export function getNeighbors(r, c, rows, cols) {
  const result = [];
  if (r > 0) result.push([r - 1, c]);
  if (r < rows - 1) result.push([r + 1, c]);
  if (c > 0) result.push([r, c - 1]);
  if (c < cols - 1) result.push([r, c + 1]);
  return result;
}

// ── World generation ─────────────────────────────────────────

export function generateWorld(rows, cols) {
  const pits = new Set();
  const total = rows * cols;
  // Random pits ~20% of cells, not on start (0,0)
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    if (r === 0 && c === 0) continue;
    if (Math.random() < 0.2) pits.add(`${r},${c}`);
  }
  // Random wumpus — not on start
  let wr, wc;
  do {
    wr = Math.floor(Math.random() * rows);
    wc = Math.floor(Math.random() * cols);
  } while (wr === 0 && wc === 0);

  // Gold — random, not on start
  let gr, gc;
  do {
    gr = Math.floor(Math.random() * rows);
    gc = Math.floor(Math.random() * cols);
  } while (gr === 0 && gc === 0);

  return { pits, wumpus: [wr, wc], gold: [gr, gc] };
}

export function getPercepts(r, c, world, rows, cols) {
  const neighbors = getNeighbors(r, c, rows, cols);
  const breeze = neighbors.some(([nr, nc]) => world.pits.has(`${nr},${nc}`));
  const stench = neighbors.some(
    ([nr, nc]) => nr === world.wumpus[0] && nc === world.wumpus[1]
  );
  const glitter = r === world.gold[0] && c === world.gold[1];
  const pit = world.pits.has(`${r},${c}`);
  const wumpusThere = r === world.wumpus[0] && c === world.wumpus[1];
  return { breeze, stench, glitter, pit, wumpusThere };
}
