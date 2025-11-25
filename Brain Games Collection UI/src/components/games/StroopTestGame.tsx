import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Timer, Palette, RotateCcw, Play } from 'lucide-react';

interface StroopTestGameProps {
  onBack: () => void;
}

const COLORS = [
  { name: 'Red', value: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500' },
  { name: 'Blue', value: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500' },
  { name: 'Green', value: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { name: 'Yellow', value: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400' },
  { name: 'Purple', value: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500' },
  { name: 'Orange', value: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500' },
];

export function StroopTestGame({ onBack }: StroopTestGameProps) {
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  const [wordText, setWordText] = useState('');
  const [wordColorIndex, setWordColorIndex] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft <= 0) {
      endGame();
    }
  }, [timeLeft, gameStatus]);

  const generateRound = () => {
    const textIndex = Math.floor(Math.random() * COLORS.length);
    let colorIndex = Math.floor(Math.random() * COLORS.length);
    
    if (Math.random() > 0.3 && colorIndex === textIndex) {
      colorIndex = (colorIndex + 1) % COLORS.length;
    }

    setWordText(COLORS[textIndex].name);
    setWordColorIndex(colorIndex);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameStatus('playing');
    generateRound();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameStatus('gameover');
  };

  const handleAnswer = (selectedIndex: number) => {
    if (selectedIndex === wordColorIndex) {
      setScore(s => s + 100);
    } else {
      setTimeLeft(t => Math.max(t - 2, 0));
    }
    generateRound();
  };

  if (gameStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8">
         <div className="text-center space-y-4">
          <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] mb-4">
            <Palette className="h-20 w-20 text-white" />
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight">Stroop Test</h2>
          <p className="text-indigo-200 text-xl max-w-md mx-auto">Select the color of the text, not the word itself!</p>
        </div>
        <Button 
           size="lg" 
           className="w-64 h-16 text-xl font-bold rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 hover:scale-105 transition-all shadow-xl" 
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
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent" />
          <div className="relative w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
            <Timer className="h-12 w-12 text-slate-400" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-white mb-2">Time's Up!</h3>
            <div className="space-y-1">
              <p className="text-slate-400">Final Score</p>
              <p className="text-6xl font-black text-emerald-400 drop-shadow-lg">{score}</p>
            </div>
          </div>
          <div className="flex gap-4 w-full relative z-10">
             <Button variant="secondary" className="flex-1 h-12 bg-slate-800 text-white hover:bg-slate-700 rounded-xl" onClick={onBack}>Menu</Button>
             <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25" onClick={startGame}>
               <RotateCcw className="mr-2 h-4 w-4" /> Retry
             </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 pb-24 items-center justify-center">
      {/* Header Stats */}
      <div className="w-full flex items-center justify-between mb-12 bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/10">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</span>
          <span className="text-4xl font-black text-white">{score}</span>
        </div>
        <div className="flex flex-col items-end w-1/2">
          <span className="text-xs text-slate-400 uppercase font-bold mb-2">Time Remaining</span>
          <div className="w-full flex items-center gap-4">
            <Progress value={(timeLeft / 30) * 100} className="h-3 bg-slate-700" />
            <span className={`text-2xl font-mono font-bold ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Challenge Card */}
      <div className="w-full bg-white/5 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/10 p-12 mb-12 flex items-center justify-center min-h-[240px]">
        <h2 className={`text-7xl md:text-8xl font-black tracking-widest uppercase drop-shadow-2xl ${COLORS[wordColorIndex].value}`}>
          {wordText}
        </h2>
      </div>

      {/* Color Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
        {COLORS.map((color, index) => (
          <button
             key={color.name}
             className={`
               h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 
               hover:bg-slate-700 hover:border-slate-500 hover:scale-105 
               active:scale-95 transition-all 
               flex items-center justify-center 
               font-bold text-lg text-white shadow-lg
             `}
             onClick={() => handleAnswer(index)}
          >
            <span className={`w-3 h-3 rounded-full ${color.bg} mr-2`} />
            {color.name}
          </button>
        ))}
      </div>
      
      <p className="mt-8 text-slate-500 text-sm font-bold uppercase tracking-widest">Tap the color of the text above</p>
    </div>
  );
}
