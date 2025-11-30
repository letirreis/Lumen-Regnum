import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, History, Trash2, Dices } from 'lucide-react';
import { Button } from './ui';

interface RollResult {
  id: string;
  timestamp: Date;
  diceType: number;
  count: number;
  modifier: number;
  rolls: number[];
  total: number;
}

interface DiceRollerProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ isOpen, onToggle }) => {
  const [history, setHistory] = useState<RollResult[]>([]);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of history when new roll is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  const rollDice = (sides: number) => {
    const newRolls: number[] = [];
    let sum = 0;
    
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      newRolls.push(roll);
      sum += roll;
    }

    const result: RollResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      diceType: sides,
      count,
      modifier,
      rolls: newRolls,
      total: sum + modifier
    };

    setHistory(prev => [...prev, result]);
  };

  const clearHistory = () => setHistory([]);

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  // Minimized State (Floating Action Button)
  if (!isOpen) {
    return (
        <button 
            onClick={onToggle}
            className="fixed bottom-6 right-6 z-[100] h-14 w-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border border-indigo-400 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="Open Dice Roller"
        >
            <Dices className="w-8 h-8" />
        </button>
    );
  }

  // Expanded State (Panel)
  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl flex flex-col max-h-[600px] animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-zinc-800 bg-zinc-800/50 rounded-t-lg">
        <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Dices className="w-5 h-5" />
            <span>Dice Roller</span>
        </div>
        <button onClick={onToggle} className="text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* History / Results Display */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] bg-zinc-950/50">
        {history.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8 flex flex-col items-center gap-2">
            <History className="w-8 h-8 opacity-20" />
            <p>Roll log is empty.</p>
          </div>
        ) : (
          history.map((res) => (
            <div key={res.id} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-sm animate-in fade-in slide-in-from-left-2">
               <div className="flex justify-between text-xs text-zinc-500 mb-1">
                   <span>{res.timestamp.toLocaleTimeString()}</span>
                   <span className="font-mono">
                       {res.count}d{res.diceType} {res.modifier !== 0 && (res.modifier > 0 ? `+${res.modifier}` : res.modifier)}
                   </span>
               </div>
               <div className="flex justify-between items-center">
                   <div className="text-zinc-400 text-xs">
                       [{res.rolls.join(', ')}]
                   </div>
                   <div className="text-xl font-bold text-indigo-400">
                       {res.total}
                   </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900 rounded-b-lg space-y-3">
        {/* Settings */}
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500">Count</label>
                <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={count}
                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-indigo-500"
                />
            </div>
            <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500">Modifier</label>
                <input 
                    type="number" 
                    value={modifier}
                    onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-indigo-500"
                />
            </div>
        </div>

        {/* Dice Grid */}
        <div className="grid grid-cols-4 gap-2">
            {diceTypes.map(d => (
                <button
                    key={d}
                    onClick={() => rollDice(d)}
                    className="flex flex-col items-center justify-center bg-zinc-800 hover:bg-indigo-700 hover:text-white border border-zinc-700 rounded p-2 transition-colors group"
                >
                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white">d{d}</span>
                </button>
            ))}
             <button
                onClick={clearHistory}
                className="flex flex-col items-center justify-center bg-zinc-900 hover:bg-red-900/50 border border-zinc-800 hover:border-red-800 rounded p-2 transition-colors group"
                title="Clear Log"
            >
                <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-400" />
            </button>
        </div>
      </div>
    </div>
  );
};