"use client";
import { supabase } from '../lib/supabase';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// --- TYPES FOR OUR UI DATA ---
interface Folder {
  id: string;
  name: string;
  cardCount: number;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

export default function Home() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study-hub' | 'auxilink-ai' | 'community'>('dashboard');

  // Study Hub State: Folders & Techniques
  const [selectedTechnique, setSelectedTechnique] = useState('active-recall');
  const [folders, setFolders] = useState<Folder[]>([
    { id: '1', name: '⚡ Circuit Analysis & Ohm Law', cardCount: 14 },
    { id: '2', name: '📐 Boolean Algebra & Karnaugh Maps', cardCount: 8 },
    { id: '3', name: '🐍 Python & C++ Syntaxes', cardCount: 22 },
  ]);
  const [newFolderName, setNewFolderName] = useState('');

  // Community Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Engr_Marco', text: 'Anyone want to review Laplace Transforms tonight at 8 PM?', time: '2m ago' },
    { id: '2', user: 'Iskolar_Sarah', text: 'Just uploaded 20 new cards on Digital Logic to the community vault!', time: 'Just now' },
  ]);
  const [newChatInput, setNewChatInput] = useState('');

  // Handlers
  const handleAddFolder = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newFolderName.trim()) return;

  // Let's debug what's happening
  console.log("Attempting to save folder:", newFolderName);

  const { data, error } = await supabase
    .from('folders')
    .insert([{ name: newFolderName }])
    .select();

  if (error) {
    console.error("Supabase Error:", error); // Check your Browser Console (F12)
    alert("Error saving folder: " + error.message);
    return;
  }

  console.log("Success! Data from Supabase:", data);

  if (data) {
    setFolders([...folders, { id: data[0].id, name: data[0].name, cardCount: 0 }]);
    setNewFolderName('');
  }
};

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatInput.trim()) return;
    setChatMessages([
      ...chatMessages,
      { id: Date.now().toString(), user: 'You (Online)', text: newChatInput, time: 'Just now' }
    ]);
    setNewChatInput('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-500 selection:text-white pb-20">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-[#1B365D] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden p-1.5">
              <Image 
                src="/istud-logo.png" 
                alt="iStud Logo" 
                width={40} 
                height={40}
                className="object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-white font-black text-xl tracking-tighter hidden">iS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#1B365D]">
                iSt<span className="text-blue-500">u</span>d
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 -mt-1">
                Academic Portal
              </span>
            </div>
          </div>

          {/* Dynamic App Navigation */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'study-hub', label: '📚 Study Hub' },
              { id: 'auxilink-ai', label: '🤖 Auxilink AI' },
              { id: 'community', label: '💬 Community' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === tab.id ? 'bg-white text-[#1B365D] shadow-sm scale-102' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-4 py-2 rounded-full text-xs font-extrabold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Supabase Ready
          </div>
        </div>
      </header>

      {/* VIEW 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8 animate-fade-in">
          <div className="bg-[#1B365D] text-white rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-xl">
            <div className="max-w-xl space-y-4 z-10 relative">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Welcome Back, Scholar
              </span>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                Your Academic Center of Operations.
              </h1>
              <p className="text-blue-100/80 font-medium leading-relaxed">
                Track retention metrics, launch your customized decks, or collaborate with fellow scholars across the campus.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <button onClick={() => setActiveTab('study-hub')} className="bg-white text-[#1B365D] font-black px-6 py-3.5 rounded-full hover:bg-blue-50 transition-colors shadow-lg">
                  Open Study Hub →
                </button>
                <button onClick={() => setActiveTab('auxilink-ai')} className="bg-blue-600/40 border border-blue-400/40 text-white font-bold px-6 py-3.5 rounded-full hover:bg-blue-600/60 transition-colors">
                  Ask Auxilink AI
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Decks Created</span>
              <div className="text-4xl font-black text-[#1B365D] mt-2">{folders.length} Folders</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cards Mastered</span>
              <div className="text-4xl font-black text-blue-600 mt-2">44 Cards</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Study Streak</span>
              <div className="text-4xl font-black text-amber-500 mt-2">🔥 5 Days</div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: STUDY HUB (Techniques + Folder Storage) */}
      {activeTab === 'study-hub' && (
        <main className="max-w-6xl mx-auto px-6 pt-10 space-y-10 animate-fade-in">
          <div>
            <h2 className="text-3xl font-black text-[#1B365D]">🧠 Study Hub & Techniques</h2>
            <p className="text-slate-600 font-medium">Select a scientific study strategy or manage your flashcard folders.</p>
          </div>

          {/* Multiple Study Techniques Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { id: 'active-recall', name: 'Active Recall', icon: '🔄', desc: 'Test yourself before checking notes.' },
              { id: 'feynman', name: 'Feynman Technique', icon: '🗣️', desc: 'Explain concepts in simple terms.' },
              { id: 'pomodoro', name: 'Pomodoro Timer', icon: '⏱️', desc: '25m focus / 5m structured breaks.' },
              { id: 'blurting', name: 'Blurting Method', icon: '📝', desc: 'Write everything from memory fast.' },
            ].map((tech) => (
              <div 
                key={tech.id}
                onClick={() => setSelectedTechnique(tech.id)}
                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                  selectedTechnique === tech.id 
                    ? 'border-[#1B365D] bg-blue-50/50 shadow-md' 
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-2">{tech.icon}</div>
                <h4 className="font-black text-[#1B365D]">{tech.name}</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>

          {/* Folder & Flashcard Storage Section */}
          <div className="bg-white p-8 rounded-4xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-[#1B365D]">🗂️ Flashcard Folders</h3>
                <p className="text-sm text-slate-500">Organize your subjects. (Ready to sync with Supabase PostgreSQL).</p>
              </div>

              {/* Add New Folder Input */}
              <form onSubmit={handleAddFolder} className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New subject folder..." 
                  className="bg-slate-50 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-[#1B365D] w-full sm:w-64"
                />
                <button type="submit" className="bg-[#1B365D] text-white px-5 py-2.5 rounded-xl font-extrabold text-sm hover:bg-slate-800 transition-colors shrink-0">
                  + Add Folder
                </button>
              </form>
            </div>

            {/* Folder Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {folders.map((folder) => (
                <div key={folder.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#1B365D] transition-all group flex flex-col justify-between h-40">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Subject Folder</span>
                    <h4 className="text-lg font-black text-[#1B365D] mt-1 group-hover:text-blue-600 transition-colors">{folder.name}</h4>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200/60">
                    <span className="text-xs font-bold text-slate-500">{folder.cardCount} Cards inside</span>
                    <Link href="/study" className="text-xs font-black text-[#1B365D] bg-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
                      Open Deck →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: AUXILINK AI */}
      {activeTab === 'auxilink-ai' && (
        <main className="max-w-4xl mx-auto px-6 pt-16 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-[#1B365D] to-blue-500 text-white flex items-center justify-center text-4xl mx-auto shadow-xl">
            🤖
          </div>
          <span className="bg-blue-100 text-blue-800 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest">
            Module In Development
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1B365D]">Meet Auxilink AI</h2>
          <p className="text-lg text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
            We are replacing standard formula calculators with an intelligent, conversational engineering and science assistant built directly into iStud.
          </p>
          <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm max-w-lg mx-auto text-left space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase">Upcoming Auxilink Capabilities:</div>
            <ul className="space-y-2 text-sm font-bold text-slate-700">
              <li className="flex items-center gap-2">⚡ Automatic circuit & math step-by-step solver</li>
              <li className="flex items-center gap-2">⚡ Instant flashcard generation from textbook PDFs</li>
              <li className="flex items-center gap-2">⚡ Smart quiz generator tailored to your syllabus</li>
            </ul>
          </div>
        </main>
      )}

      {/* VIEW 4: COMMUNITY PUBLIC CHAT */}
      {activeTab === 'community' && (
        <main className="max-w-4xl mx-auto px-6 pt-10 animate-fade-in">
          <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-162.5">
            
            {/* Chat Header */}
            <div className="p-6 bg-[#1B365D] text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">💬 Campus Public Lounge</h3>
                <p className="text-xs text-blue-200">Connect, ask questions, and share study decks in real time.</p>
              </div>
              <span className="bg-blue-500/30 border border-blue-400/30 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 42 Students Online
              </span>
            </div>

            {/* Chat Message Feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm max-w-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xs text-[#1B365D]">{msg.user}</span>
                    <span className="text-[10px] font-bold text-slate-400">{msg.time}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Public Chat Input Box */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input 
                type="text" 
                value={newChatInput}
                onChange={(e) => setNewChatInput(e.target.value)}
                placeholder="Message the campus lounge..." 
                className="flex-1 bg-slate-100 border border-transparent px-5 py-3 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-[#1B365D] transition-all"
              />
              <button type="submit" className="bg-[#1B365D] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-colors">
                Send 🚀
              </button>
            </form>

          </div>
        </main>
      )}

    </div>
  );
}
