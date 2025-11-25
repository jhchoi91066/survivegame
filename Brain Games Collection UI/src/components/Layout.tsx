import React from 'react';
import { Button } from './ui/button';
import { 
  Gamepad2, 
  BarChart2, 
  Trophy, 
  User, 
  Home,
  Sparkles
} from 'lucide-react';
import { Screen } from '../App';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Layout({ children, currentScreen, onNavigate }: LayoutProps) {
  const navItems = [
    { id: 'menu', label: 'Play', icon: Gamepad2 },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'leaderboard', label: 'Rank', icon: Trophy },
    { id: 'profile', label: 'Me', icon: User },
  ] as const;

  const isGameScreen = currentScreen.startsWith('game-');

  return (
    <div className="relative flex h-screen overflow-hidden z-10">
      {/* Top HUD */}
      {!isGameScreen && (
        <header className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl rotate-3 shadow-lg shadow-indigo-500/20 flex items-center justify-center border-2 border-indigo-400">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white drop-shadow-md">BRAIN<span className="text-indigo-400">GAMES</span></h1>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                   <div className="h-full w-[65%] bg-gradient-to-r from-indigo-500 to-purple-500" />
                 </div>
                 <span className="text-xs font-bold text-indigo-300">Lvl 12</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-4">
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">ONLINE</span>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-md">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-black text-yellow-400">12,450</span>
            </div>
          </div>
        </header>
      )}

      {/* Game Mode HUD */}
      {isGameScreen && (
         <div className="absolute top-6 left-6 z-50">
           <Button 
             variant="secondary" 
             className="bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800 backdrop-blur-md rounded-xl shadow-xl"
             onClick={() => onNavigate('menu')}
           >
             <Home className="h-4 w-4 mr-2" />
             Exit
           </Button>
         </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-auto scrollbar-hide ${isGameScreen ? 'h-full' : 'pt-24 pb-28 px-4 md:px-8'}`}>
        <div className="max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Dock */}
      {!isGameScreen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl shadow-black/50 flex items-center justify-between">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as Screen)}
                  className={`relative group flex flex-col items-center justify-center w-20 h-16 rounded-2xl transition-all duration-300 ${
                    isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-500/25 -translate-y-4' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-indigo-100' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute -bottom-2 w-1 h-1 rounded-full bg-indigo-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
