"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

// --- TYPES ---
interface Folder { id: string; name: string; user_id: string; }
interface Flashcard { id: string; question: string; answer: string; }
interface ChatMessage { id: string; user_id: string; user_name: string; text: string; created_at: string; }

// --- INSPIRATIONAL QUOTES ---
const INSPIRATIONAL_QUOTES = [
  "The beautiful thing about learning is that no one can take it away from you. – B.B. King",
  "Strive for progress, not perfection. – Unknown",
  "There are no secrets to success. It is the result of preparation, hard work, and learning from failure. – Colin Powell",
  "Education is the most powerful weapon which you can use to change the world. – Nelson Mandela",
  "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing. – Pele",
  "The expert in anything was once a beginner. – Helen Hayes"
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study-hub' | 'auxilink-ai' | 'community'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [dailyQuote, setDailyQuote] = useState('');
  
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
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  // --- ACTUAL STATISTICS TRACKING ---
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [studyTimeSeconds, setStudyTimeSeconds] = useState(0);

  // --- ACTIVE STUDY MODES STATE ---
  const [activeStudyMode, setActiveStudyMode] = useState<'none' | 'active-recall' | 'feynman' | 'blurting'>('none');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  
  // Multiple Choice Active Recall State
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Feynman State
  const [feynmanInput, setFeynmanInput] = useState('');
  
  // Blurting State
  const [blurtingInput, setBlurtingInput] = useState('');
  const [blurtingTimeLeft, setBlurtingTimeLeft] = useState(300); // 5 minutes
  const [isBlurtingActive, setIsBlurtingActive] = useState(false);
  const [blurtingFinished, setBlurtingFinished] = useState(false);

  // Pomodoro State
  const [selectedWorkTime, setSelectedWorkTime] = useState(1500); 
  const [selectedBreakTime, setSelectedBreakTime] = useState(300);
  const [pomodoroTime, setPomodoroTime] = useState(1500); 
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatInput, setNewChatInput] = useState('');

  // --- UI COLORS ARRAY FOR DECKS ---
  const deckColors = ['bg-red-600', 'bg-green-500', 'bg-blue-600', 'bg-yellow-400', 'bg-purple-500', 'bg-teal-400'];
  const getDeckColor = (idx: number) => deckColors[idx % deckColors.length];

  // --- INITIALIZE & REALTIME ---
  useEffect(() => {
    // Set random quote on mount
    setDailyQuote(INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)]);

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user?.user_metadata) {
        if (user.user_metadata.display_name) setDisplayName(user.user_metadata.display_name);
        if (user.user_metadata.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
        if (user.user_metadata.university) setUniversity(user.user_metadata.university);
        if (user.user_metadata.bio) setBio(user.user_metadata.bio);
      }

      if (user) {
        // Load stats from local storage based on user ID
        const savedStats = localStorage.getItem(`istud_stats_${user.id}`);
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          setCardsReviewed(parsed.cardsReviewed || 0);
          setCorrectAnswers(parsed.correctAnswers || 0);
          setStudyTimeSeconds(parsed.studyTimeSeconds || 0);
        }

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

  // --- STATS PERSISTENCE EFFECT ---
  useEffect(() => {
    if (user) {
      localStorage.setItem(`istud_stats_${user.id}`, JSON.stringify({
        cardsReviewed,
        correctAnswers,
        studyTimeSeconds
      }));
    }
  }, [cardsReviewed, correctAnswers, studyTimeSeconds, user]);

  // --- STUDY TIME TRACKER EFFECT ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Track time if a study mode is active or the pomodoro timer is running
    if (activeStudyMode !== 'none' || pomodoroIsActive) {
      timer = setInterval(() => {
        setStudyTimeSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeStudyMode, pomodoroIsActive]);

  // --- POMODORO TIMERS EFFECT ---
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
    setUser(null); setFolders([]); setIsSettingsOpen(false);
    setCardsReviewed(0); setCorrectAnswers(0); setStudyTimeSeconds(0);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase.auth.updateUser({ 
      data: { display_name: displayName, avatar_url: avatarUrl, university: university, bio: bio } 
    });
    if (error) alert("Error updating profile: " + error.message);
    else { setUser(data.user); setIsSettingsOpen(false); }
  };

  const openFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    setActiveTab('dashboard'); // Keeps us in the main content area viewing the deck
    setActiveStudyMode('none');
    const { data } = await supabase.from('flashcards').select('*').eq('folder_id', folder.id).order('created_at', { ascending: false });
    if (data) setFlashcards(data);
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return alert("Please log in first!");
    const { data, error } = await supabase.from('folders').insert([{ name: newFolderName, user_id: user.id }]).select();
    if (error) return alert(error.message);
    if (data) { 
      setFolders([data[0], ...folders]); 
      setNewFolderName(''); 
      setIsAddingFolder(false); 
    }
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
    await supabase.from('community_messages').insert([{ user_id: user.id, user_name: senderName, text: messageToSend }]);
  };

  // --- STATISTICAL HANDLERS & HELPERS ---
  const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);
  
  const setupActiveRecallCard = (index: number) => {
    if (flashcards.length === 0) return;
    const correctOption = flashcards[index].answer;
    let wrongOptions = flashcards.filter((_, i) => i !== index).map(c => c.answer);
    wrongOptions = shuffleArray(wrongOptions).slice(0, 3); 
    setCurrentOptions(shuffleArray([correctOption, ...wrongOptions]));
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
  };

  const handleCheckAnswer = () => {
    setIsAnswerChecked(true);
    const isCorrect = selectedAnswer === flashcards[currentCardIndex].answer;
    
    // Update Stats
    setCardsReviewed(prev => prev + 1);
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleFeynmanCheck = () => {
    setIsCardFlipped(true);
    // Count Feynman interactions as reviews, grading it as correct for stats balance
    setCardsReviewed(prev => prev + 1);
    setCorrectAnswers(prev => prev + 1); 
  };

  const launchStudyMode = () => {
    if (flashcards.length === 0) return alert("Add some cards first!");
    setActiveStudyMode(selectedTechnique as 'active-recall' | 'feynman' | 'blurting');
    setCurrentCardIndex(0); setIsCardFlipped(false);
    if (selectedTechnique === 'active-recall') setupActiveRecallCard(0);
    setFeynmanInput(''); setBlurtingInput(''); setBlurtingTimeLeft(300);
    setIsBlurtingActive(selectedTechnique === 'blurting'); setBlurtingFinished(false);
  };

  const nextCard = () => {
    setIsCardFlipped(false); setFeynmanInput('');
    const nextIdx = currentCardIndex + 1;
    setCurrentCardIndex(nextIdx);
    if (activeStudyMode === 'active-recall' && nextIdx < flashcards.length) setupActiveRecallCard(nextIdx);
  };

  // Formatters for the Stats UI
  const getRetentionAccuracy = () => {
    if (cardsReviewed === 0) return 0;
    return Math.round((correctAnswers / cardsReviewed) * 100);
  };

  const getFormattedStudyTime = () => {
    if (studyTimeSeconds < 60) return `${studyTimeSeconds} sec`;
    const mins = Math.floor(studyTimeSeconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} hrs`;
  };

  // ---------------- UI RENDER ----------------
  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-slate-200 h-full fixed left-0 top-0 z-40 overflow-y-auto custom-scrollbar">
        {/* Logo Area */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }}>
            <div className="text-3xl font-black tracking-tighter text-[#0F172A]">
              iSt<span className="text-blue-600">u</span>d
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="px-4 py-2 flex flex-col gap-1">
          <button onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === 'dashboard' && !selectedFolder ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="text-lg">🏠</span> Home
          </button>
          <button onClick={() => setActiveTab('auxilink-ai')} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === 'auxilink-ai' ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="text-lg">🤖</span> Auxilink AI
          </button>
          <button onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === 'dashboard' && selectedFolder ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="text-lg">📁</span> My decks
          </button>
          <button onClick={() => setActiveTab('community')} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === 'community' ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="text-lg">🌍</span> Community Chat
          </button>
          
          {user ? (
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors text-slate-600 hover:bg-slate-50 relative mt-1">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">{user.email?.charAt(0).toUpperCase()}</div>
              )}
              Profile
              <span className="absolute right-4 top-2.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">30</span>
            </button>
          ) : (
            <Link href="/login" className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm text-blue-600 hover:bg-blue-50 mt-1">
              🔑 Sign In
            </Link>
          )}
        </nav>

        {/* Primary Actions */}
        <div className="px-4 py-4 flex flex-col gap-2 border-b border-slate-100">
          <button onClick={() => { if(selectedFolder) launchStudyMode(); else alert('Select a deck first!'); }} className="w-full bg-[#0F172A] text-white font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            🎮 Study
          </button>
          <button onClick={() => setIsAddingFolder(!isAddingFolder)} className="w-full bg-white border border-slate-200 text-[#0F172A] font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
            ＋ Add
          </button>
        </div>

        {/* Dynamic Folders List in Sidebar */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-3 px-2">
            <h4 className="text-sm font-bold text-[#0F172A]">My decks</h4>
            <span onClick={() => setIsAddingFolder(true)} className="text-lg cursor-pointer text-slate-400 hover:text-slate-700">＋</span>
          </div>
          <div className="flex flex-col gap-1">
            {folders.map((folder, idx) => (
              <button key={folder.id} onClick={() => openFolder(folder)} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 w-full text-left group">
                <span className="text-slate-400 group-hover:text-slate-600 text-xs">›</span>
                <span className={`w-3 h-3 rounded-sm ${getDeckColor(idx)}`}></span>
                <span className="text-sm font-semibold text-slate-700 truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {user && (
          <div className="p-4 border-t border-slate-100">
            <button onClick={handleSignOut} className="text-xs font-bold text-slate-400 hover:text-red-500 w-full text-left px-2">Sign out</button>
          </div>
        )}
      </aside>

      {/* --- MOBILE NAV --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-2 flex justify-around items-center">
        {[{ id: 'dashboard', icon: '🏠', label: 'Home' }, { id: 'dashboard', icon: '📁', label: 'Decks', action: () => setSelectedFolder(null) }, { id: 'auxilink-ai', icon: '🤖', label: 'AI' }, { id: 'community', icon: '🌍', label: 'Chat' }].map((tab, i) => (
          <button key={i} onClick={() => { setActiveTab(tab.id as any); if(tab.action) tab.action(); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === tab.id ? 'text-[#0F172A]' : 'text-slate-400 grayscale opacity-70'}`}>
            <span className="text-xl">{tab.icon}</span><span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-[260px] h-screen overflow-y-auto pb-24 md:pb-8 relative">
        
        {/* VIEW 1: HOME / DASHBOARD */}
        {activeTab === 'dashboard' && !selectedFolder && (
          <div className="max-w-5xl mx-auto px-6 py-8 md:py-12 animate-fade-in space-y-10">
            
            {/* Header: Greeting, Quote, and Streak */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="flex-1 z-10">
                <h2 className="text-3xl font-black text-[#0F172A] mb-3">
                  {user ? `Welcome back, ${displayName || user.email?.split('@')[0]}! 👋` : 'Welcome to iStud! 👋'}
                </h2>
                <p className="text-slate-600 font-medium italic text-lg border-l-4 border-blue-500 pl-4 py-1">
                  "{dailyQuote}"
                </p>
              </div>

              {/* Active Streak Widget */}
              <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 p-5 rounded-3xl shrink-0 shadow-inner z-10 w-full md:w-auto justify-center md:justify-start">
                <div className="text-5xl drop-shadow-sm">🔥</div>
                <div>
                  <p className="text-[10px] font-extrabold text-orange-800 uppercase tracking-widest mb-1">Active Streak</p>
                  <p className="text-2xl font-black text-orange-600">3 Days</p>
                </div>
              </div>
            </div>

            {/* Learning Progress Stats (Now Dynamic) */}
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0F172A] mb-5">Learning Progress</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><span className="text-lg">📚</span> Cards Reviewed</h4>
                  <p className="text-3xl font-black text-[#0F172A]">{cardsReviewed}</p>
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><span className="text-lg">🎯</span> Retention Accuracy</h4>
                  <p className={`text-3xl font-black ${getRetentionAccuracy() > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {getRetentionAccuracy()}%
                  </p>
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><span className="text-lg">⏱️</span> Total Study Time</h4>
                  <p className="text-3xl font-black text-blue-600">{getFormattedStudyTime()}</p>
                </div>
              </div>
            </div>

            {/* My Decks Section (Database Only) */}
            <div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg md:text-xl font-extrabold text-[#0F172A]">My decks</h2>
                <button onClick={() => setIsAddingFolder(!isAddingFolder)} className="text-2xl text-[#0F172A] hover:scale-110 transition-transform">＋</button>
              </div>

              {/* Add Folder Input (Toggled) */}
              {isAddingFolder && (
                <form onSubmit={handleAddFolder} className="mb-6 flex gap-3 animate-fade-in">
                  <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name your new deck..." className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 shadow-sm" autoFocus />
                  <button type="submit" className="bg-[#0F172A] text-white px-6 rounded-xl font-bold text-sm shadow-sm">Create</button>
                </form>
              )}

              {/* Vertical Stack of My Decks */}
              <div className="flex flex-col gap-4">
                {folders.length === 0 ? (
                   <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-500 font-bold">
                     No decks created yet. Click the + above to start studying!
                   </div>
                ) : (
                  folders.map((folder, idx) => (
                    <div key={folder.id} onClick={() => openFolder(folder)} className="bg-white rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden p-5 pl-7 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group flex justify-between items-center">
                      <div className={`absolute left-0 top-0 bottom-0 w-3 ${getDeckColor(idx)}`}></div>
                      <div>
                        <h3 className="font-bold text-[#0F172A] text-base group-hover:text-blue-600 transition-colors">{folder.name}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Custom Deck</p>
                      </div>
                      <span className="text-slate-300 group-hover:text-slate-500 font-bold text-xl transition-colors">→</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: STUDY HUB / FOLDER EDITOR (When a deck is clicked) */}
        {activeTab === 'dashboard' && selectedFolder && activeStudyMode === 'none' && (
          <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 animate-fade-in">
             <button onClick={() => setSelectedFolder(null)} className="text-sm font-bold text-slate-500 hover:text-[#0F172A] flex items-center gap-2 mb-6">← Back to My Decks</button>
             
             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                  <div>
                    <h2 className="text-3xl font-black text-[#0F172A]">{selectedFolder.name}</h2>
                    <p className="text-slate-500 font-medium mt-1">{flashcards.length} cards in this deck</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <select onChange={(e) => setSelectedTechnique(e.target.value as any)} value={selectedTechnique} className="bg-slate-50 border border-slate-200 text-[#0F172A] font-bold text-sm px-4 py-3 rounded-xl outline-none focus:border-blue-400">
                      <option value="active-recall">Active Recall</option>
                      <option value="feynman">Feynman Technique</option>
                      <option value="blurting">Blurting Method</option>
                    </select>
                    <button onClick={launchStudyMode} disabled={flashcards.length === 0} className="bg-[#0F172A] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 flex-1 md:flex-none">
                      Launch 🚀
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddFlashcard} className="flex flex-col md:flex-row gap-3">
                   <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required placeholder="Front (Term / Concept)" className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white" />
                   <input type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required placeholder="Back (Definition)" className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white" />
                   <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 w-full md:w-auto">Add Card</button>
                </form>
             </div>

             <div className="space-y-3">
                <h4 className="font-extrabold text-[#0F172A] px-2 mb-4">Cards in this deck</h4>
                {flashcards.map((card) => (
                  <div key={card.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 pb-4 sm:pb-0 sm:border-r border-slate-100 sm:pr-4">
                      <p className="font-bold text-[#0F172A]">{card.question}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-600">{card.answer}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* ACTIVE RECALL UI */}
        {selectedFolder && activeStudyMode === 'active-recall' && (
          <div className="max-w-3xl mx-auto px-6 py-12 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => setActiveStudyMode('none')} className="text-sm font-bold text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-5 py-2.5 rounded-full shadow-sm">Exit Study</button>
              <span className="font-bold text-sm text-slate-400">{currentCardIndex + 1} / {flashcards.length}</span>
            </div>
            
            {currentCardIndex >= flashcards.length ? (
              <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-200">
                <div className="text-6xl mb-6">🏆</div>
                <h3 className="text-3xl font-black text-[#0F172A] mb-8">Deck Completed!</h3>
                <button onClick={() => { setCurrentCardIndex(0); setupActiveRecallCard(0); }} className="bg-[#0F172A] text-white font-bold px-8 py-4 rounded-xl shadow-md hover:bg-slate-800">Restart Study</button>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200">
                <div className="mb-10 text-center">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] leading-tight">
                    {flashcards[currentCardIndex].question}
                  </h2>
                </div>
                
                <div className="flex flex-col gap-3 mb-8">
                  {currentOptions.map((opt, idx) => {
                    const labels = ['A', 'B', 'C', 'D'];
                    let btnClass = "flex items-center gap-4 p-3 md:p-4 rounded-2xl border-2 font-bold text-left transition-all text-base w-full ";
                    let labelClass = "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black transition-colors ";
                    
                    if (!isAnswerChecked) {
                      if (selectedAnswer === opt) {
                        btnClass += "border-[#0F172A] bg-slate-50 text-[#0F172A]";
                        labelClass += "bg-[#0F172A] text-white";
                      } else {
                        btnClass += "border-slate-200 bg-white text-slate-600 hover:border-slate-300";
                        labelClass += "bg-slate-100 text-slate-500";
                      }
                    } else {
                      if (opt === flashcards[currentCardIndex].answer) {
                        btnClass += "border-green-500 bg-green-50 text-green-700";
                        labelClass += "bg-green-500 text-white";
                      } else if (selectedAnswer === opt) {
                        btnClass += "border-red-500 bg-red-50 text-red-700";
                        labelClass += "bg-red-500 text-white";
                      } else {
                        btnClass += "border-slate-100 bg-slate-50 text-slate-400 opacity-60";
                        labelClass += "bg-slate-100 text-slate-400";
                      }
                    }

                    return (
                      <button key={idx} disabled={isAnswerChecked} onClick={() => setSelectedAnswer(opt)} className={btnClass}>
                        <span className={labelClass}>{labels[idx]}</span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-6 flex justify-center">
                  {!isAnswerChecked ? (
                    <button onClick={handleCheckAnswer} disabled={!selectedAnswer} className="w-full md:w-auto bg-blue-600 text-white font-bold px-12 py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                      Check Answer
                    </button>
                  ) : (
                    <button onClick={nextCard} className="w-full md:w-auto bg-[#0F172A] text-white font-bold px-12 py-4 rounded-xl hover:bg-slate-800">
                      Next Question →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEYNMAN TECHNIQUE UI */}
        {selectedFolder && activeStudyMode === 'feynman' && (
          <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in relative z-10">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => setActiveStudyMode('none')} className="text-sm font-bold text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-5 py-2.5 rounded-full shadow-sm">Exit Session</button>
              <span className="font-bold text-sm text-slate-400">{currentCardIndex + 1} / {flashcards.length}</span>
            </div>
            {currentCardIndex >= flashcards.length ? (
              <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-200">
                <div className="text-6xl mb-6 drop-shadow-md">🎓</div>
                <h3 className="text-3xl font-black text-[#0F172A] mb-8">Mastery Complete!</h3>
                <button onClick={() => setCurrentCardIndex(0)} className="bg-[#0F172A] text-white font-bold px-8 py-4 rounded-xl shadow-md hover:bg-slate-800 text-lg">Teach Again</button>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Explain this concept</span>
                  <h2 className="text-3xl md:text-4xl font-black text-[#0F172A]">{flashcards[currentCardIndex].question}</h2>
                </div>
                <textarea 
                  value={feynmanInput} 
                  onChange={(e) => setFeynmanInput(e.target.value)} 
                  placeholder="Explain it simply, as if you are teaching a freshman..." 
                  className="w-full h-56 bg-slate-50/80 border border-slate-200 rounded-3xl p-6 text-slate-700 text-lg font-medium focus:outline-none focus:border-indigo-400 focus:bg-white resize-none mb-8 transition-all"
                />
                {!isCardFlipped ? (
                  <button onClick={handleFeynmanCheck} disabled={!feynmanInput.trim()} className="w-full bg-indigo-600 text-white font-bold text-lg px-8 py-5 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all">Check Understanding 🔍</button>
                ) : (
                  <div className="animate-fade-in bg-indigo-50 p-8 rounded-3xl border border-indigo-100 mb-8">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">Actual Answer</span>
                    <p className="font-bold text-indigo-900 text-xl leading-relaxed">{flashcards[currentCardIndex].answer}</p>
                  </div>
                )}
                {isCardFlipped && <button onClick={nextCard} className="w-full bg-[#0F172A] text-white font-bold text-lg px-8 py-5 rounded-2xl hover:bg-slate-800 transition-colors">Next Concept →</button>}
              </div>
            )}
          </div>
        )}

        {/* --- AUXILINK AI & COMMUNITY CHAT --- */}
        {activeTab === 'auxilink-ai' && (
          <div className="max-w-3xl mx-auto px-6 py-24 text-center animate-fade-in">
            <div className="text-6xl mb-6 drop-shadow-md">🤖</div>
            <h2 className="text-4xl font-black text-[#0F172A] mb-4">Auxilink AI Module</h2>
            <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">This intelligent engineering assistant is currently under development for iStud.</p>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 animate-fade-in h-full flex flex-col pb-20">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[600px]">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-[#0F172A]">Campus Lounge</h3>
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live</span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F8FAFC]">
                {chatMessages.length === 0 ? <p className="text-center text-slate-400 font-bold mt-10">No messages yet.</p> : chatMessages.map((msg) => { const isMe = user?.id === msg.user_id; return ( <div key={msg.id} className={`max-w-[85%] md:max-w-md p-4 rounded-2xl shadow-sm ${isMe ? 'bg-[#0F172A] text-white self-end rounded-tr-sm ml-auto' : 'bg-white border border-slate-200 text-[#0F172A] self-start rounded-tl-sm'}`}> <div className="flex justify-between items-center mb-1 gap-4"> <span className={`font-bold text-[10px] uppercase tracking-wider ${isMe ? 'text-slate-300' : 'text-slate-500'}`}>{isMe ? 'You' : msg.user_name}</span> </div> <p className="text-sm font-medium leading-relaxed">{msg.text}</p> </div> ); })}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input type="text" value={newChatInput} onChange={(e) => setNewChatInput(e.target.value)} placeholder={user ? "Type a message..." : "Log in to chat!"} disabled={!user} className="flex-1 bg-slate-50 px-5 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-400 border border-slate-200 disabled:opacity-50" />
                <button type="submit" disabled={!user || !newChatInput.trim()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Send</button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* PROFILE SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-[#0F172A]">Profile Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">University</label>
                <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500" />
              </div>
              <div className="pt-4 flex gap-2">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 bg-[#0F172A] text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
