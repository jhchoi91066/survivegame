import React from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Screen } from '../../App';
import { LogOut, Settings, Bell, Shield, Edit, Camera } from 'lucide-react';

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  return (
    <div className="space-y-8 pb-24">
      <div className="relative h-48 rounded-3xl overflow-hidden bg-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-80" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
      </div>

      <div className="px-4 relative -mt-20">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
          <div className="flex items-end gap-6">
             <div className="relative group">
               <Avatar className="h-32 w-32 border-4 border-[#0f172a] shadow-2xl rounded-3xl">
                 <AvatarImage src="https://github.com/shadcn.png" />
                 <AvatarFallback className="bg-slate-800 text-2xl font-bold">JD</AvatarFallback>
               </Avatar>
               <button className="absolute bottom-2 right-2 p-2 bg-indigo-600 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                 <Camera className="h-4 w-4" />
               </button>
             </div>
             <div className="mb-2">
               <h2 className="text-3xl font-black text-white">John Doe</h2>
               <p className="text-indigo-300 font-medium">Level 12 Brainiac</p>
             </div>
          </div>
          <div className="flex gap-3 mb-2">
            <Button variant="secondary" className="bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 rounded-xl">
              <Settings className="h-4 w-4 mr-2" /> Settings
            </Button>
            <Button variant="destructive" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-white/10 p-0 h-auto gap-8 rounded-none">
          <TabsTrigger 
            value="general" 
            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 rounded-none px-0 py-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            General
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 rounded-none px-0 py-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 rounded-none px-0 py-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-8 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-6">
             <div className="grid gap-2">
               <Label className="text-slate-400">Display Name</Label>
               <Input defaultValue="John Doe" className="bg-slate-950/50 border-slate-800 text-white focus:ring-indigo-500 rounded-xl h-12" />
             </div>
             <div className="grid gap-2">
               <Label className="text-slate-400">Email</Label>
               <Input defaultValue="john@example.com" disabled className="bg-slate-950/30 border-slate-800 text-slate-500 rounded-xl h-12" />
             </div>
             <div className="grid gap-2">
               <Label className="text-slate-400">Bio</Label>
               <Input defaultValue="I love puzzles!" className="bg-slate-950/50 border-slate-800 text-white focus:ring-indigo-500 rounded-xl h-12" />
             </div>
             <div className="pt-4">
               <Button className="bg-indigo-600 hover:bg-indigo-500 text-white h-12 px-8 rounded-xl font-bold">Save Changes</Button>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-8">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-4">
            <div className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-white">Daily Reminders</p>
                  <p className="text-sm text-slate-400">Get reminded to train every day.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="bg-transparent border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300">Enabled</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-8">
           <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-4">
            <div className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-white">Password</p>
                  <p className="text-sm text-slate-400">Last changed 3 months ago.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5">Change</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
