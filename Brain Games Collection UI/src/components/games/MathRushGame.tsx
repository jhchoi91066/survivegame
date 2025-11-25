import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Timer, Zap, Check, X, RotateCcw, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MathRushGameProps {
  onBack: () => void;
}

interface Problem {
  text: string;
  isCorrect: boolean;
}

export function MathRushGame({ onBack }: MathRushGameProps) {
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
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

  const generateProblem = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    let result = 0;

    if (op === '+') result = a + b;
    else if (op === '-') {
      if (a < b) [a, b] = [b, a];
      result = a - b;
    } else if (op === '*') {
      a = Math.floor(Math.random() * 5) + 2;
      b = Math.floor(Math.random() * 5) + 2;
      result = a * b;
    }

    const isCorrect = Math.random() > 0.5;
    const displayResult = isCorrect 
      ? result 
      : result + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);

    const finalDisplayResult = displayResult < 0 ? Math.abs(displayResult) : displayResult;

    setCurrentProblem({
      text: `${a} ${op} ${b} = ${finalDisplayResult}`,
      isCorrect: isCorrect && displayResult === finalDisplayResult
    });
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameStatus('playing');
    generateProblem();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameStatus('gameover');
  };

  const handleAnswer = (answer: boolean) => {
    if (!currentProblem) return;

    if (answer === currentProblem.isCorrect) {
      setScore((s) => s + 10);
      setTimeLeft((t) => Math.min(t + 2, 60));
    } else {
      setTimeLeft((t) => Math.max(t - 5, 0));
    }
    generateProblem();
  };

  if (gameStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8">
         <div className="text-center space-y-4">
          <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.4)] mb-4">
            <Zap className="h-20 w-20 text-white" />
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight">Math Rush</h2>
          <p className="text-indigo-200 text-xl max-w-md mx-auto">Quick calculations against the clock.</p>
        </div>
        <Button 
           size="lg" 
           className="w-64 h-16 text-xl font-bold rounded-2xl bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all shadow-xl" 
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
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
          <div className="relative w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
            <Timer className="h-12 w-12 text-slate-400" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-white mb-2">Time's Up!</h3>
            <div className="space-y-1">
              <p className="text-slate-400">Final Score</p>
              <p className="text-6xl font-black text-blue-400 drop-shadow-lg">{score}</p>
            </div>
          </div>
          <div className="flex gap-4 w-full relative z-10">
             <Button variant="secondary" className="flex-1 h-12 bg-slate-800 text-white hover:bg-slate-700 rounded-xl" onClick={onBack}>Menu</Button>
             <Button className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25" onClick={startGame}>
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

      {/* Problem Card */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentProblem?.text}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.1, opacity: 0 }}
          className="w-full bg-white/5 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/10 p-12 mb-12 flex items-center justify-center min-h-[240px]"
        >
          <h2 className="text-6xl md:text-7xl font-black text-white tracking-widest drop-shadow-2xl">
            {currentProblem?.text}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-6 w-full">
        <Button 
          className="h-32 text-2xl font-black bg-red-500 hover:bg-red-400 border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all rounded-3xl shadow-lg shadow-red-900/50"
          onClick={() => handleAnswer(false)}
        >
          <div className="flex flex-col items-center gap-2">
            <X className="h-10 w-10" />
            FALSE
          </div>
        </Button>
        <Button 
          className="h-32 text-2xl font-black bg-emerald-500 hover:bg-emerald-400 border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2 transition-all rounded-3xl shadow-lg shadow-emerald-900/50"
          onClick={() => handleAnswer(true)}
        >
          <div className="flex flex-col items-center gap-2">
            <Check className="h-10 w-10" />
            TRUE
          </div>
        </Button>
      </div>
    </div>
  );
}
