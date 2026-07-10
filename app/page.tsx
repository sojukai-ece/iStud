"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

// --- TYPES ---
interface Folder { id: string; name: string; user_id: string; }
interface Flashcard { id: string; question: string; answer: string; }
interface ChatMessage { id: string; user_id: string; user_name: string; text: string; created_at: string; }
interface Task { id: string; text: string; completed: boolean; }

// --- INSPIRATIONAL QUOTES ---
const INSPIRATIONAL_QUOTES = [
  "The beautiful thing about learning is that no one can take it away from you. – B.B. King",
  "Strive for progress, not perfection. – Unknown",
  "There are no secrets to success. It is the result of preparation, hard work, and learning from failure. – Colin Powell",
  "Engineering is not only study of 45 subjects but it is moral studies of intellectual life. – Prakhar Srivastav",
  "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing. – Pele",
  "The expert in anything was once a beginner. – Helen Hayes"
];

// --- SVG ICONS ---
const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Focus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>,
  Decks: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
  AI: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
  Chat: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'decks' | 'focus-hub' | 'auxilink-ai' | 'community'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [dailyQuote, setDailyQuote] = useState('');
  
  // --- PROFILE SETTINGS STATE ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');

  // --- STUDY HUB CORE STATE ---
  const [selectedTechnique, setSelectedTechnique] = useState<'active-recall' | 'feynman' | 'blurting'>('active-recall');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  // --- ACTUAL STATISTICS & GAMIFICATION ---
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [studyTimeSeconds, setStudyTimeSeconds] = useState(0);
  const [activeStreak, setActiveStreak] = useState(1);

  // --- ACTIVE STUDY MODES STATE ---
  const [activeStudyMode, setActiveStudyMode] = useState<'none' | 'active-recall' | 'feynman' | 'blurting'>('none');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  
  // Multiple Choice Active Recall State
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Feynman & Blurting State
  const [feynmanInput, setFeynmanInput] = useState('');
  const [blurtingInput, setBlurtingInput] = useState('');
  const [blurtingTimeLeft, setBlurtingTimeLeft] = useState(300); 
  const [isBlurtingActive, setIsBlurtingActive] = useState(false);
  const [blurtingFinished, setBlurtingFinished] = useState(false);

  // --- FOCUS HUB ---
  const [selectedWorkTime, setSelectedWorkTime] = useState(1500); 
  const [selectedBreakTime, setSelectedBreakTime] = useState(300); 
  const [pomodoroTime, setPomodoroTime] = useState(1500); 
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatInput, setNewChatInput] = useState('');

  // --- UI COLORS ARRAY FOR DECKS ---
  const deckColors = ['bg-red-600', 'bg-green-500', 'bg-blue-600', 'bg-yellow-400', 'bg-purple-500', 'bg-teal-400'];
  const getDeckColor = (idx: number) => deckColors[idx % deckColors.length];

  // --- INITIALIZE & REALTIME ---
  useEffect(() => {
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
        const savedStats = localStorage.getItem(`istud_stats_${user.id}`);
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          setCardsReviewed(parsed.cardsReviewed || 0);
          setCorrectAnswers(parsed.correctAnswers || 0);
          setStudyTimeSeconds(parsed.studyTimeSeconds || 0);
        }
        
        const savedTasks = localStorage.getItem(`istud_tasks_${user.id}`);
        if (savedTasks) setTasks(JSON.parse(savedTasks));

        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem(`istud_lastlogin_${user.id}`);
        let currentStreak = parseInt(localStorage.getItem(`istud_streak_${user.id}`) || '1');

        if (lastLogin) {
          const lastDate = new Date(lastLogin);
          const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) currentStreak += 1; 
          else if (diffDays > 1) currentStreak = 1; 
        }
        
        setActiveStreak(currentStreak);
        localStorage.setItem(`istud_lastlogin_${user.id}`, today);
        localStorage.setItem(`istud_streak_${user.id}`, currentStreak.toString());

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

  // --- STATS & TASKS PERSISTENCE EFFECT ---
  useEffect(() => {
    if (user) {
      localStorage.setItem(`istud_stats_${user.id}`, JSON.stringify({ cardsReviewed, correctAnswers, studyTimeSeconds }));
      localStorage.setItem(`istud_tasks_${user.id}`, JSON.stringify(tasks));
    }
  }, [cardsReviewed, correctAnswers, studyTimeSeconds, tasks, user]);

  // --- STUDY TIME TRACKER EFFECT ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeStudyMode !== 'none' || pomodoroIsActive) {
      timer = setInterval(() => { setStudyTimeSeconds(prev => prev + 1); }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeStudyMode, pomodoroIsActive]);

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

  // --- DATABASE & ACTIONS ---
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setFolders([]); setIsSettingsOpen(false);
    setCardsReviewed(0); setCorrectAnswers(0); setStudyTimeSeconds(0); setTasks([]);
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
    setActiveTab('decks'); 
    setActiveStudyMode('none');
    const { data } = await supabase.from('flashcards').select('*').eq('folder_id', folder.id).order('created_at', { ascending: false });
    if (data) setFlashcards(data);
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return alert("Please log in first!");
    const { data, error } = await supabase.from('folders').insert([{ name: newFolderName, user_id: user.id }]).select();
    if (error) return alert(error.message);
    if (data) { setFolders([data[0], ...folders]); setNewFolderName(''); setIsAddingFolder(false); }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) return;
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) return alert(error.message);
    setFolders(folders.filter(f => f.id !== id));
    if (selectedFolder?.id === id) setSelectedFolder(null);
  };

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim() || !selectedFolder || !user) return;
    const { data, error } = await supabase.from('flashcards').insert([{ folder_id: selectedFolder.id, user_id: user.id, question: newQuestion, answer: newAnswer }]).select();
    if (error) return alert(error.message);
    if (data) { setFlashcards([data[0], ...flashcards]); setNewQuestion(''); setNewAnswer(''); }
  };

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) return alert(error.message);
    setFlashcards(flashcards.filter(c => c.id !== id));
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

  // --- TASKS HUB ACTIONS ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks([{ id: Date.now().toString(), text: newTaskInput, completed: false }, ...tasks]);
    setNewTaskInput('');
  };
  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleWorkTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setSelectedWorkTime(val);
    if (pomodoroMode === 'work' && !pomodoroIsActive) setPomodoroTime(val);
  };
  
  const handleBreakTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setSelectedBreakTime(val);
    if (pomodoroMode === 'break' && !pomodoroIsActive) setPomodoroTime(val);
  };

  // --- STATISTICAL HANDLERS & HELPERS ---
  const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);
  
  const setupActiveRecallCard = (index: number) => {
    if (flashcards.length === 0) return;
    const correctOption = flashcards[index].answer;
    let wrongOptions = flashcards.filter((_, i) => i !== index).map(c => c.answer);
    wrongOptions = shuffleArray(wrongOptions).slice(0, 3); 
    setCurrentOptions(shuffleArray([correctOption, ...wrongOptions]));
    setSelectedAnswer(null); setIsAnswerChecked(false);
  };

  const handleCheckAnswer = () => {
    setIsAnswerChecked(true);
    const isCorrect = selectedAnswer === flashcards[currentCardIndex].answer;
    setCardsReviewed(prev => prev + 1);
    if (isCorrect) setCorrectAnswers(prev => prev + 1);
  };

  const handleFeynmanCheck = () => {
    setIsCardFlipped(true);
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

  const getAcademicRank = () => {
    const hrs = studyTimeSeconds / 3600;
    if (hrs < 1) return { title: 'Novice Scholar', icon: '🌱', color: 'text-green-600', bg: 'bg-green-50' };
    if (hrs < 5) return { title: 'Adept Student', icon: '📘', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (hrs < 20) return { title: 'Dedicated Engineer', icon: '⚙️', color: 'text-indigo-600', bg: 'bg-indigo-50' };
    return { title: 'Master Polymath', icon: '👑', color: 'text-purple-600', bg: 'bg-purple-50' };
  };

  const formatClock = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ---------------- UI RENDER ----------------
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      
      {/* --- MOBILE TOP HEADER --- */}
      <div className="md:hidden flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 py-4 shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }}>
          <div className="text-2xl font-black tracking-tighter text-[#0F172A]">
            iSt<span className="text-blue-600">u</span>d
          </div>
        </div>
        {user ? (
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center active:scale-95 transition-transform">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold border border-slate-200 shadow-sm">{user.email?.charAt(0).toUpperCase()}</div>
            )}
          </button>
        ) : (
           <Link href="/login" className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">Sign In</Link>
        )}
      </div>

      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-slate-200 h-full fixed left-0 top-0 z-40 overflow-y-auto custom-scrollbar">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }}>
            <div className="text-3xl font-black tracking-tighter text-[#0F172A]">
              iSt<span className="text-blue-600">u</span>d
            </div>
          </div>
        </div>

        <nav className="px-4 py-2 flex flex-col gap-2">
          <button onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'dashboard' ? 'text-blue-600' : ''}><Icons.Home /></span> Home
          </button>
          <button onClick={() => { setActiveTab('focus-hub'); setSelectedFolder(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'focus-hub' ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'focus-hub' ? 'text-blue-600' : ''}><Icons.Focus /></span> Focus Hub
          </button>
          <button onClick={() => { setActiveTab('decks'); setSelectedFolder(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'decks' ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'decks' ? 'text-blue-600' : ''}><Icons.Decks /></span> My Decks
          </button>
          <button onClick={() => setActiveTab('auxilink-ai')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'auxilink-ai' ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'auxilink-ai' ? 'text-blue-600' : ''}><Icons.AI /></span> Auxilink AI
          </button>
          <button onClick={() => setActiveTab('community')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'community' ? 'bg-slate-100 text-[#0F172A]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'community' ? 'text-blue-600' : ''}><Icons.Chat /></span> Community Chat
          </button>
          
          {user ? (
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors text-slate-500 hover:bg-slate-50 hover:text-slate-800 relative mt-2 border border-slate-100">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold">{user.email?.charAt(0).toUpperCase()}</div>
              )}
              Profile
              <span className="absolute right-4 top-3.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{activeStreak}🔥</span>
            </button>
          ) : (
            <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-blue-600 hover:bg-blue-50 mt-2">
              Sign In
            </Link>
          )}
        </nav>

        <div className="px-4 py-6 mt-auto border-t border-slate-100 flex flex-col gap-3">
          <button onClick={() => { if(selectedFolder) launchStudyMode(); else alert('Select a deck first!'); }} className="w-full bg-[#0F172A] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm">
            Study Now
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAV (Bottom Native Style) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 px-4 py-2 flex justify-between items-center pb-safe">
        {[
          { id: 'dashboard', icon: <Icons.Home />, label: 'Home' }, 
          { id: 'focus-hub', icon: <Icons.Focus />, label: 'Focus' }, 
          { id: 'decks', icon: <Icons.Decks />, label: 'Decks', action: () => setSelectedFolder(null) }, 
          { id: 'auxilink-ai', icon: <Icons.AI />, label: 'AI' }, 
          { id: 'community', icon: <Icons.Chat />, label: 'Chat' }
        ].map((tab, i) => (
          <button key={i} onClick={() => { setActiveTab(tab.id as any); if(tab.action) tab.action(); }} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all flex-1 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <div className={`${activeTab === tab.id ? 'scale-110 transition-transform' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[9px] font-bold ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-500'}`}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      {/* Note: pb-28 ensures content isn't hidden behind the mobile nav bar */}
      <main className="flex-1 md:ml-[260px] h-full overflow-y-auto pb-28 md:pb-8 relative">
        
        {/* VIEW 1: HOME / DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in space-y-6 md:space-y-10">
            
            <div className="bg-white rounded-3xl md:rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-6 md:gap-8 items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="flex-1 z-10 w-full">
                <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-2 md:mb-3">
                  {user ? `Welcome back, ${displayName || user.email?.split('@')[0]}! 👋` : 'Welcome to iStud! 👋'}
                </h2>
                <p className="text-slate-500 font-medium italic text-sm md:text-lg border-l-4 border-blue-500 pl-3 md:pl-4 py-1">
                  "{dailyQuote}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 md:gap-4 z-10">
                <div className="flex flex-1 items-center gap-4 bg-orange-50 border border-orange-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-inner justify-center sm:justify-start">
                  <div className="text-3xl md:text-4xl drop-shadow-sm">🔥</div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-extrabold text-orange-800 uppercase tracking-widest mb-0.5 md:mb-1">Active Streak</p>
                    <p className="text-lg md:text-xl font-black text-orange-600">{activeStreak} {activeStreak === 1 ? 'Day' : 'Days'}</p>
                  </div>
                </div>
                <div className={`flex flex-1 items-center gap-4 ${getAcademicRank().bg} border border-slate-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-inner justify-center sm:justify-start`}>
                  <div className="text-3xl md:text-4xl drop-shadow-sm">{getAcademicRank().icon}</div>
                  <div>
                    <p className={`text-[9px] md:text-[10px] font-extrabold ${getAcademicRank().color} opacity-80 uppercase tracking-widest mb-0.5 md:mb-1`}>Current Rank</p>
                    <p className={`text-lg md:text-xl font-black ${getAcademicRank().color} leading-tight`}>{getAcademicRank().title}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0F172A] mb-4 md:mb-5">Learning Progress</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
                <div className="bg-white p-5 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <h4 className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><span className="text-base md:text-lg">📚</span> Cards Reviewed</h4>
                  <p className="text-2xl md:text-3xl font-black text-[#0F172A]">{cardsReviewed}</p>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <h4 className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><span className="text-base md:text-lg">🎯</span> Retention Accuracy</h4>
                  <p className={`text-2xl md:text-3xl font-black ${getRetentionAccuracy() > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {getRetentionAccuracy()}%
                  </p>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <h4 className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><span className="text-base md:text-lg">⏱️</span> Total Study Time</h4>
                  <p className="text-2xl md:text-3xl font-black text-blue-600">{getFormattedStudyTime()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1.5: DECKS TAB */}
        {activeTab === 'decks' && !selectedFolder && (
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">My Library</h2>
              <button onClick={() => setIsAddingFolder(!isAddingFolder)} className="bg-[#0F172A] text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:bg-slate-800 transition-colors">＋ New Deck</button>
            </div>

            {isAddingFolder && (
              <form onSubmit={handleAddFolder} className="mb-6 flex flex-col sm:flex-row gap-2 md:gap-3 animate-fade-in">
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name your new deck..." className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 shadow-sm w-full" autoFocus />
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm w-full sm:w-auto hover:bg-blue-700">Create</button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {folders.length === 0 ? (
                  <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl md:rounded-3xl p-8 md:p-10 text-center text-slate-500 font-bold text-sm md:text-base">
                    No decks created yet. Click the + above to start studying!
                  </div>
              ) : (
                folders.map((folder, idx) => (
                  <div key={folder.id} onClick={() => openFolder(folder)} className="bg-white rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden p-5 md:p-6 pl-7 md:pl-8 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all group flex flex-col justify-between min-h-[120px]">
                    <div className={`absolute left-0 top-0 bottom-0 w-2.5 md:w-3 ${getDeckColor(idx)}`}></div>
                    <div className="mb-4 pr-2">
                      <h3 className="font-black text-[#0F172A] text-base md:text-lg group-hover:text-blue-600 transition-colors line-clamp-2">{folder.name}</h3>
                      <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Custom Deck</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto border-t border-slate-50 pt-3 md:pt-4">
                      <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Ready to study</span>
                      <span className="text-slate-300 group-hover:text-blue-500 font-bold text-lg md:text-xl transition-colors">→</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: STUDY HUB / FOLDER EDITOR */}
        {activeTab === 'decks' && selectedFolder && activeStudyMode === 'none' && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in">
             <button onClick={() => setSelectedFolder(null)} className="text-xs md:text-sm font-bold text-slate-500 hover:text-[#0F172A] flex items-center gap-2 mb-4 md:mb-6">← Back to Library</button>
             
             <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm mb-6 md:mb-8 relative">
                
                {/* Deck Delete Button */}
                <button onClick={() => handleDeleteFolder(selectedFolder.id)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Deck">
                  <Icons.Trash />
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5 md:pb-6 mb-5 md:mb-6 pr-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-black text-[#0F172A] line-clamp-2">{selectedFolder.name}</h2>
                    <p className="text-xs md:text-base text-slate-500 font-medium mt-1">{flashcards.length} cards in this deck</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <select onChange={(e) => setSelectedTechnique(e.target.value as any)} value={selectedTechnique} className="bg-slate-50 border border-slate-200 text-[#0F172A] font-bold text-sm px-4 py-3 rounded-xl outline-none focus:border-blue-400 w-full sm:w-auto">
                      <option value="active-recall">Active Recall</option>
                      <option value="feynman">Feynman Technique</option>
                      <option value="blurting">Blurting Method</option>
                    </select>
                    <button onClick={launchStudyMode} disabled={flashcards.length === 0} className="bg-[#0F172A] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 w-full sm:w-auto text-center">
                      Launch 🚀
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddFlashcard} className="flex flex-col md:flex-row gap-2 md:gap-3">
                   <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required placeholder="Front (Term / Concept)" className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white" />
                   <input type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required placeholder="Back (Definition)" className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white" />
                   <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 w-full md:w-auto">Add Card</button>
                </form>
             </div>

             <div className="space-y-3">
                <h4 className="font-extrabold text-[#0F172A] px-2 mb-3 md:mb-4">Cards in this deck</h4>
                {flashcards.map((card) => (
                  <div key={card.id} className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2 md:gap-4 relative group">
                    <div className="flex-1 pb-3 sm:pb-0 sm:border-r border-slate-100 sm:pr-8">
                      <p className="font-bold text-sm md:text-base text-[#0F172A]">{card.question}</p>
                    </div>
                    <div className="flex-1 pr-8 sm:pr-10 pt-2 sm:pt-0">
                      <p className="font-medium text-sm md:text-base text-slate-600">{card.answer}</p>
                    </div>
                    {/* Card Delete Button */}
                    <button onClick={() => handleDeleteCard(card.id)} className="absolute top-2 right-2 sm:top-auto sm:bottom-4 sm:right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100" title="Delete Card">
                      <Icons.Trash />
                    </button>
                  </div>
                ))}
                {flashcards.length === 0 && <p className="text-center text-slate-400 font-bold py-6 text-sm">This deck is empty. Add a card above.</p>}
             </div>
          </div>
        )}

        {/* --- FOCUS HUB --- */}
        {activeTab === 'focus-hub' && (
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in flex flex-col lg:flex-row gap-6 md:gap-10">
            
            <div className="flex-1 bg-white rounded-[2rem] p-6 md:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div className={`absolute inset-0 opacity-[0.03] transition-colors duration-1000 ${pomodoroMode === 'work' ? 'bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-green-900 via-transparent to-transparent'}`}></div>
              
              <div className="relative z-10 w-full flex flex-col items-center">
                
                {/* Timer Settings Selectors */}
                <div className="flex gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Focus Time</label>
                    <select value={selectedWorkTime} onChange={handleWorkTimeChange} disabled={pomodoroIsActive} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none disabled:opacity-50 text-center cursor-pointer">
                      <option value={1500}>25 min</option>
                      <option value={2700}>45 min</option>
                      <option value={3600}>60 min</option>
                      <option value={5400}>90 min</option>
                      <option value={7200}>120 min</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Break Time</label>
                    <select value={selectedBreakTime} onChange={handleBreakTimeChange} disabled={pomodoroIsActive} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none disabled:opacity-50 text-center cursor-pointer">
                      <option value={300}>5 min</option>
                      <option value={600}>10 min</option>
                      <option value={900}>15 min</option>
                      <option value={1200}>20 min</option>
                      <option value={1800}>30 min</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200 w-full max-w-xs md:max-w-sm mb-8 md:mb-10">
                  <button onClick={() => { setPomodoroIsActive(false); setPomodoroMode('work'); setPomodoroTime(selectedWorkTime); }} className={`flex-1 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all ${pomodoroMode === 'work' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-slate-500 hover:text-slate-700'}`}>Focus</button>
                  <button onClick={() => { setPomodoroIsActive(false); setPomodoroMode('break'); setPomodoroTime(selectedBreakTime); }} className={`flex-1 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all ${pomodoroMode === 'break' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-slate-500 hover:text-slate-700'}`}>Break</button>
                </div>

                <div className="text-[5rem] sm:text-[6rem] md:text-[8rem] font-black text-[#0F172A] tracking-tighter tabular-nums mb-8 md:mb-10 leading-none">
                  {formatClock(pomodoroTime)}
                </div>

                <button onClick={() => setPomodoroIsActive(!pomodoroIsActive)} className={`w-full max-w-xs md:max-w-sm py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg transition-all duration-300 ${pomodoroIsActive ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-[#0F172A] text-white hover:bg-slate-800 shadow-md'}`}>
                  {pomodoroIsActive ? 'Pause Timer' : 'Start Timer'}
                </button>
              </div>
            </div>

            <div className="w-full lg:w-[400px] flex flex-col h-[400px] md:h-[500px] lg:h-auto bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-base md:text-lg font-black text-[#0F172A]">Session Tasks</h3>
                <span className="text-[10px] md:text-xs font-bold text-slate-400">{tasks.filter(t=>t.completed).length} / {tasks.length} Done</span>
              </div>
              
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-2 md:space-y-3 custom-scrollbar bg-white">
                {tasks.length === 0 ? (
                  <p className="text-center text-slate-400 font-bold mt-10 text-xs md:text-sm">Add tasks to focus on.</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm'} transition-colors group`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'}`}>
                          {task.completed && <span className="text-[10px] font-black">✓</span>}
                        </button>
                        <span className={`text-sm font-bold truncate ${task.completed ? 'line-through text-slate-400' : 'text-[#0F172A]'}`}>{task.text}</span>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="p-1.5 md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity rounded-md">
                        <Icons.Trash />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddTask} className="p-3 md:p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <input type="text" value={newTaskInput} onChange={(e) => setNewTaskInput(e.target.value)} placeholder="Add a new task..." className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 shadow-sm" />
              </form>
            </div>
          </div>
        )}

        {/* ACTIVE RECALL UI */}
        {selectedFolder && activeStudyMode === 'active-recall' && activeTab === 'decks' && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <button onClick={() => setActiveStudyMode('none')} className="text-xs md:text-sm font-bold text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-sm">Exit Study</button>
              <span className="font-bold text-xs md:text-sm text-slate-400">{currentCardIndex + 1} / {flashcards.length}</span>
            </div>
            
            {currentCardIndex >= flashcards.length ? (
              <div className="bg-white rounded-2xl md:rounded-3xl p-8 md:p-16 text-center shadow-sm border border-slate-200">
                <div className="text-5xl md:text-6xl mb-4 md:mb-6">🏆</div>
                <h3 className="text-xl md:text-3xl font-black text-[#0F172A] mb-6 md:mb-8">Deck Completed!</h3>
                <button onClick={() => { setCurrentCardIndex(0); setupActiveRecallCard(0); }} className="bg-[#0F172A] text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-md hover:bg-slate-800 text-sm md:text-base w-full sm:w-auto">Restart Study</button>
              </div>
            ) : (
              <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-12 shadow-sm border border-slate-200">
                <div className="mb-6 md:mb-10 text-center">
                  <h2 className="text-lg md:text-3xl font-extrabold text-[#0F172A] leading-tight">
                    {flashcards[currentCardIndex].question}
                  </h2>
                </div>
                
                <div className="flex flex-col gap-2 md:gap-3 mb-6 md:mb-8">
                  {currentOptions.map((opt, idx) => {
                    const labels = ['A', 'B', 'C', 'D'];
                    let btnClass = "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 font-bold text-left transition-all text-sm md:text-base w-full ";
                    let labelClass = "w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-xs md:text-sm font-black transition-colors shrink-0 ";
                    
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

                <div className="border-t border-slate-100 pt-5 md:pt-6 flex justify-center">
                  {!isAnswerChecked ? (
                    <button onClick={handleCheckAnswer} disabled={!selectedAnswer} className="w-full sm:w-auto bg-blue-600 text-white font-bold px-8 md:px-12 py-3 md:py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base">
                      Check Answer
                    </button>
                  ) : (
                    <button onClick={nextCard} className="w-full sm:w-auto bg-[#0F172A] text-white font-bold px-8 md:px-12 py-3 md:py-4 rounded-xl hover:bg-slate-800 text-sm md:text-base">
                      Next Question →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEYNMAN TECHNIQUE UI */}
        {selectedFolder && activeStudyMode === 'feynman' && activeTab === 'decks' && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in relative z-10">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <button onClick={() => setActiveStudyMode('none')} className="text-xs md:text-sm font-bold text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-sm">Exit Session</button>
              <span className="font-bold text-xs md:text-sm text-slate-400">{currentCardIndex + 1} / {flashcards.length}</span>
            </div>
            {currentCardIndex >= flashcards.length ? (
              <div className="bg-white rounded-2xl md:rounded-3xl p-8 md:p-16 text-center shadow-sm border border-slate-200">
                <div className="text-5xl md:text-6xl mb-4 md:mb-6 drop-shadow-md">🎓</div>
                <h3 className="text-xl md:text-3xl font-black text-[#0F172A] mb-6 md:mb-8">Mastery Complete!</h3>
                <button onClick={() => setCurrentCardIndex(0)} className="bg-[#0F172A] text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-md hover:bg-slate-800 text-sm md:text-lg w-full sm:w-auto">Teach Again</button>
              </div>
            ) : (
              <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="mb-6 md:mb-8 pb-5 md:pb-8 border-b border-slate-100">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1 md:mb-2">Explain this concept</span>
                  <h2 className="text-xl md:text-4xl font-black text-[#0F172A]">{flashcards[currentCardIndex].question}</h2>
                </div>
                <textarea 
                  value={feynmanInput} 
                  onChange={(e) => setFeynmanInput(e.target.value)} 
                  placeholder="Explain it simply, as if you are teaching a freshman..." 
                  className="w-full h-32 md:h-56 bg-slate-50/80 border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-6 text-slate-700 text-sm md:text-lg font-medium focus:outline-none focus:border-indigo-400 focus:bg-white resize-none mb-5 md:mb-8 transition-all"
                />
                {!isCardFlipped ? (
                  <button onClick={handleFeynmanCheck} disabled={!feynmanInput.trim()} className="w-full bg-indigo-600 text-white font-bold text-sm md:text-lg px-6 md:px-8 py-3 md:py-5 rounded-xl md:rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all">Check Understanding 🔍</button>
                ) : (
                  <div className="animate-fade-in bg-indigo-50 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-indigo-100 mb-5 md:mb-8">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2 md:mb-3">Actual Answer</span>
                    <p className="font-bold text-indigo-900 text-base md:text-xl leading-relaxed">{flashcards[currentCardIndex].answer}</p>
                  </div>
                )}
                {isCardFlipped && <button onClick={nextCard} className="w-full bg-[#0F172A] text-white font-bold text-sm md:text-lg px-6 md:px-8 py-3 md:py-5 rounded-xl md:rounded-2xl hover:bg-slate-800 transition-colors">Next Concept →</button>}
              </div>
            )}
          </div>
        )}

        {/* --- AUXILINK AI --- */}
        {activeTab === 'auxilink-ai' && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center animate-fade-in">
            <div className="text-5xl md:text-6xl mb-4 md:mb-6 drop-shadow-md">🤖</div>
            <h2 className="text-2xl md:text-4xl font-black text-[#0F172A] mb-3 md:mb-4">Auxilink AI Module</h2>
            <p className="text-sm md:text-lg text-slate-500 font-medium max-w-xl mx-auto">This intelligent engineering assistant is currently under development for iStud.</p>
          </div>
        )}

        {/* --- COMMUNITY CHAT --- */}
        {activeTab === 'community' && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in h-full flex flex-col">
            <div className="bg-white rounded-[1.5rem] md:rounded-3xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[65vh] md:min-h-[600px]">
              <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-base md:text-xl font-black text-[#0F172A]">Campus Lounge</h3>
                <span className="bg-green-100 text-green-700 text-[9px] md:text-xs px-2 md:px-3 py-1 rounded-full font-bold flex items-center gap-1.5 md:gap-2"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span> Live</span>
              </div>
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 md:space-y-4 bg-[#F8FAFC]">
                {chatMessages.length === 0 ? <p className="text-center text-slate-400 font-bold mt-10 text-xs md:text-base">No messages yet.</p> : chatMessages.map((msg) => { const isMe = user?.id === msg.user_id; return ( <div key={msg.id} className={`max-w-[90%] md:max-w-md p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm ${isMe ? 'bg-[#0F172A] text-white self-end rounded-tr-sm ml-auto' : 'bg-white border border-slate-200 text-[#0F172A] self-start rounded-tl-sm'}`}> <div className="flex justify-between items-center mb-1 gap-4"> <span className={`font-bold text-[8px] md:text-[10px] uppercase tracking-wider ${isMe ? 'text-slate-300' : 'text-slate-500'}`}>{isMe ? 'You' : msg.user_name}</span> </div> <p className="text-xs md:text-base font-medium leading-relaxed">{msg.text}</p> </div> ); })}
              </div>
              <form onSubmit={handleSendMessage} className="p-3 md:p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                <input type="text" value={newChatInput} onChange={(e) => setNewChatInput(e.target.value)} placeholder={user ? "Type a message..." : "Log in to chat!"} disabled={!user} className="flex-1 bg-slate-50 px-3 md:px-5 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold outline-none focus:border-blue-400 border border-slate-200 disabled:opacity-50" />
                <button type="submit" disabled={!user || !newChatInput.trim()} className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-blue-700 disabled:opacity-50 shrink-0">Send</button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* PROFILE SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg md:text-xl font-black text-[#0F172A]">Profile Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-5 md:p-6 space-y-4">
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
