import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { MenuScreen } from './components/screens/MenuScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { StatsScreen } from './components/screens/StatsScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { FlipMatchGame } from './components/games/FlipMatchGame';
import { MathRushGame } from './components/games/MathRushGame';
import { SpatialMemoryGame } from './components/games/SpatialMemoryGame';
import { StroopTestGame } from './components/games/StroopTestGame';
import { Toaster } from 'sonner@2.0.3';

export type Screen = 
  | 'menu' 
  | 'profile' 
  | 'stats' 
  | 'leaderboard' 
  | 'settings'
  | 'game-flip-match'
  | 'game-math-rush'
  | 'game-spatial-memory'
  | 'game-stroop-test';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MenuScreen onNavigate={setCurrentScreen} />;
      case 'profile':
        return <ProfileScreen onNavigate={setCurrentScreen} />;
      case 'stats':
        return <StatsScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      case 'game-flip-match':
        return <FlipMatchGame onBack={() => setCurrentScreen('menu')} />;
      case 'game-math-rush':
        return <MathRushGame onBack={() => setCurrentScreen('menu')} />;
      case 'game-spatial-memory':
        return <SpatialMemoryGame onBack={() => setCurrentScreen('menu')} />;
      case 'game-stroop-test':
        return <StroopTestGame onBack={() => setCurrentScreen('menu')} />;
      default:
        return <MenuScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500 selection:text-white">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 pointer-events-none" />
      
      <Layout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
        {renderScreen()}
      </Layout>
      <Toaster theme="dark" />
    </div>
  );
}
