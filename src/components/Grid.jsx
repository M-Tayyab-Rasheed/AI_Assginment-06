import { motion } from 'framer-motion';
import { CELL_VISITED, CELL_SAFE, CELL_PIT, CELL_WUMPUS, CELL_GOLD } from '../engine/agent';

const CELL_ICONS = {
  [CELL_PIT]: '🕳️',
  [CELL_WUMPUS]: '👾',
  [CELL_GOLD]: '💰',
};

export default function Grid({ state }) {
  const { grid, agentPos, rows, cols, world, gameOver } = state;
  const [ar, ac] = agentPos;

  return (
    <div className="grid-wrapper">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isAgent = ar === r && ac === c && !gameOver;
            const statusClass = getCellClass(cell.status, gameOver && ar === r && ac === c ? state.won : null);

            // If game over, reveal world
            const showPit = gameOver && world.pits.has(`${r},${c}`) && cell.status !== CELL_PIT;
            const showWumpus = gameOver && world.wumpus[0] === r && world.wumpus[1] === c && cell.status !== CELL_WUMPUS;
            const showGold = gameOver && world.gold[0] === r && world.gold[1] === c && cell.status !== CELL_GOLD;

            return (
              <motion.div
                key={`${r}-${c}`}
                className={`cell ${statusClass} ${isAgent ? 'cell-agent' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (r * cols + c) * 0.02 }}
              >
                <span className="cell-coord">{r},{c}</span>
                <div className="cell-content">
                  {isAgent && <span className="agent-icon">◈</span>}
                  {CELL_ICONS[cell.status] && <span>{CELL_ICONS[cell.status]}</span>}
                  {showPit && <span className="reveal">🕳️</span>}
                  {showWumpus && <span className="reveal">👾</span>}
                  {showGold && <span className="reveal">💰</span>}
                </div>
                {cell.status === CELL_VISITED && (
                  <div className="cell-percepts">
                    {cell.breeze && <span className="p-breeze" title="Breeze">〜</span>}
                    {cell.stench && <span className="p-stench" title="Stench">✦</span>}
                    {cell.glitter && <span className="p-glitter" title="Glitter">★</span>}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
      <p className="grid-label">Grid: {rows} × {cols} &nbsp;|&nbsp; Start: (0,0)</p>
    </div>
  );
}

function getCellClass(status, wonAtThis) {
  if (wonAtThis === true) return 'cell-won';
  if (wonAtThis === false) return 'cell-dead';
  switch (status) {
    case CELL_VISITED: return 'cell-visited';
    case CELL_SAFE: return 'cell-safe';
    case CELL_PIT: return 'cell-pit';
    case CELL_WUMPUS: return 'cell-wumpus';
    case CELL_GOLD: return 'cell-gold';
    default: return 'cell-unknown';
  }
}
