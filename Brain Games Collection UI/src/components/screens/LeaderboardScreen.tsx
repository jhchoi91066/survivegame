import React from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Trophy, Medal, Crown, Shield } from 'lucide-react';

const leaderboardData = [
  { rank: 1, name: 'Alex Johnson', score: 15420, avatar: 'AJ', badge: 'Grandmaster', tier: 'diamond' },
  { rank: 2, name: 'Sarah Williams', score: 14850, avatar: 'SW', badge: 'Master', tier: 'platinum' },
  { rank: 3, name: 'Mike Chen', score: 14200, avatar: 'MC', badge: 'Expert', tier: 'gold' },
  { rank: 4, name: 'Emily Davis', score: 13950, avatar: 'ED', badge: 'Expert', tier: 'gold' },
  { rank: 5, name: 'David Miller', score: 13500, avatar: 'DM', badge: 'Advanced', tier: 'silver' },
  { rank: 6, name: 'Lisa Wilson', score: 12800, avatar: 'LW', badge: 'Advanced', tier: 'silver' },
  { rank: 7, name: 'James Taylor', score: 12450, avatar: 'JT', badge: 'Intermediate', tier: 'silver' },
  { rank: 8, name: 'John Doe', score: 12450, avatar: 'JD', badge: 'Intermediate', tier: 'bronze', highlight: true },
  { rank: 9, name: 'Robert Moore', score: 11900, avatar: 'RM', badge: 'Intermediate', tier: 'bronze' },
  { rank: 10, name: 'Jennifer Lee', score: 11200, avatar: 'JL', badge: 'Beginner', tier: 'bronze' },
];

export function LeaderboardScreen() {
  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Leaderboard</h2>
          <p className="text-slate-400">Global Rankings • Season 4</p>
        </div>
        <div className="flex items-center gap-3 bg-yellow-500/10 px-5 py-3 rounded-2xl border border-yellow-500/20 backdrop-blur-md">
           <Crown className="h-6 w-6 text-yellow-400 fill-yellow-400" />
           <div>
             <div className="text-xs text-yellow-200 font-bold uppercase">Your Rank</div>
             <div className="text-xl font-black text-yellow-400">#8</div>
           </div>
        </div>
      </div>

      {/* Top 3 Podium (Visual Only for now) */}
      <div className="grid grid-cols-3 gap-4 items-end py-8">
        {[
          { rank: 2, height: 'h-32', color: 'bg-slate-400' },
          { rank: 1, height: 'h-40', color: 'bg-yellow-400' },
          { rank: 3, height: 'h-24', color: 'bg-orange-400' }
        ].map((pos) => {
           const player = leaderboardData[pos.rank - 1];
           return (
             <div key={pos.rank} className="flex flex-col items-center gap-3">
               <div className="relative">
                 <Avatar className="h-16 w-16 border-4 border-slate-900 shadow-xl">
                   <AvatarFallback className="bg-slate-800 text-white font-bold">{player.avatar}</AvatarFallback>
                 </Avatar>
                 <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${pos.color} flex items-center justify-center text-slate-900 font-bold text-xs border-2 border-slate-900`}>
                   {pos.rank}
                 </div>
               </div>
               <div className="text-center">
                 <div className="font-bold text-white text-sm">{player.name}</div>
                 <div className="text-indigo-400 text-xs font-mono font-bold">{player.score.toLocaleString()}</div>
               </div>
               <div className={`w-full ${pos.height} rounded-t-2xl ${pos.color} opacity-20`} />
             </div>
           );
        })}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-2 md:col-span-1 text-center">Rank</div>
          <div className="col-span-6 md:col-span-5">Player</div>
          <div className="col-span-4 md:col-span-3 text-right">Score</div>
          <div className="hidden md:block md:col-span-3 text-right">Tier</div>
        </div>
        
        <div className="divide-y divide-white/5">
          {leaderboardData.map((player) => (
            <div 
              key={player.rank} 
              className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors ${player.highlight ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : ''}`}
            >
              <div className="col-span-2 md:col-span-1 flex justify-center">
                <span className={`font-black ${player.rank <= 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                  #{player.rank}
                </span>
              </div>
              <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">{player.avatar}</AvatarFallback>
                </Avatar>
                <span className={`font-bold text-sm ${player.highlight ? 'text-indigo-300' : 'text-slate-200'}`}>
                  {player.name}
                </span>
              </div>
              <div className="col-span-4 md:col-span-3 text-right font-mono font-bold text-indigo-400">
                {player.score.toLocaleString()}
              </div>
              <div className="hidden md:block md:col-span-3 text-right">
                <Badge variant="outline" className="border-white/10 text-slate-400 bg-white/5">
                  {player.badge}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
