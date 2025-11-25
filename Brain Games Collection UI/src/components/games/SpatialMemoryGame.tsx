import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Brain, Play, RotateCcw, Layers } from 'lucide-react';

interface SpatialMemoryGameProps {
  onBack: () => void;
}

export function SpatialMemoryGame({ onBack }: SpatialMemoryGameProps) {
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'showing_sequence' | 'user_turn' | 'gameover'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  
  const tiles = Array.from({ length: 9 }, (_, i) => i);

  useEffect(() => {
    if (gameStatus === 'playing') {
      startRound();
    }
  }, [gameStatus]);

  const startGame = () => {
    setSequence([]);
    setScore(0);
    setGameStatus('playing');
  };

  const startRound = () => {
    const nextTile = Math.floor(Math.random() * 9);
    const newSequence = [...sequence, nextTile];
    setSequence(newSequence);
    setUserSequence([]);
    setGameStatus('showing_sequence');
    playSequence(newSequence);
  };

  const playSequence = async (seq: number[]) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    for (let i = 0; i < seq.length; i++) {
      setActiveTile(seq[i]);
      await new Promise(resolve => setTimeout(resolve, 600));
      setActiveTile(null);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setGameStatus('user_turn');
  };

  const handleTileClick = (tileIndex: number) => {
    if (gameStatus !== 'user_turn') return;

    setActiveTile(tileIndex);
    setTimeout(() => setActiveTile(null), 200);

    const expectedTile = sequence[userSequence.length];
    
    if (tileIndex === expectedTile) {
      const newUserSequence = [...userSequence, tileIndex];
      setUserSequence(newUserSequence);

      if (newUserSequence.length === sequence.length) {
        setScore(s => s + 1);
        setTimeout(() => {
          startRound();
        }, 500);
      }
    } else {
      setGameStatus('gameover');
    }
  };

  if (gameStatus === 'idle') {
     return (
      <div className="flex flex-col items-center justify-center h-full space-y-8">
         <div className="text-center space-y-4">
          <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_50px_rgba(168,85,247,0.4)] mb-4">
            <Layers className="h-20 w-20 text-white" />
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight">Spatial Grid</h2>
          <p className="text-indigo-200 text-xl max-w-md mx-auto">Memorize the sequence of glowing lights.</p>
        </div>
        <Button 
           size="lg" 
           className="w-64 h-16 text-xl font-bold rounded-2xl bg-white text-purple-600 hover:bg-purple-50 hover:scale-105 transition-all shadow-xl" 
           onClick={startGame}
        >
          <Play className="mr-2 h-5 w-5" /> Start Game
        </Button>
      </div>
    );
  }

  if (gameStatus === 'gameover') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8">
        <div className="p-8 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center gap-8 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent" />
          <div className="relative w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
            <Brain className="h-12 w-12 text-slate-400" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-white mb-2">Game Over</h3>
            <p className="text-slate-400">You missed the pattern!</p>
            <div className="mt-4 space-y-1">
              <p className="text-slate-500 uppercase text-xs font-bold tracking-widest">Sequence Level</p>
              <p className="text-6xl font-black text-purple-400 drop-shadow-lg">{score}</p>
            </div>
          </div>
          <div className="flex gap-4 w-full relative z-10">
             <Button variant="secondary" className="flex-1 h-12 bg-slate-800 text-white hover:bg-slate-700 rounded-xl" onClick={onBack}>Menu</Button>
             <Button className="flex-1 h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25" onClick={startGame}>
               <RotateCcw className="mr-2 h-4 w-4" /> Retry
             </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-xl mx-auto p-4 pb-24 items-center justify-center">
       <div className="mb-12 text-center space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tight">Level <span className="text-purple-400">{score + 1}</span></h2>
          <div className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-bold transition-colors duration-300 ${gameStatus === 'showing_sequence' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {gameStatus === 'showing_sequence' ? 'WATCH THE PATTERN' : 'YOUR TURN'}
          </div>
       </div>

       <div className="grid grid-cols-3 gap-4 md:gap-6 w-full aspect-square max-w-[400px] p-6 rounded-[40px] bg-slate-900/50 border border-white/5 shadow-2xl backdrop-blur-sm">
         {tiles.map((tile) => (
           <button
             key={tile}
             disabled={gameStatus !== 'user_turn'}
             onClick={() => handleTileClick(tile)}
             className={`
               relative rounded-2xl transition-all duration-200 shadow-lg
               ${activeTile === tile 
                 ? 'bg-purple-400 border-purple-200 shadow-[0_0_40px_rgba(192,132,252,0.8)] scale-95 z-10 ring-4 ring-purple-500/30' 
                 : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}
               ${gameStatus === 'user_turn' ? 'cursor-pointer active:scale-90' : 'cursor-default'}
               border-t border-l border-white/10
             `}
           >
             {activeTile === tile && (
               <div className="absolute inset-0 bg-white opacity-50 rounded-2xl animate-ping" />
             )}
           </button>
         ))}
       </div>
    </div>
  );
}
