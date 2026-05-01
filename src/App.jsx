import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Grid from './components/Grid';
import MetricsDashboard from './components/MetricsDashboard';
import KBViewer from './components/KBViewer';
import LogPanel from './components/LogPanel';
import SetupModal from './components/SetupModal';
import { createAgentState, agentVisit, pickNextMove } from './engine/agent';
import './App.css';

export default function App() {
  const [state, setState] = useState(null);
  const [showSetup, setShowSetup] = useState(true);
  const [showKB, setShowKB] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const autoRef = useRef(null);

  const startGame = useCallback((rows, cols) => {
    const initial = createAgentState(rows, cols);
    const afterStart = agentVisit(initial, 0, 0);
    setState(afterStart);
    setShowSetup(false);
    setIsAutoRunning(false);
  }, []);

  const stepAgent = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.gameOver) return prev;
      const next = pickNextMove(prev);
      if (!next) return { ...prev, log: [...prev.log, { type: 'info', text: 'Agent is stuck — no safe moves available.' }] };
      return agentVisit(prev, next[0], next[1]);
    });
  }, []);

  const startAuto = useCallback(() => {
    setIsAutoRunning(true);
    autoRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev || prev.gameOver) {
          clearInterval(autoRef.current);
          setIsAutoRunning(false);
          return prev;
        }
        const next = pickNextMove(prev);
        if (!next) {
          clearInterval(autoRef.current);
          setIsAutoRunning(false);
          return { ...prev, log: [...prev.log, { type: 'info', text: 'Agent is stuck.' }] };
        }
        return agentVisit(prev, next[0], next[1]);
      });
    }, 800);
  }, []);

  const stopAuto = useCallback(() => {
    clearInterval(autoRef.current);
    setIsAutoRunning(false);
  }, []);

  const reset = useCallback(() => {
    clearInterval(autoRef.current);
    setIsAutoRunning(false);
    setShowSetup(true);
    setState(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="header-icon">◈</span>
          <div>
            <h1>WUMPUS<span className="accent">.</span>AI</h1>
            <p className="subtitle">Knowledge-Based Pathfinding Agent</p>
          </div>
        </div>
        <nav className="header-nav">
          {state && (
            <>
              <button className="nav-btn" onClick={() => setShowKB(!showKB)}>
                {showKB ? 'Hide KB' : 'View KB'}
              </button>
              <button className="nav-btn danger" onClick={reset}>Reset</button>
            </>
          )}
        </nav>
      </header>

      <AnimatePresence>
        {showSetup && (
          <SetupModal onStart={startGame} />
        )}
      </AnimatePresence>

      {state && (
        <main className="app-main">
          <div className="left-panel">
            <MetricsDashboard state={state} />
            <div className="controls">
              <button
                className="ctrl-btn primary"
                onClick={stepAgent}
                disabled={state.gameOver || isAutoRunning}
              >
                ▶ Step
              </button>
              <button
                className="ctrl-btn"
                onClick={isAutoRunning ? stopAuto : startAuto}
                disabled={state.gameOver}
              >
                {isAutoRunning ? '⏸ Pause' : '⚡ Auto'}
              </button>
              <button className="ctrl-btn secondary" onClick={reset}>
                ↺ New Game
              </button>
            </div>

            {state.gameOver && (
              <motion.div
                className={`result-banner ${state.won ? 'won' : 'lost'}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {state.won ? '🏆 GOLD FOUND!' : '☠️ AGENT DIED'}
                <button onClick={reset}>Play Again</button>
              </motion.div>
            )}

            <LogPanel log={state.log} />
          </div>

          <div className="center-panel">
            <Grid state={state} />
            <div className="legend">
              <span className="legend-item visited">▪ Visited</span>
              <span className="legend-item safe">▪ Safe</span>
              <span className="legend-item unknown">▪ Unknown</span>
              <span className="legend-item danger">▪ Danger</span>
              <span className="legend-item agent">◈ Agent</span>
            </div>
          </div>

          {showKB && (
            <div className="right-panel">
              <KBViewer kb={state.kb} />
            </div>
          )}
        </main>
      )}
    </div>
  );
}
