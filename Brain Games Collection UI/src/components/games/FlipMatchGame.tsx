import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Brain, Ghost, Zap, Star, Heart, Music, Sun, Moon, Cloud, Umbrella, Flag, Anchor, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface FlipMatchGameProps {
  onBack: () => void;
}

const ICONS = [Brain, Ghost, Zap, Star, Heart, Music, Sun, Moon, Cloud, Umbrella, Flag, Anchor];

interface GameCard {
  id: number;
  iconId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export function FlipMatchGame({ onBack }: FlipMatchGameProps) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gridSize, setGridSize] = useState(4);

  useEffect(() => {
    if (gameStarted) {
      initializeGame();
    }
  }, [gameStarted]);

  const initializeGame = () => {
    const numPairs = (gridSize * gridSize) / 2;
    const selectedIcons = ICONS.slice(0, numPairs);
    const gameIcons = [...selectedIcons, ...selectedIcons];
    
    const shuffled = gameIcons
      .map((icon, index) => ({ icon, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item, index) => ({
        id: index,
        iconId: ICONS.indexOf(item.icon),
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffled);
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setGameWon(false);
  };

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      checkForMatch(newFlipped[0], newFlipped[1]);
    }
  };

  const checkForMatch = (id1: number, id2: number) => {
    const card1 = cards[id1];
    const card2 = cards[id2];

    if (card1.iconId === card2.iconId) {
      setTimeout(() => {
        const newCards = [...cards];
        newCards[id1].isMatched = true;
        newCards[id2].isMatched = true;
        setCards(newCards);
        setFlippedCards([]);
        setMatches(m => {
          const newM = m + 1;
          if (newM === (gridSize * gridSize) / 2) {
            setGameWon(true);
            toast.success("Level Complete!");
          }
          return newM;
        });
      }, 500);
    } else {
      setTimeout(() => {
        const newCards = [...cards];
        newCards[id1].isFlipped = false;
        newCards[id2].isFlipped = false;
        setCards(newCards);
        setFlippedCards([]);
      }, 1000);
    }
  };

  const IconComponent = ({ iconId }: { iconId: number }) => {
    const Icon = ICONS[iconId];
    return <Icon className="h-8 w-8 text-white drop-shadow-lg" />;
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_50px_rgba(234,88,12,0.4)] mb-4">
            <Brain className="h-20 w-20 text-white" />
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight">Flip & Match</h2>
          <p className="text-indigo-200 text-xl max-w-md mx-auto">Find all matching pairs with the fewest moves possible.</p>
        </div>
        <Button 
          size="lg" 
          className="w-64 h-16 text-xl font-bold rounded-2xl bg-white text-orange-600 hover:bg-orange-50 hover:scale-105 transition-all shadow-xl" 
          onClick={() => setGameStarted(true)}
        >
          Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 pb-24">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-8 bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/10">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Moves</span>
          <span className="text-3xl font-black text-white">{moves}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Matches</span>
          <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
            {matches} <span className="text-slate-600 text-xl">/ {(gridSize * gridSize) / 2}</span>
          </span>
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-3 md:gap-4 w-full max-w-[500px] aspect-square">
          {cards.map((card) => (
            <motion.button
              key={card.id}
              className={`relative w-full h-full rounded-2xl text-2xl flex items-center justify-center shadow-lg transition-all preserve-3d perspective-1000 focus:outline-none`}
              onClick={() => handleCardClick(card.id)}
              whileTap={{ scale: 0.95 }}
              animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front (Hidden) */}
              <div 
                className="absolute inset-0 w-full h-full bg-slate-800 border-2 border-slate-700 rounded-2xl backface-hidden flex items-center justify-center shadow-inner"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <Brain className="text-slate-600 h-4 w-4" />
                </div>
              </div>
              
              {/* Back (Revealed) */}
              <div 
                className={`absolute inset-0 w-full h-full rounded-2xl backface-hidden flex items-center justify-center border-2 ${card.isMatched ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]'}`}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <IconComponent iconId={card.iconId} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {gameWon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-8"
           >
             <div className="relative inline-block">
               <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-50 rounded-full"></div>
               <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-slate-900 shadow-xl">
                 <Star className="h-12 w-12 text-white fill-white" />
               </div>
             </div>
             
             <div>
               <h3 className="text-4xl font-black text-white mb-2">Level Complete!</h3>
               <p className="text-slate-400 text-lg">Perfect memory! You finished in <span className="text-white font-bold">{moves} moves</span>.</p>
             </div>

             <div className="flex gap-4 justify-center">
               <Button variant="secondary" className="h-12 px-6 rounded-xl bg-slate-800 text-white hover:bg-slate-700" onClick={onBack}>
                 Menu
               </Button>
               <Button className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25" onClick={initializeGame}>
                 <RefreshCw className="mr-2 h-4 w-4" /> Play Again
               </Button>
             </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
