import { useState } from 'react';
import { motion } from 'framer-motion';

export default function KBViewer({ kb }) {
  const [filter, setFilter] = useState('');
  const clauses = kb ? kb.snapshot() : [];
  const filtered = filter
    ? clauses.filter(
        (c) =>
          c.display.toLowerCase().includes(filter.toLowerCase()) ||
          c.source.toLowerCase().includes(filter.toLowerCase())
      )
    : clauses;

  return (
    <div className="kb-viewer">
      <h3 className="kb-title">Propositional Logic KB</h3>
      <p className="kb-subtitle">{clauses.length} clauses in CNF</p>
      <input
        className="kb-search"
        placeholder="Filter clauses..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="kb-list">
        {filtered.map((c, i) => (
          <motion.div
            key={c.id}
            className="kb-clause"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
          >
            <span className="kb-id">#{c.id}</span>
            <span className="kb-formula">{c.display}</span>
            <span className="kb-source">{c.source}</span>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="kb-empty">No clauses match filter.</p>
        )}
      </div>
    </div>
  );
}
