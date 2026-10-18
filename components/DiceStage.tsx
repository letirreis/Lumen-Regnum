import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n';

// Full-screen dice animation. The result is already decided by the caller; this component only
// shows it: dice tumble in, numbers shuffle, then each die settles on its real value.

const SHAPES: Record<number, string> = {
  4: '50,6 95,88 5,88',
  6: '12,12 88,12 88,88 12,88',
  8: '50,4 93,50 50,96 7,50',
  10: '50,4 92,38 50,96 8,38',
  12: '50,5 96,38 79,93 21,93 4,38',
  20: '50,4 92,27 92,73 50,96 8,73 8,27',
  100: '50,4 92,38 50,96 8,38',
};

const MAX_VISIBLE = 12;
const ROLL_MS = 1000;
const STAGGER_MS = 70;
const HOLD_MS = 1700;

interface DiceStageProps {
  sides: number;
  rolls: number[];
  modifier: number;
  total: number;
  onLanded: () => void;
  onDone: () => void;
}

export const DiceStage: React.FC<DiceStageProps> = ({ sides, rolls, modifier, total, onLanded, onDone }) => {
  const { t } = useI18n();
  const visible = rolls.slice(0, MAX_VISIBLE);
  const hidden = rolls.length - visible.length;
  const [landed, setLanded] = useState(false);
  const [shown, setShown] = useState<number[]>(() => visible.map(() => Math.floor(Math.random() * sides) + 1));
  // Random flight paths, fixed for the lifetime of this roll.
  const [flights] = useState(() => visible.map(() => ({
    fx: (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 160),
    fy: -(120 + Math.random() * 160),
    rot: (Math.random() < 0.5 ? -1 : 1) * (720 + Math.floor(Math.random() * 3) * 360),
  })));

  useEffect(() => {
    const shuffle = window.setInterval(() => {
      setShown(visible.map(() => Math.floor(Math.random() * sides) + 1));
    }, 70);
    const land = window.setTimeout(() => {
      window.clearInterval(shuffle);
      setShown(visible);
      setLanded(true);
      onLanded();
    }, ROLL_MS + STAGGER_MS * visible.length);
    return () => { window.clearInterval(shuffle); window.clearTimeout(land); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!landed) return;
    const close = window.setTimeout(onDone, HOLD_MS);
    return () => window.clearTimeout(close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') onDone(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const size = visible.length <= 6 ? 88 : visible.length <= 10 ? 60 : 52;
  const shape = SHAPES[sides] ?? SHAPES[20];

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-8 bg-black/70 backdrop-blur-[2px] cursor-pointer"
      onClick={onDone}
      role="status"
      aria-live="polite"
      aria-label={landed ? `${rolls.length}d${sides}: ${total}` : t('dice.rolling', { count: rolls.length, sides })}
    >
      <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl px-4">
        {visible.map((value, i) => {
          const f = flights[i];
          const crit = landed && sides === 20 && (value === 20 || value === 1);
          const stroke = crit ? (value === 20 ? '#facc15' : '#f87171') : '#818cf8';
          return (
            <div
              key={i}
              className={landed ? 'lr-dice-landed' : 'lr-dice-tumble'}
              style={{
                width: size,
                height: size,
                animationDelay: landed ? '0ms' : `${i * STAGGER_MS}ms`,
                ['--fx' as string]: `${f.fx}px`,
                ['--fy' as string]: `${f.fy}px`,
                ['--rot' as string]: `${f.rot}deg`,
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
                {sides === 6 ? (
                  <rect x="12" y="12" width="76" height="76" rx="16" fill="#18181b" stroke={stroke} strokeWidth="3"
                    style={crit ? { filter: `drop-shadow(0 0 8px ${stroke})` } : undefined} />
                ) : (
                  <polygon points={shape} fill="#18181b" stroke={stroke} strokeWidth="3" strokeLinejoin="round"
                    style={crit ? { filter: `drop-shadow(0 0 8px ${stroke})` } : undefined} />
                )}
                {sides === 20 && <polygon points="50,22 74,64 26,64" fill="none" stroke={stroke} strokeOpacity="0.35" strokeWidth="2" />}
                <text x="50" y="58" textAnchor="middle" fontSize={sides === 100 ? 30 : 38} fontWeight="700"
                  fill={crit ? stroke : '#e4e4e7'} fontFamily="ui-monospace, monospace">{value}</text>
              </svg>
            </div>
          );
        })}
        {hidden > 0 && <span className="text-zinc-400 text-lg font-bold">+{hidden}</span>}
      </div>

      <div className={`text-center transition-opacity duration-300 ${landed ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-6xl font-bold text-indigo-300 drop-shadow-lg">{total}</div>
        <div className="mt-2 text-sm text-zinc-400 font-mono">
          {rolls.length}d{sides}{modifier !== 0 && (modifier > 0 ? ` +${modifier}` : ` ${modifier}`)}
        </div>
      </div>
    </div>,
    document.body,
  );
};
