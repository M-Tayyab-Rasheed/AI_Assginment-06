import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_COLORS = {
  move: '#4ade80',
  inference: '#60a5fa',
  death: '#f87171',
  win: '#fbbf24',
  info: '#94a3b8',
};

export default function LogPanel({ log }) {
  const endRef = useRef(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const toggle = (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="log-panel">
      <h3 className="log-title">Agent Log</h3>
      <div className="log-list">
        <AnimatePresence initial={false}>
          {log.map((entry, i) => (
            <motion.div
              key={i}
              className="log-entry"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ borderLeftColor: TYPE_COLORS[entry.type] || '#94a3b8' }}
            >
              <div
                className={`log-text ${entry.steps?.length ? 'clickable' : ''}`}
                onClick={() => entry.steps?.length && toggle(i)}
              >
                <span className="log-type" style={{ color: TYPE_COLORS[entry.type] }}>
                  [{entry.type?.toUpperCase()}]
                </span>{' '}
                {entry.text}
                {entry.steps?.length > 0 && (
                  <span className="log-expand">{expanded[i] ? ' ▲' : ' ▼ resolution steps'}</span>
                )}
              </div>
              {expanded[i] && entry.steps && (
                <div className="log-steps">
                  {entry.steps.map((s, j) => (
                    <div key={j} className="log-step">
                      <span className="step-num">{j + 1}.</span> {s}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}
