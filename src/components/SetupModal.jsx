import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SetupModal({ onStart }) {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);

  const presets = [
    { label: '4×4 Classic', r: 4, c: 4 },
    { label: '6×6 Medium', r: 6, c: 6 },
    { label: '8×8 Large', r: 8, c: 8 },
  ];

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 40 }}
      >
        <div className="modal-header">
          <span className="modal-icon">◈</span>
          <h2>WUMPUS<span className="accent">.</span>AI</h2>
          <p>Knowledge-Based Dynamic Pathfinding Agent</p>
        </div>

        <div className="modal-section">
          <p className="modal-label">Quick Presets</p>
          <div className="preset-row">
            {presets.map((p) => (
              <button
                key={p.label}
                className="preset-btn"
                onClick={() => { setRows(p.r); setCols(p.c); }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <p className="modal-label">Custom Grid Size</p>
          <div className="dim-row">
            <label>
              Rows
              <input
                type="number"
                min={3}
                max={12}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
              />
            </label>
            <span className="dim-x">×</span>
            <label>
              Cols
              <input
                type="number"
                min={3}
                max={12}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="modal-info">
          <div className="info-item">🟢 Safe cells proven by Resolution Refutation</div>
          <div className="info-item">🟡 Unknown cells — not yet inferred</div>
          <div className="info-item">🔴 Confirmed pits / Wumpus</div>
          <div className="info-item">◈ Agent starts at (0,0)</div>
        </div>

        <button
          className="start-btn"
          onClick={() => onStart(Math.max(3, Math.min(12, rows)), Math.max(3, Math.min(12, cols)))}
        >
          Launch Agent
        </button>
      </motion.div>
    </motion.div>
  );
}
