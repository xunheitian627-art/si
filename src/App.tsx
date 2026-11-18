import { useState, useEffect, useRef } from 'react';
import './index.css';

type GameState = 'START' | 'SHOWING' | 'INPUT' | 'RESULT';

interface PanelConfig {
  id: number;
  name: string;
  color: string;
  activeColor: string;
  freq: number;
}

const PANELS: PanelConfig[] = [
  { id: 0, name: 'red', color: '#ef4444', activeColor: '#fca5a5', freq: 329.63 },
  { id: 1, name: 'blue', color: '#3b82f6', activeColor: '#93c5fd', freq: 261.63 },
  { id: 2, name: 'yellow', color: '#eab308', activeColor: '#fef08a', freq: 392.00 },
  { id: 3, name: 'green', color: '#22c55e', activeColor: '#86efac', freq: 523.25 },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState<number>(0);
  const [activePanel, setActivePanel] = useState<number | null>(null);
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const playTone = (freq: number) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // 音声非対応環境では無視
    }
  };

  const flashPanel = (panelId: number, durationMs = 350) => {
    setActivePanel(panelId);
    playTone(PANELS[panelId].freq);
    const timer = window.setTimeout(() => {
      setActivePanel((prev) => (prev === panelId ? null : prev));
    }, durationMs);
    timersRef.current.push(timer);
  };

  const playSequence = (seq: number[], currentLevel: number) => {
    clearAllTimers();
    setGameState('SHOWING');
    setActivePanel(null);
    setStatusMessage('よく見て覚えてね！');

    const stepInterval = Math.max(380, 680 - currentLevel * 25);
    const flashDuration = Math.max(220, 420 - currentLevel * 15);

    seq.forEach((panelId, idx) => {
      const t = window.setTimeout(() => {
        flashPanel(panelId, flashDuration);
      }, 500 + idx * stepInterval);
      timersRef.current.push(t);
    });

    const endTimer = window.setTimeout(() => {
      setGameState('INPUT');
      setUserStep(0);
      setStatusMessage('同じ順番にタップ！');
    }, 500 + seq.length * stepInterval + 100);
    timersRef.current.push(endTimer);
  };

  const startGame = () => {
    clearAllTimers();
    const firstPanel = Math.floor(Math.random() * 4);
    const initialSeq = [firstPanel];
    setSequence(initialSeq);
    setLevel(1);
    setScore(0);
    setUserStep(0);
    playSequence(initialSeq, 1);
  };

  const handlePanelClick = (panelId: number) => {
    if (gameState !== 'INPUT') return;

    flashPanel(panelId, 240);

    if (panelId !== sequence[userStep]) {
      clearAllTimers();
      setStatusMessage('ちがうよ！ゲームオーバー');
      setHighScore((prev) => Math.max(prev, score));
      const overTimer = window.setTimeout(() => {
        setGameState('RESULT');
      }, 650);
      timersRef.current.push(overTimer);
      return;
    }

    const nextStep = userStep + 1;
    setScore((prev) => prev + 10);

    if (nextStep === sequence.length) {
      const nextLevel = level + 1;
      const bonus = level * 20;
      setScore((prev) => prev + bonus);
      setLevel(nextLevel);
      setGameState('SHOWING');
      setStatusMessage(`クリア！ +${bonus}点ボーナス`);

      const nextPanel = Math.floor(Math.random() * 4);
      const nextSeq = [...sequence, nextPanel];
      setSequence(nextSeq);

      const nextRoundTimer = window.setTimeout(() => {
        playSequence(nextSeq, nextLevel);
      }, 900);
      timersRef.current.push(nextRoundTimer);
    } else {
      setUserStep(nextStep);
    }
  };

  return (
    <div className="app-container">
      <div className="game-card">
        <header className="game-header">
          <h1>🎨 カラーメモリー</h1>
          <button
            type="button"
            className="sound-toggle"
            onClick={() => setSoundEnabled((prev) => !prev)}
          >
            {soundEnabled ? '🔊 音あり' : '🔇 消音'}
          </button>
        </header>

        {gameState === 'START' && (
          <div>
            <p className="description">
              光ったパネルの<strong>順番を記憶</strong>して<br />
              同じ順番にタップしよう！
            </p>
            <div className="rules-box">
              <p>✨ レベルごとに光る数が <strong>1つずつ増加</strong></p>
              <p>⭐ 1タップ正解：<strong>+10点</strong> ＋ クリアボーナス</p>
              <p>🎵 パネルごとに異なる音階が鳴ります</p>
            </div>
            <button className="primary-btn" onClick={startGame}>
              ゲームスタート！
            </button>
          </div>
        )}

        {(gameState === 'SHOWING' || gameState === 'INPUT') && (
          <div>
            <div className="status-bar">
              <div className="status-item">
                <span className="label">レベル</span>
                <span className="value">Lv.{level}</span>
              </div>
              <div className="status-item">
                <span className="label">進行度</span>
                <span className="value">
                  {gameState === 'INPUT' ? `${userStep} / ${sequence.length}` : `全 ${sequence.length} 個`}
                </span>
              </div>
              <div className="status-item">
                <span className="label">スコア</span>
                <span className="value">{score}<small>点</small></span>
              </div>
            </div>

            <div className={`guide-banner ${gameState === 'INPUT' ? 'your-turn' : 'watch-turn'}`}>
              {statusMessage}
            </div>

            <div className="panel-grid">
              {PANELS.map((p) => {
                const isActive = activePanel === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={gameState !== 'INPUT'}
                    onPointerDown={() => handlePanelClick(p.id)}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '16px',
                      cursor: gameState === 'INPUT' ? 'pointer' : 'default',
                      backgroundColor: isActive ? p.activeColor : p.color,
                      transform: isActive ? 'scale(0.95)' : 'scale(1)',
                      boxShadow: isActive ? `0 0 24px ${p.activeColor}` : '0 4px 0 rgba(0,0,0,0.2)',
                      transition: 'transform 0.08s ease, background-color 0.08s ease'
                    }}
                    aria-label={p.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {gameState === 'RESULT' && (
          <div>
            <h2 style={{ color: '#ef4444', fontSize: '1.4rem', marginBottom: '14px' }}>ゲームオーバー！</h2>
            <div className="result-box">
              <p className="result-label">最終スコア</p>
              <p className="result-score">{score}<span>点</span></p>
              <div className="result-stats">
                <span>到達レベル：<strong>Lv.{level}</strong></span>
                <span>ハイスコア：<strong>{highScore}点</strong></span>
              </div>
            </div>
            <button className="primary-btn" onClick={startGame}>
              もう一度あそぶ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}