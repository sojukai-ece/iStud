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
  
  // --- PROFILE SETTINGS STATE ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');

  // --- STUDY HUB CORE STATE ---
  const [selectedTechnique, setSelectedTechnique] = useState<'active-recall' | 'feynman' | 'pomodoro' | 'blurting'>('active-recall');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // --- ACTIVE STUDY MODES STATE ---
  const [activeStudyMode, setActiveStudyMode] = useState<'none' | 'active-recall' | 'feynman' | 'blurting'>('none');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  
  // Feynman State
  const [feynmanInput, setFeynmanInput] = useState('');
  
  // Blurting State
  const [blurtingInput, setBlurtingInput] = useState('');
  const [blurtingTimeLeft, setBlurtingTimeLeft] = useState(300); // 5 minutes
  const [isBlurtingActive, setIsBlurtingActive] = useState(false);
  const [blurtingFinished, setBlurtingFinished] = useState(false);

  // Pomodoro State
  const [pomodoroTime, setPomodoroTime] = useState(1500); // 25 minutes
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatInput, setNewChatInput] = useState('');

  // --- INITIALIZE & REALTIME ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Load all profile metadata
      if (user?.user_metadata) {
        if (user.user_metadata.display_name) setDisplayName(user.user_metadata.display_name);
        if (user.user_metadata.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
        if (user.user_metadata.university) setUniversity(user.user_metadata.university);
        if (user.user_metadata.bio) setBio(user.user_metadata.bio);
      }

      if (user) {
        const { data: folderData } = await supabase.from('folders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (folderData) setFolders(folderData);
      }
      
      const { data: chatData } = await supabase.from('community_messages').select('*').order('created_at', { ascending: true });
      if (chatData) setChatMessages(chatData);
    };

    init();

    const channel = supabase
      .channel('live-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setChatMessages((prev) => {
          if (prev.find(msg => msg.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- TIMERS EFFECT ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroIsActive && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime((prev) => prev - 1), 1000);
    } else if (pomodoroTime === 0 && pomodoroIsActive) {
      setPomodoroIsActive(false);
      alert(pomodoroMode === 'work' ? 'Time for a break!' : 'Break is over. Back to work!');
    }
    return () => clearInterval(interval);
  }, [pomodoroIsActive, pomodoroTime, pomodoroMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBlurtingActive && blurtingTimeLeft > 0) {
      interval = setInterval(() => setBlurtingTimeLeft((prev) => prev - 1), 1000);
    } else if (blurtingTimeLeft === 0 && isBlurtingActive) {
      setIsBlurtingActive(false);
      setBlurtingFinished(true);
    }
    return () => clearInterval(interval);
  }, [isBlurtingActive, blurtingTimeLeft]);

  // --- DATABASE FUNCTIONS ---
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setFolders([]); setProfileMenuOpen(false); setIsSettingsOpen(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Save all new fields to Supabase Auth Metadata
    const { data, error } = await supabase.auth.updateUser({ 
      data: { 
        display_name: displayName,
        avatar_url: avatarUrl,
        university: university,
        bio: bio
      } 
    });
    
    if (error) alert("Error updating profile: " + error.message);
    else { setUser(data.user); setIsSettingsOpen(false); setProfileMenuOpen(false); }
  };

  const openFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    setActiveStudyMode('none');
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatInput.trim() || !user) return;
    const senderName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Guest Scholar';
    const messageToSend = newChatInput;
    setNewChatInput('');
    const tempMessage: ChatMessage = { id: Date.now().toString(), user_id: user.id, user_name: senderName, text: messageToSend, created_at: new Date().toISOString() };
    setChatMessages((prev) => [...prev, tempMessage]);
    const { error } = await supabase.from('community_messages').insert([{ user_id: user.id, user_name: senderName, text: messageToSend }]);
    if (error) alert("Chat Error: " + error.message);
  };

  // --- STUDY MODE CONTROLS ---
  const launchStudyMode = () => {
    if (flashcards.length === 0) return alert("Add some cards first!");
    setActiveStudyMode(selectedTechnique as 'active-recall' | 'feynman' | 'blurting');
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setFeynmanInput('');
    setBlurtingInput('');
    setBlurtingTimeLeft(300);
    setIsBlurtingActive(selectedTechnique === 'blurting');
    setBlurtingFinished(false);
  };

  const nextCard = () => {
    setIsCardFlipped(false);
    setFeynmanInput('');
    setCurrentCardIndex((prev) => prev + 1);
  };

  const togglePomodoro = () => setPomodoroIsActive(!pomodoroIsActive);
  const resetPomodoro = (mode: 'work' | 'break') => {
    setPomodoroIsActive(false);
    setPomodoroMode(mode);
    setPomodoroTime(mode === 'work' ? 1500 : 300);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatClock = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen text-slate-900 font-sans pb-24 md:pb-10 relative overflow-x-hidden">
      
      {/* --- CREATIVE ENGINEERING BACKGROUND --- */}
      <div className="fixed inset-0 z-[-1] bg-[#F8FAFC]">
        {/* Subtle Breadboard / Engineering Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[24px_24px] opacity-60"></div>
        
        {/* Soft Ambient Glowing Nodes */}
        <div className="absolute top-[-10%] left-[-10%] w-160 h-160 bg-blue-400/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-160 h-160 bg-indigo-400/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      </div>
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); setActiveStudyMode('none'); }} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-[#1B365D] flex items-center justify-center shadow-lg shadow-blue-900/20 p-1.5 group-hover:scale-105 transition-transform">
              <Image src="/istud-logo.png" alt="Logo" width={40} height={40} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#1B365D]">iSt<span className="text-blue-500">u</span>d</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 -mt-1">Academic Portal</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-2 bg-white/50 backdrop-blur-md border border-slate-200/50 p-1.5 rounded-full shadow-sm">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'study-hub', label: '📚 Study Hub' },
              { id: 'auxilink-ai', label: '🤖 Auxilink AI' },
              { id: 'community', label: '💬 Community' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelectedFolder(null); setActiveStudyMode('none'); }} className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all duration-300 ${activeTab === tab.id ? 'bg-[#1B365D] text-white shadow-md scale-105' : 'text-slate-600 hover:text-[#1B365D] hover:bg-slate-100/50'}`}>{tab.label}</button>
            ))}
          </nav>

          <div className="relative">
            {user ? (
              <div>
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-2 bg-white/80 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-7 h-7 rounded-full object-cover border border-[#1B365D] shadow-sm" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-linear-to-tr from-[#1B365D] to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">{user.email?.charAt(0).toUpperCase()}</div>
                  )}
                  <span className="hidden sm:inline text-sm font-bold text-[#1B365D] max-w-25 truncate">{user.user_metadata?.display_name || user.email}</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-14 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                    <div className="p-5 border-b border-slate-50">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                      <p className="text-sm font-black text-[#1B365D] truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <button onClick={() => { setIsSettingsOpen(true); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">⚙️ Account Settings</button>
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">🚪 Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            ) : ( <Link href="/login" className="bg-[#1B365D] text-white px-7 py-3 rounded-full font-black text-sm shadow-lg shadow-[#1B365D]/20 hover:scale-105 transition-transform">Sign In</Link> )}
          </div>
        </div>
      </header>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 z-50 px-2 py-3 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        {[{ id: 'dashboard', icon: '📊', label: 'Home' }, { id: 'study-hub', icon: '📚', label: 'Study' }, { id: 'auxilink-ai', icon: '🤖', label: 'AI' }, { id: 'community', icon: '💬', label: 'Chat' }].map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelectedFolder(null); setActiveStudyMode('none'); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === tab.id ? 'text-[#1B365D] scale-110' : 'text-slate-400 grayscale opacity-70'}`}>
            <span className="text-xl">{tab.icon}</span><span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* PROFILE SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-4xl w-full max-w-lg shadow-2xl overflow-hidden my-8 border border-white/20">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-[#1B365D]">Account Profile</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-red-100 hover:text-red-500 font-bold transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 md:p-8 space-y-6">
              
              {/* Profile Avatar Section */}
              <div className="flex items-center gap-5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'} />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 text-[#1B365D] flex items-center justify-center text-3xl font-black shadow-inner border-4 border-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Avatar Image URL</label>
                  <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/my-photo.jpg" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                </div>
              </div>

              {/* Standard Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., Engr. Benedict" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Email Address</label>
                  <input type="text" value={user?.email} disabled className="w-full bg-slate-100/50 text-slate-400 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">University / Institution</label>
                <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g., Polytechnic University of the Philippines" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Bio / Academic Focus</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g., 2nd Year Electronics Engineering Student" rows={3} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none" />
              </div>

              <div className="pt-6 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 px-4 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-linear-to-r from-[#1B365D] to-blue-800 text-white px-4 py-3.5 rounded-xl font-black text-sm hover:shadow-lg hover:shadow-blue-900/20 transition-all transform hover:-translate-y-0.5">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-6 md:space-y-8 animate-fade-in relative z-10">
          <div className="bg-linear-to-br from-[#1B365D] to-blue-900 text-white rounded-[2.5rem] p-8 sm:p-14 relative overflow-hidden shadow-2xl border border-white/10">
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0">
               <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-500/30 rounded-full blur-[80px]"></div>
               <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px]"></div>
            </div>
            
            <div className="max-w-2xl space-y-5 z-10 relative">
              <span className="bg-white/10 backdrop-blur-md text-blue-100 border border-white/20 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest inline-block shadow-sm">
                {user ? `Welcome Back, ${user.user_metadata?.display_name || 'Scholar'}` : 'System Online'}
              </span>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">Your Academic Center of Operations.</h1>
              <p className="text-blue-100/90 font-medium leading-relaxed text-lg sm:text-xl max-w-xl">Track retention metrics, launch your customized decks, or collaborate with fellow scholars across the campus.</p>
              <div className="pt-6 flex flex-wrap gap-4">
                <button onClick={() => setActiveTab('study-hub')} className="bg-white text-[#1B365D] font-black px-8 py-4 rounded-full hover:bg-slate-50 hover:scale-105 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-sm md:text-base w-full sm:w-auto flex items-center justify-center gap-2">
                  Open Study Hub <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: STUDY HUB */}
      {activeTab === 'study-hub' && (
        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 animate-fade-in relative z-10">
          
          {/* TECHNIQUE SELECTOR (Always visible unless deep in a mode) */}
          {activeStudyMode === 'none' && (
            <div className="mb-12 space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#1B365D] tracking-tight">🧠 Study Hub & Techniques</h2>
                <p className="text-slate-600 font-medium text-lg mt-1">Select a scientific study strategy to execute.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { id: 'active-recall', name: 'Active Recall', icon: '🔄', desc: 'Standard flashcard testing.' },
                  { id: 'feynman', name: 'Feynman Technique', icon: '🗣️', desc: 'Explain concepts simply.' },
                  { id: 'pomodoro', name: 'Pomodoro Timer', icon: '⏱️', desc: '25m focus / 5m breaks.' },
                  { id: 'blurting', name: 'Blurting Method', icon: '📝', desc: 'Brain dump from memory.' },
                ].map((tech) => (
                  <div key={tech.id} onClick={() => { setSelectedTechnique(tech.id as any); setSelectedFolder(null); }} className={`p-6 rounded-4xl border-2 cursor-pointer transition-all duration-300 ${selectedTechnique === tech.id ? 'border-[#1B365D] bg-white shadow-xl shadow-blue-900/5 transform scale-105' : 'border-white/60 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-slate-300 hover:shadow-md'}`}>
                    <div className="text-3xl mb-3">{tech.icon}</div>
                    <h4 className="font-black text-[#1B365D] text-lg">{tech.name}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POMODORO TIMER MODE (No folder required) */}
          {selectedTechnique === 'pomodoro' && activeStudyMode === 'none' ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 md:p-20 text-center shadow-2xl border border-white relative overflow-hidden animate-fade-in">
              <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${pomodoroMode === 'work' ? 'bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent'}`}></div>
              <div className="relative z-10">
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.3em] mb-8">{pomodoroMode === 'work' ? 'Deep Focus Session' : 'Rest & Recover'}</h3>
                <div className="text-8xl sm:text-[12rem] font-black text-[#1B365D] tracking-tighter tabular-nums mb-14 drop-shadow-sm">
                  {formatTime(pomodoroTime)}
                </div>
                <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                  <button onClick={togglePomodoro} className={`px-14 py-5 rounded-full font-black text-xl shadow-xl transition-all duration-300 hover:scale-105 ${pomodoroIsActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-[#1B365D] text-white hover:shadow-blue-900/30'}`}>
                    {pomodoroIsActive ? 'Pause Timer ⏸' : 'Start Focus ▶'}
                  </button>
                  <div className="flex gap-2 bg-slate-100/80 backdrop-blur-md p-2 rounded-full border border-slate-200">
                    <button onClick={() => resetPomodoro('work')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${pomodoroMode === 'work' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Work (25m)</button>
                    <button onClick={() => resetPomodoro('break')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${pomodoroMode === 'break' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Break (5m)</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ALL OTHER MODES (Require a folder) */
            <>
              {!selectedFolder && selectedTechnique !== 'pomodoro' && (
                <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 space-y-8 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div>
                      <h3 className="text-2xl font-black text-[#1B365D]">🗂️ Select a Deck to Execute Technique</h3>
                    </div>
                    <form onSubmit={handleAddFolder} className="flex gap-2 w-full sm:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                      <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="New folder name..." className="bg-transparent px-4 py-2.5 text-sm font-medium focus:outline-none w-full sm:w-64" />
                      <button type="submit" className="bg-[#1B365D] text-white px-6 py-2.5 rounded-xl font-black text-sm hover:scale-105 transition-transform shrink-0">+ Add</button>
                    </form>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {folders.map((folder) => (
                      <div key={folder.id} className="p-7 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group flex flex-col justify-between h-48 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl group-hover:bg-blue-50 transition-colors z-0"></div>
                        <div className="relative z-10">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Folder</span>
                          <h4 className="text-xl font-black text-[#1B365D] mt-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">{folder.name}</h4>
                        </div>
                        <button onClick={() => openFolder(folder)} className="text-sm font-black text-slate-600 bg-slate-50 w-full mt-4 py-3 rounded-xl hover:bg-[#1B365D] hover:text-white transition-colors relative z-10">Open Deck 📂</button>
                      </div>
                    ))}
                    {folders.length === 0 && (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-slate-400 font-bold">No decks yet. Create one above to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedFolder && activeStudyMode === 'none' && (
                /* FOLDER EDITOR BEFORE LAUNCHING TECHNIQUE */
                <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/50 space-y-8 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-2">
                    <button onClick={() => setSelectedFolder(null)} className="text-sm font-bold text-slate-500 hover:text-[#1B365D] flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-full hover:shadow-sm transition-all">← Back to Decks</button>
                    <button onClick={launchStudyMode} disabled={flashcards.length === 0} className="bg-linear-to-r from-blue-600 to-indigo-600 text-white font-black text-sm px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 w-full sm:w-auto">
                      {selectedTechnique === 'active-recall' && '🧠 Launch Active Recall'}
                      {selectedTechnique === 'feynman' && '🗣️ Launch Feynman Technique'}
                      {selectedTechnique === 'blurting' && '📝 Launch Blurting Session'}
                    </button>
                  </div>
                  
                  <div>
                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Editing Deck</span>
                    <h3 className="text-3xl md:text-4xl font-black text-[#1B365D] mt-1">{selectedFolder.name}</h3>
                  </div>
                  
                  <form onSubmit={handleAddFlashcard} className="flex flex-col gap-4 bg-slate-50/80 p-6 md:p-8 rounded-4xl border border-slate-200 relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                    <div className="relative z-10 space-y-4">
                      <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required placeholder="Concept / Question (e.g. De Morgan's Theorem)" className="w-full bg-white border border-slate-200 px-5 py-4 rounded-2xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm" />
                      <input type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required placeholder="Definition / Answer" className="w-full bg-white border border-slate-200 px-5 py-4 rounded-2xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm" />
                      <button type="submit" className="bg-[#1B365D] text-white px-8 py-4 rounded-xl font-black text-sm shadow-md mt-2 w-full md:w-auto self-end hover:scale-105 transition-transform">Add Flashcard</button>
                    </div>
                  </form>
                  
                  <div className="space-y-4 pt-6">
                    {flashcards.map((card) => (
                      <div key={card.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Question</span><p className="font-bold text-[#1B365D] text-lg">{card.question}</p></div>
                        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-1">Answer</span><p className="font-medium text-slate-700">{card.answer}</p></div>
                      </div>
                    ))}
                    {flashcards.length === 0 && <p className="text-center text-slate-400 font-bold py-10">This deck is empty. Add a card above.</p>}
                  </div>
                </div>
              )}

              {/* ---------------- ACTIVE RECALL UI ---------------- */}
              {selectedFolder && activeStudyMode === 'active-recall' && (
                <div className="max-w-3xl mx-auto animate-fade-in relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <button onClick={() => setActiveStudyMode('none')} className="text-sm font-bold text-slate-500 hover:text-red-500 bg-white/80 backdrop-blur-md border border-slate-200 px-5 py-2.5 rounded-full shadow-sm">Exit Mode</button>
                    <span className="bg-blue-100/80 backdrop-blur-md text-[#1B365D] font-black text-xs px-5 py-2.5 rounded-full border border-blue-200 shadow-sm">Card {currentCardIndex >= flashcards.length ? flashcards.length : currentCardIndex + 1} of {flashcards.length}</span>
                  </div>
                  {currentCardIndex >= flashcards.length ? (
                    <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-16 text-center shadow-2xl border border-white"><div className="text-7xl mb-6 drop-shadow-md">🏆</div><h3 className="text-4xl font-black text-[#1B365D] mb-10">Deck Completed!</h3><button onClick={() => setCurrentCardIndex(0)} className="bg-[#1B365D] text-white font-black px-10 py-5 rounded-2xl shadow-xl hover:scale-105 transition-transform text-lg">Restart Deck 🔄</button></div>
                  ) : (
                    <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] min-h-125 flex flex-col justify-center items-center p-10 md:p-16 shadow-2xl border border-white text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-50/50 pointer-events-none"></div>
                      <span className={`relative z-10 text-xs font-black uppercase tracking-[0.2em] mb-8 px-4 py-1.5 rounded-full ${isCardFlipped ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{isCardFlipped ? 'Answer' : 'Question'}</span>
                      <h2 className="relative z-10 text-4xl md:text-5xl font-black text-[#1B365D] mb-16 leading-tight drop-shadow-sm">{isCardFlipped ? flashcards[currentCardIndex].answer : flashcards[currentCardIndex].question}</h2>
                      <div className="w-full mt-auto pt-10 border-t border-slate-200/60 flex justify-center relative z-10">
                        {!isCardFlipped ? <button onClick={() => setIsCardFlipped(true)} className="bg-slate-50 text-blue-700 border border-slate-200 font-black text-lg px-12 py-5 rounded-2xl hover:bg-white hover:shadow-lg transition-all">Reveal Answer 👁️</button> : <button onClick={nextCard} className="bg-emerald-500 text-white font-black text-lg px-12 py-5 rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform">Next Card →</button>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- FEYNMAN TECHNIQUE UI ---------------- */}
              {selectedFolder && activeStudyMode === 'feynman' && (
                <div className="max-w-4xl mx-auto animate-fade-in relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <button onClick={() => setActiveStudyMode('none')} className="text-sm font-bold text-slate-500 hover:text-red-500 bg-white/80 backdrop-blur-md border border-slate-200 px-5 py-2.5 rounded-full shadow-sm">Exit Session</button>
                    <span className="bg-indigo-100/80 backdrop-blur-md text-indigo-700 font-black text-xs px-5 py-2.5 rounded-full border border-indigo-200 shadow-sm">Concept {currentCardIndex >= flashcards.length ? flashcards.length : currentCardIndex + 1} of {flashcards.length}</span>
                  </div>
                  {currentCardIndex >= flashcards.length ? (
                    <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-16 text-center shadow-2xl border border-white"><div className="text-7xl mb-6 drop-shadow-md">🎓</div><h3 className="text-4xl font-black text-[#1B365D] mb-10">Mastery Complete!</h3><button onClick={() => setCurrentCardIndex(0)} className="bg-[#1B365D] text-white font-black px-10 py-5 rounded-2xl shadow-xl hover:scale-105 transition-transform text-lg">Teach Again</button></div>
                  ) : (
                    <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white relative overflow-hidden">
                      <div className="mb-8 pb-8 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Explain this concept</span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#1B365D]">{flashcards[currentCardIndex].question}</h2>
                      </div>
                      <textarea 
                        value={feynmanInput} 
                        onChange={(e) => setFeynmanInput(e.target.value)} 
                        placeholder="Explain it simply, as if you are teaching a freshman..." 
                        className="w-full h-56 bg-slate-50/80 border border-slate-200 rounded-3xl p-6 text-slate-700 text-lg font-medium focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 resize-none mb-8 transition-all"
                      />
                      {!isCardFlipped ? (
                        <button onClick={() => setIsCardFlipped(true)} disabled={!feynmanInput.trim()} className="w-full bg-indigo-600 text-white font-black text-lg px-8 py-5 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 hover:shadow-lg transition-all">Check Understanding 🔍</button>
                      ) : (
                        <div className="animate-fade-in bg-indigo-50/80 p-8 rounded-3xl border border-indigo-100 mb-8">
                          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">Actual Answer</span>
                          <p className="font-bold text-indigo-900 text-xl leading-relaxed">{flashcards[currentCardIndex].answer}</p>
                        </div>
                      )}
                      {isCardFlipped && <button onClick={nextCard} className="w-full bg-emerald-500 text-white font-black text-lg px-8 py-5 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform">Next Concept →</button>}
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- BLURTING METHOD UI ---------------- */}
              {selectedFolder && activeStudyMode === 'blurting' && (
                <div className="max-w-5xl mx-auto animate-fade-in relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <button onClick={() => setActiveStudyMode('none')} className="text-sm font-bold text-slate-500 hover:text-red-500 bg-white/80 backdrop-blur-md border border-slate-200 px-5 py-2.5 rounded-full shadow-sm">Exit Session</button>
                    <div className={`font-black text-3xl tabular-nums bg-white/80 backdrop-blur-md px-6 py-2 rounded-2xl shadow-sm border border-slate-100 ${blurtingTimeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#1B365D]'}`}>{formatTime(blurtingTimeLeft)}</div>
                  </div>

                  {!blurtingFinished ? (
                    <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white flex flex-col">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Brain Dump</span>
                          <h3 className="text-3xl md:text-4xl font-black text-[#1B365D]">{selectedFolder.name}</h3>
                          <p className="text-slate-500 font-medium mt-2">Type everything you remember (formulas, definitions, logic steps) before time runs out!</p>
                        </div>
                        {!isBlurtingActive ? (
                          <button onClick={() => setIsBlurtingActive(true)} className="bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform shrink-0">Start Timer</button>
                        ) : (
                          <button onClick={() => { setIsBlurtingActive(false); setBlurtingFinished(true); }} className="bg-red-500 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-red-500/30 hover:scale-105 transition-transform shrink-0">Finish Early</button>
                        )}
                      </div>
                      <textarea 
                        disabled={!isBlurtingActive}
                        value={blurtingInput} 
                        onChange={(e) => setBlurtingInput(e.target.value)} 
                        placeholder={isBlurtingActive ? "Start typing rapidly here..." : "Click 'Start Timer' to begin your blurting session."} 
                        className="w-full h-125 bg-amber-50/50 border-2 border-slate-200 rounded-4xl p-8 text-slate-800 text-lg font-medium leading-relaxed focus:outline-none focus:border-amber-400 resize-none disabled:opacity-70 transition-all shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
                      {/* Left: User's Blurt */}
                      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white">
                        <h4 className="text-2xl font-black text-[#1B365D] mb-6 border-b border-slate-100 pb-4">Your Brain Dump</h4>
                        <div className="whitespace-pre-wrap text-base font-medium text-slate-700 bg-slate-50/80 p-6 rounded-3xl min-h-100 border border-slate-100">{blurtingInput || "No notes taken."}</div>
                      </div>
                      {/* Right: Actual Deck for Self-Correction */}
                      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white h-175 flex flex-col">
                        <h4 className="text-2xl font-black text-[#1B365D] mb-6 border-b border-slate-100 pb-4 flex justify-between items-center">
                          <span>Actual Deck</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full">Self-Correct Now</span>
                        </h4>
                        <div className="overflow-y-auto space-y-4 flex-1 pr-4 custom-scrollbar">
                          {flashcards.map(card => (
                            <div key={card.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                              <p className="font-black text-base text-[#1B365D] mb-2">{card.question}</p>
                              <p className="font-medium text-sm text-slate-600">{card.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* --- AUXILINK AI & COMMUNITY CHAT --- */}
      {/* (Kept exactly as previous versions for stability) */}
      {activeTab === 'auxilink-ai' && (
        <main className="max-w-4xl mx-auto px-4 md:px-6 pt-24 text-center space-y-8 animate-fade-in relative z-10">
          <div className="w-24 h-24 rounded-4xl bg-linear-to-tr from-[#1B365D] to-blue-500 text-white flex items-center justify-center text-5xl mx-auto shadow-2xl shadow-blue-900/20 transform hover:scale-110 transition-transform">🤖</div>
          <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-sm">Module In Development</span>
          <h2 className="text-5xl sm:text-6xl font-black text-[#1B365D] tracking-tight">Meet Auxilink AI</h2>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">We are replacing standard calculators with an intelligent engineering and science assistant built directly into iStud.</p>
        </main>
      )}

      {activeTab === 'community' && (
        <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-10 animate-fade-in h-[calc(100vh-140px)] md:h-auto relative z-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl flex flex-col h-full md:h-187.5 overflow-hidden">
            <div className="p-5 md:p-8 bg-linear-to-r from-[#1B365D] to-blue-900 text-white flex justify-between items-center shrink-0">
              <h3 className="text-xl md:text-2xl font-black">💬 Campus Lounge</h3>
              <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] md:text-xs px-3 md:px-4 py-1.5 rounded-full font-bold flex items-center gap-2 shadow-sm"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> Live</span>
            </div>
            <div className="flex-1 p-5 md:p-8 overflow-y-auto space-y-5 bg-slate-50/50 flex flex-col">
              {chatMessages.length === 0 ? <div className="m-auto text-center"><span className="text-5xl drop-shadow-sm">👋</span><p className="text-slate-500 font-bold mt-4 text-lg">No messages yet.</p></div> : chatMessages.map((msg) => { const isMe = user?.id === msg.user_id; return ( <div key={msg.id} className={`max-w-[85%] md:max-w-md p-4 md:p-5 rounded-3xl shadow-sm ${isMe ? 'bg-blue-50 border border-blue-100 self-end rounded-tr-sm' : 'bg-white border border-slate-100 self-start rounded-tl-sm'}`}> <div className="flex justify-between items-center mb-2 gap-2 md:gap-4"> <span className={`font-black text-[10px] md:text-xs uppercase tracking-wider ${isMe ? 'text-blue-700' : 'text-[#1B365D]'}`}>{isMe ? 'You' : msg.user_name}</span> <span className="text-[9px] md:text-[10px] font-bold text-slate-400 bg-white/50 px-2 py-0.5 rounded-md">{formatClock(msg.created_at)}</span> </div> <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed">{msg.text}</p> </div> ); })}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 md:p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0">
              <input type="text" value={newChatInput} onChange={(e) => setNewChatInput(e.target.value)} placeholder={user ? "Type your message..." : "Log in to join the conversation!"} disabled={!user} className="flex-1 bg-slate-50 px-5 md:px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 border border-slate-200 transition-all disabled:opacity-50" />
              <button type="submit" disabled={!user || !newChatInput.trim()} className="bg-[#1B365D] text-white px-6 md:px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-900 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">Send</button>
            </form>
          </div>
        </main>
      )}
    </div>
  );
}
