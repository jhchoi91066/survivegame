import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Brain, Zap, Target, Clock, TrendingUp } from 'lucide-react';

const data = [
  { name: 'Mon', score: 4000 },
  { name: 'Tue', score: 3000 },
  { name: 'Wed', score: 2000 },
  { name: 'Thu', score: 2780 },
  { name: 'Fri', score: 1890 },
  { name: 'Sat', score: 2390 },
  { name: 'Sun', score: 3490 },
];

const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
  <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-white/20 transition-colors">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-2xl -mr-10 -mt-10`} />
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-3 rounded-2xl bg-${color}-500/20 text-${color}-400`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-${color}-500/10 text-${color}-400`}>
        {trend}
      </span>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 font-medium text-sm mb-1">{title}</h3>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  </div>
);

export function StatsScreen() {
  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white">Performance</h2>
        <div className="px-4 py-2 rounded-full bg-slate-800/50 border border-white/10 text-sm font-bold text-slate-300">
          Last 7 Days
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Games" 
          value="128" 
          trend="+14%" 
          icon={Brain} 
          color="indigo" 
        />
        <StatCard 
          title="Avg Score" 
          value="845" 
          trend="+2.5%" 
          icon={Target} 
          color="emerald" 
        />
        <StatCard 
          title="Reaction" 
          value="240ms" 
          trend="-12ms" 
          icon={Zap} 
          color="yellow" 
        />
        <StatCard 
          title="Play Time" 
          value="12h 4m" 
          trend="+2h" 
          icon={Clock} 
          color="purple" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="col-span-4 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Activity</h3>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)' 
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="score" 
                  fill="#6366f1" 
                  radius={[6, 6, 6, 6]} 
                  barSize={32}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="col-span-3 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Skill Breakdown</h3>
          <div className="space-y-8">
            {[
              { label: 'Memory', score: 92, color: 'bg-emerald-500' },
              { label: 'Speed', score: 78, color: 'bg-blue-500' },
              { label: 'Logic', score: 85, color: 'bg-purple-500' },
              { label: 'Focus', score: 64, color: 'bg-orange-500' },
            ].map((skill) => (
              <div key={skill.label} className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-bold text-slate-200">{skill.label}</div>
                  <div className="text-slate-400 font-mono">{skill.score}/100</div>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 inner-shadow">
                  <div className={`h-full w-[${skill.score}%] rounded-full ${skill.color} shadow-[0_0_10px_rgba(0,0,0,0.3)]`} style={{ width: `${skill.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
