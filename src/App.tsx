import { useState, useEffect, useRef } from 'react';

const PANELS = [
  { id: 0, name: '赤', color: '#ef4444', activeColor: '#fca5a5', freq: 329.63 },
  { id: 1, name: '青', color: '#3b82f6', activeColor: '#93c5fd', freq: 261.63 },
  { id: 2, name: '黄', color: '#eab308', activeColor: '#fef08a', freq: 392.00 },
  { id: 3, name: '緑', color: '#22c55e', activeColor: '#86efac', freq: 523.25 },
];

export default function App() {
  const [gameState, setGameState] = useState<'START' | 'SHOWING' | 'INPUT' | 'RESULT'>('START');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState<number>(0);
  const [activePanel, setActivePanel] = useState<number | null>(null);
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const flash = (id: number, ms = 350) => {
    setActivePanel(id);
    const t = window.setTimeout(() => setActivePanel((prev) => (prev === id ? null : prev)), ms);
    timersRef.current.push(t);
  };

  const playSequence = (seq: number[], lv: number) => {
    clearTimers();
    setGameState('SHOWING');
    setMessage('よく見て覚えてね！');
    const interval = Math.max(400, 700 - lv * 25);

    seq.forEach((id, i) => {
      const t = window.setTimeout(() => flash(id, 300), 500 + i * interval);
      timersRef.current.push(t);
    });

    const end = window.setTimeout(() => {
      setGameState('INPUT');
      setUserStep(0);
      setMessage('同じ順番にタップ！');
    }, 500 + seq.length * interval + 100);
    timersRef.current.push(end);
  };

  const startGame = () => {
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    setLevel(1);
    setScore(0);
    setUserStep(0);
    playSequence(first, 1);
  };

  const handleTap = (id: number) => {
    if (gameState !== 'INPUT') return;
    flash(id, 220);

    if (id !== sequence[userStep]) {
      clearTimers();
      setGameState('RESULT');
      return;
    }

    const next = userStep + 1;
    setScore((s) => s + 10);

    if (next === sequence.length) {
      const nextLv = level + 1;
      setScore((s) => s + level * 20);
      setLevel(nextLv);
      setGameState('SHOWING');
      setMessage('クリア！次のレベルへ');
      const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSeq);
      const t = window.setTimeout(() => playSequence(nextSeq, nextLv), 900);
      timersRef.current.push(t);
    } else {
      setUserStep(next);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      zIndex: 9999
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        textAlign: 'center',
        color: '#1e293b'
      }}>
        <h1 style={{ fontSize: '24px', color: '#0284c7', marginBottom: '16px' }}>🎨 カラーメモリー</h1>

        {gameState === 'START' && (
          <div>
            <p style={{ marginBottom: '20px', lineHeight: 1.6 }}>光ったパネルの順番を覚えて<br />同じ順番にタップしよう！</p>
            <button
              onClick={startGame}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#0284c7',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer'
              }}
            >
              ゲームスタート！
            </button>
          </div>
        )}

        {(gameState === 'SHOWING' || gameState === 'INPUT') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '12px', fontWeight: 'bold' }}>
              <span>Lv.{level}</span>
              <span>スコア: {score}点</span>
            </div>
            <div style={{
              padding: '10px',
              marginBottom: '16px',
              borderRadius: '10px',
              fontWeight: 'bold',
              backgroundColor: gameState === 'INPUT' ? '#dcfce7' : '#fef3c7',
              color: gameState === 'INPUT' ? '#15803d' : '#b45309'
            }}>
              {message}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              width: '260px',
              height: '260px',
              margin: '0 auto',
              padding: '12px',
              backgroundColor: '#1e293b',
              borderRadius: '20px'
            }}>
              {PANELS.map((p) => (
                <button
                  key={p.id}
                  onPointerDown={() => handleTap(p.id)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    backgroundColor: activePanel === p.id ? p.activeColor : p.color,
                    transform: activePanel === p.id ? 'scale(0.95)' : 'scale(1)',
                    boxShadow: activePanel === p.id ? '0 0 20px #fff' : 'none',
                    transition: 'all 0.1s'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {gameState === 'RESULT' && (
          <div>
            <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>ゲームオーバー！</h2>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0284c7', marginBottom: '20px' }}>{score}点</p>
            <button
              onClick={startGame}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#0284c7',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer'
              }}
            >
              もう一度あそぶ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}