import React from 'react';
import { Button } from '../ui/button';
import { Brain, Zap, Grid, Palette, Play, Star, ChevronRight } from 'lucide-react';
import { Screen } from '../../App';
import { motion } from 'motion/react';

interface MenuScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function MenuScreen({ onNavigate }: MenuScreenProps) {
  const games = [
    {
      id: 'game-flip-match',
      title: 'Flip & Match',
      description: 'Memory Challenge',
      icon: Grid,
      color: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-500/20',
      stat: 'Lv. 4'
    },
    {
      id: 'game-math-rush',
      title: 'Math Rush',
      description: 'Speed Calculation',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/20',
      stat: 'Top 10%'
    },
    {
      id: 'game-spatial-memory',
      title: 'Spatial Grid',
      description: 'Pattern Recall',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20',
      stat: 'New!'
    },
    {
      id: 'game-stroop-test',
      title: 'Stroop Test',
      description: 'Focus & Logic',
      icon: Palette,
      color: 'from-emerald-500 to-green-500',
      shadow: 'shadow-emerald-500/20',
      stat: 'Hard'
    },
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 shadow-2xl shadow-indigo-900/50 border border-indigo-400/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 text-xs font-bold text-white mb-4">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              DAILY CHALLENGE
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Brain Workout</h2>
            <p className="text-indigo-100 max-w-md">Complete 3 games today to keep your streak alive! You're on a 5-day streak.</p>
          </div>
          <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 font-bold text-lg h-14 px-8 shadow-xl">
            Start Now
          </Button>
        </div>
      </div>

      {/* Games Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold text-white">Featured Games</h3>
          <Button variant="ghost" className="text-indigo-300 hover:text-white hover:bg-white/5">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onNavigate(game.id as Screen)}
              className={`group relative overflow-hidden rounded-3xl p-1 text-left transition-all hover:scale-[1.02] active:scale-95`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl rounded-[22px]" />
              
              {/* Card Content */}
              <div className="relative h-full p-6 flex flex-col rounded-[22px] bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg ${game.shadow}`}>
                    <game.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                    {game.stat}
                  </div>
                </div>
                
                <div className="mt-auto">
                  <h4 className="text-2xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                    {game.title}
                  </h4>
                  <p className="text-slate-400 font-medium text-sm mb-6">{game.description}</p>
                  
                  <div className={`w-full h-12 rounded-xl bg-gradient-to-r ${game.color} flex items-center justify-center text-white font-bold shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300`}>
                    <Play className="h-5 w-5 mr-2 fill-white" />
                    PLAY
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
