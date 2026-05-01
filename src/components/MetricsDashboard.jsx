import { motion } from 'framer-motion';

export default function MetricsDashboard({ state }) {
  const { totalInferenceSteps, moveCount, kb, percepts, rows, cols } = state;
  const kbSize = kb ? kb.clauseCount : 0;
  const visited = state.grid.flat().filter(c => c.status === 'visited').length;
  const safe = state.grid.flat().filter(c => c.status === 'safe').length;

  const metrics = [
    { label: 'Inference Steps', value: totalInferenceSteps, icon: '⚙' },
    { label: 'Moves Taken', value: moveCount, icon: '↗' },
    { label: 'KB Clauses', value: kbSize, icon: '∑' },
    { label: 'Cells Visited', value: `${visited}/${rows * cols}`, icon: '◉' },
    { label: 'Proven Safe', value: safe, icon: '✓' },
  ];

  return (
    <div className="metrics">
      <h3 className="metrics-title">Real-Time Metrics</h3>
      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="metric-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="metric-icon">{m.icon}</span>
            <span className="metric-value">{m.value}</span>
            <span className="metric-label">{m.label}</span>
          </motion.div>
        ))}
      </div>
      {percepts && percepts.length > 0 && (
        <div className="percept-bar">
          <span className="percept-label">Current Percepts:</span>
          {percepts.map((p) => (
            <span key={p} className="percept-tag">{p}</span>
          ))}
        </div>
      )}
    </div>
  );
}
