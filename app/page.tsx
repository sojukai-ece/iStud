"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

// --- TYPES ---
interface Folder { id: string; name: string; user_id: string; }
interface Flashcard { id: string; question: string; answer: string; }
interface ChatMessage { id: string; user_id: string; user_name: string; text: string; created_at: string; }

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study-hub' | 'auxilink-ai' | 'community'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [selectedTechnique, setSelectedTechnique] = useState('active-recall');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // --- LIVE CHAT STATE ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatInput, setNewChatInput] = useState('');

  // --- INITIALIZE & FETCH DATA ---
  useEffect(() => {
    const fetchSessionAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase.from('folders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (data) setFolders(data);
      }
      
      // Fetch initial chat history for everyone
      const { data: chatData } = await supabase.from('community_messages').select('*').order('created_at', { ascending: true });
      if (chatData) setChatMessages(chatData);
    };

    fetchSessionAndData();

    // --- SETUP SUPABASE REALTIME WEBSOCKET ---
    const channel = supabase
      .channel('live-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
        // When someone else sends a message, add it to the screen instantly!
        setChatMessages((current) => [...current, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Cleanup when closing the tab
    };
  }, []);

  // --- DATABASE FUNCTIONS ---
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setFolders([]); setProfileMenuOpen(false);
  };

  const openFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    const { data } = await supabase.from('flashcards').select('*').eq('folder_id', folder.id).order('created_at', { ascending: false });
    if (data) setFlashcards(data);
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return alert("Please log in first!");
    const { data, error } = await supabase.from('folders').insert([{ name: newFolderName, user_id: user.id }]).select();
    if (error) return alert(error.message);
    if (data) { setFolders([data[0], ...folders]); setNewFolderName(''); }
  };

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim() || !selectedFolder || !user) return;
    const { data, error } = await supabase.from('flashcards').insert([{ folder_id: selectedFolder.id, user_id: user.id, question: newQuestion, answer: newAnswer }]).select();
    if (error) return alert(error.message);
    if (data) { setFlashcards([data[0], ...flashcards]); setNewQuestion(''); setNewAnswer(''); }
  };

  // --- SEND CHAT MESSAGE ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatInput.trim() || !user) return;

    // Use the part of their email before the @ symbol as their username
    const username = user.email?.split('@')[0] || 'Anonymous Scholar';
    const messageToSend = newChatInput;
    setNewChatInput(''); // Clear input box instantly for a snappy feel

    const { error } = await supabase
      .from('community_messages')
      .insert([{ user_id: user.id, user_name: username, text: messageToSend }]);

    if (error) alert("Chat Error: " + error.message);
  };

  // Helper to format timestamps neatly
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-500 selection:text-white pb-20">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-[#1B365D] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform p-1.5">
              <Image src="/istud-logo.png" alt="iStud Logo" width={40} height={40} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#1B365D]">iSt<span className="text-blue-500">u</span>d</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 -mt-1">Academic Portal</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'study-hub', label: '📚 Study Hub' },
              { id: 'auxilink-ai', label: '🤖 Auxilink AI' },
              { id: 'community', label: '💬 Community' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedFolder(null); }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-[#1B365D] shadow-sm scale-102' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="relative">
            {user ? (
              <div className="flex items-center gap-3">
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-[#1B365D] text-white flex items-center justify-center text-xs font-bold">{user.email?.charAt(0).toUpperCase()}</div>
                  <span className="text-sm font-bold text-[#1B365D] max-w-25 truncate">{user.email}</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-12 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b border-slate-50">
                      <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-[#1B365D] truncate">{user.email}</p>
                    </div>
                    <button className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">⚙️ Account Settings</button>
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">🚪 Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-[#1B365D] text-white font-extrabold text-sm px-6 py-2.5 rounded-full shadow-[0_4px_0_0_#0F1E36] hover:shadow-[0_2px_0_0_#0F1E36] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      {/* --- DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8 animate-fade-in">
          <div className="bg-[#1B365D] text-white rounded-4xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="max-w-xl space-y-4 z-10 relative">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {user ? 'Welcome Back, Scholar' : 'System Online'}
              </span>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Your Academic Center of Operations.</h1>
              <p className="text-blue-100/80 font-medium leading-relaxed">Track retention metrics, launch your customized decks, or collaborate with fellow scholars across the campus.</p>
              <div className="pt-4 flex flex-wrap gap-4">
                <button onClick={() => setActiveTab('study-hub')} className="bg-white text-[#1B365D] font-black px-6 py-3.5 rounded-full hover:bg-blue-50 transition-colors shadow-lg">Open Study Hub →</button>
                <button onClick={() => setActiveTab('auxilink-ai')} className="bg-blue-600/40 border border-blue-400/40 text-white font-bold px-6 py-3.5 rounded-full hover:bg-blue-600/60 transition-colors">Ask Auxilink AI</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Folders Created</span>
              <div className="text-4xl font-black text-[#1B365D] mt-2">{folders.length} Folders</div>
            </div>
            <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white p-6 rounded-3xl shadow-lg">
              <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Retention Rate</span>
              <div className="text-4xl font-black mt-2">94%</div>
              <p className="text-blue-100 text-sm font-medium mt-2">Active recall is boosting your memory.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Study Streak</span>
              <div className="text-4xl font-black text-amber-500 mt-2">🔥 Active</div>
            </div>
          </div>
        </main>
      )}

      {/* --- STUDY HUB --- */}
      {activeTab === 'study-hub' && (
        <main className="max-w-6xl mx-auto px-6 pt-10 animate-fade-in">
          {!selectedFolder && (
            <div className="mb-10 space-y-4">
              <div><h2 className="text-3xl font-black text-[#1B365D]">🧠 Study Hub & Techniques</h2><p className="text-slate-600 font-medium">Select a scientific study strategy or manage your flashcard folders.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[{ id: 'active-recall', name: 'Active Recall', icon: '🔄', desc: 'Test yourself before checking notes.' }, { id: 'feynman', name: 'Feynman Technique', icon: '🗣️', desc: 'Explain concepts in simple terms.' }, { id: 'pomodoro', name: 'Pomodoro Timer', icon: '⏱️', desc: '25m focus / 5m structured breaks.' }, { id: 'blurting', name: 'Blurting Method', icon: '📝', desc: 'Write everything from memory fast.' }].map((tech) => (
                  <div key={tech.id} onClick={() => setSelectedTechnique(tech.id)} className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${selectedTechnique === tech.id ? 'border-[#1B365D] bg-blue-50/50 shadow-md' : 'border-slate-200/80 bg-white hover:border-slate-300'}`}>
                    <div className="text-2xl mb-2">{tech.icon}</div><h4 className="font-black text-[#1B365D]">{tech.name}</h4><p className="text-xs text-slate-500 font-medium mt-1">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedFolder ? (
            <div className="bg-white p-8 rounded-4xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div><h3 className="text-2xl font-black text-[#1B365D]">🗂️ Your Private Decks</h3><p className="text-sm text-slate-500">Organize your subjects securely in the cloud.</p></div>
                <form onSubmit={handleAddFolder} className="flex gap-2 w-full sm:w-auto">
                  <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="New subject folder..." className="bg-slate-50 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-[#1B365D] w-full sm:w-64" />
                  <button type="submit" className="bg-[#1B365D] text-white px-5 py-2.5 rounded-xl font-extrabold text-sm hover:bg-slate-800 transition-colors shrink-0">+ Add Folder</button>
                </form>
              </div>

              {folders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <span className="text-4xl mb-4 block">📭</span>
                  <h4 className="text-lg font-bold text-slate-700">{user ? 'Your desk is completely clear!' : 'Log in to see your folders!'}</h4>
                  <p className="text-sm text-slate-500 mt-1">{user ? 'Create your very first folder above.' : 'Your data is securely locked until you sign in.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  {folders.map((folder) => (
                    <div key={folder.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#1B365D] transition-all group flex flex-col justify-between h-40">
                      <div><span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Subject Folder</span><h4 className="text-lg font-black text-[#1B365D] mt-1 group-hover:text-blue-600 transition-colors">{folder.name}</h4></div>
                      <button onClick={() => openFolder(folder)} className="text-xs font-black text-white bg-[#1B365D] w-full mt-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 transition-colors">Open Deck 📂</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-4xl border border-slate-200/80 shadow-sm space-y-6">
              <button onClick={() => setSelectedFolder(null)} className="text-sm font-bold text-slate-500 hover:text-[#1B365D] flex items-center gap-2 mb-4 bg-slate-100 px-4 py-2 rounded-full w-fit">← Back to Folders</button>
              <div className="pb-6 border-b border-slate-100"><h3 className="text-3xl font-black text-[#1B365D]">{selectedFolder.name}</h3><p className="text-sm text-slate-500">Add questions and answers to this secure deck.</p></div>
              <form onSubmit={handleAddFlashcard} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <div><label className="text-xs font-bold text-[#1B365D] uppercase ml-1">Question (Front)</label><input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required placeholder="e.g. What is Ohm's Law?" className="w-full mt-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500" /></div>
                <div><label className="text-xs font-bold text-[#1B365D] uppercase ml-1">Answer (Back)</label><input type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required placeholder="e.g. V = I * R" className="w-full mt-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500" /></div>
                <div className="sm:col-span-2 flex justify-end"><button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-extrabold text-sm hover:bg-blue-700 shadow-md transition-colors">+ Save Flashcard</button></div>
              </form>
              <div className="space-y-3 pt-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase">Cards inside this folder</h4>
                {flashcards.length === 0 ? <p className="text-sm font-medium text-slate-500 italic">No cards added yet. Create one above!</p> : flashcards.map((card) => (
                  <div key={card.id} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1"><span className="text-[10px] font-bold text-slate-400 uppercase">Q:</span><p className="font-black text-[#1B365D]">{card.question}</p></div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="text-[10px] font-bold text-emerald-500 uppercase">A:</span><p className="font-bold text-slate-700">{card.answer}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* --- AUXILINK AI --- */}
      {activeTab === 'auxilink-ai' && (
        <main className="max-w-4xl mx-auto px-6 pt-16 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-[#1B365D] to-blue-500 text-white flex items-center justify-center text-4xl mx-auto shadow-xl">🤖</div>
          <span className="bg-blue-100 text-blue-800 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest">Module In Development</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1B365D]">Meet Auxilink AI</h2>
          <p className="text-lg text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">We are replacing standard calculators with an intelligent engineering and science assistant built directly into iStud.</p>
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

      {/* --- COMMUNITY CHAT --- */}
      {activeTab === 'community' && (
        <main className="max-w-4xl mx-auto px-6 pt-10 animate-fade-in">
          <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-162.5">
            <div className="p-6 bg-[#1B365D] text-white flex justify-between items-center">
              <div><h3 className="text-xl font-black">💬 Campus Public Lounge</h3><p className="text-xs text-blue-200">Connect, ask questions, and share study decks in real time.</p></div>
              <span className="bg-blue-500/30 border border-blue-400/30 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live Sync Enabled</span>
            </div>
            
            {/* Messages Feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex flex-col">
              {chatMessages.length === 0 ? (
                <div className="m-auto text-center">
                  <span className="text-4xl">👋</span>
                  <p className="text-slate-500 font-bold mt-2">No messages yet. Be the first to say hello!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = user?.id === msg.user_id;
                  return (
                    <div key={msg.id} className={`max-w-md p-4 rounded-2xl border shadow-sm ${isMe ? 'bg-blue-50 border-blue-200 self-end rounded-tr-sm' : 'bg-white border-slate-200/80 self-start rounded-tl-sm'}`}>
                      <div className="flex justify-between items-center mb-1 gap-4">
                        <span className={`font-black text-xs ${isMe ? 'text-blue-700' : 'text-[#1B365D]'}`}>{isMe ? 'You' : msg.user_name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{msg.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input type="text" value={newChatInput} onChange={(e) => setNewChatInput(e.target.value)} placeholder={user ? "Message the campus lounge..." : "Log in to chat!"} disabled={!user} className="flex-1 bg-slate-100 border border-transparent px-5 py-3 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-[#1B365D] transition-all disabled:opacity-50" />
              <button type="submit" disabled={!user || !newChatInput.trim()} className="bg-[#1B365D] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-colors disabled:opacity-50">Send 🚀</button>
            </form>
          </div>
        </main>
      )}

    </div>
  );
}
