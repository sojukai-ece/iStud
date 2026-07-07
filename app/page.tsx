"use client";
import PyTorch
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
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const [selectedTechnique, setSelectedTechnique] = useState('active-recall');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // --- NEW: ACTIVE RECALL STATE ---
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatInput, setNewChatInput] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user?.user_metadata?.display_name) {
        setDisplayName(user.user_metadata.display_name);
      }

      if (user) {
        const { data: folderData } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (folderData) setFolders(folderData);
      }
      
      const { data: chatData } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: true });
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); 
    setFolders([]); 
    setProfileMenuOpen(false); 
    setIsSettingsOpen(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
    if (error) alert("Error updating profile: " + error.message);
    else { setUser(data.user); setIsSettingsOpen(false); setProfileMenuOpen(false); }
  };

  const openFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    setIsQuizMode(false); // Ensure we don't start in quiz mode
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('folder_id', folder.id)
      .order('created_at', { ascending: false });
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

  // --- NEW: QUIZ CONTROLS ---
  const startQuiz = () => {
    if (flashcards.length === 0) return;
    setIsQuizMode(true);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
  };

  const nextCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => prev + 1);
  };

  const restartQuiz = () => {
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
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

  const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24 md:pb-10 relative">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); setIsQuizMode(false); }} className="flex items-center gap-3 cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-[#1B365D] flex items-center justify-center shadow-md p-1.5">
              <Image src="/istud-logo.png" alt="Logo" width={40} height={40} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#1B365D]">iSt<span className="text-blue-500">u</span>d</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 -mt-1">Academic Portal</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'study-hub', label: '📚 Study Hub' },
              { id: 'auxilink-ai', label: '🤖 Auxilink AI' },
              { id: 'community', label: '💬 Community' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelectedFolder(null); setIsQuizMode(false); }} className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all ${activeTab === tab.id ? 'bg-white text-[#1B365D] shadow-sm scale-102' : 'text-slate-600 hover:text-slate-900'}`}>{tab.label}</button>
            ))}
          </nav>

          <div className="relative">
            {user ? (
              <div>
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-[#1B365D] text-white flex items-center justify-center text-xs font-bold">{user.email?.charAt(0).toUpperCase()}</div>
                  <span className="hidden sm:inline text-sm font-bold text-[#1B365D] max-w-25 truncate">{user.user_metadata?.display_name || user.email}</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-12 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b border-slate-50"><p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p><p className="text-sm font-bold text-[#1B365D] truncate">{user.email}</p></div>
                    <button onClick={() => { setIsSettingsOpen(true); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">⚙️ Account Settings</button>
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">🚪 Sign Out</button>
                  </div>
                )}
              </div>
            ) : ( <Link href="/login" className="bg-[#1B365D] text-white px-6 py-2.5 rounded-full font-black text-sm shadow-md">Sign In</Link> )}
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-3 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', icon: '📊', label: 'Home' },
          { id: 'study-hub', icon: '📚', label: 'Study' },
          { id: 'auxilink-ai', icon: '🤖', label: 'AI' },
          { id: 'community', icon: '💬', label: 'Chat' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelectedFolder(null); setIsQuizMode(false); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === tab.id ? 'text-[#1B365D] scale-110' : 'text-slate-400 grayscale opacity-70'}`}>
            <span className="text-xl">{tab.icon}</span><span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* PROFILE SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-[#1B365D]">Account Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email Address</label><input type="text" value={user?.email} disabled className="w-full bg-slate-100 text-slate-500 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold cursor-not-allowed" /></div>
              <div><label className="text-xs font-bold text-[#1B365D] uppercase tracking-wider mb-1 block">Display Name</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., Engr. Benedict" className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
              <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" className="flex-1 bg-[#1B365D] text-white px-4 py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-colors shadow-md">Save Changes</button></div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-6 md:space-y-8 animate-fade-in">
          <div className="bg-[#1B365D] text-white rounded-4xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="max-w-xl space-y-4 z-10 relative">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">{user ? `Welcome Back, ${user.user_metadata?.display_name || 'Scholar'}` : 'System Online'}</span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">Your Academic Center of Operations.</h1>
              <p className="text-blue-100/80 font-medium leading-relaxed">Track retention metrics, launch your customized decks, or collaborate with fellow scholars across the campus.</p>
              <div className="pt-4 flex flex-wrap gap-3 md:gap-4"><button onClick={() => setActiveTab('study-hub')} className="bg-white text-[#1B365D] font-black px-6 py-3.5 rounded-full hover:bg-blue-50 transition-colors shadow-lg text-sm md:text-base w-full sm:w-auto">Open Study Hub →</button></div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: STUDY HUB */}
      {activeTab === 'study-hub' && (
        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 animate-fade-in">
          
          {/* FOLDER SELECTION SCREEN */}
          {!selectedFolder ? (
            <div className="space-y-8">
              <div className="mb-10 space-y-4">
                <div><h2 className="text-3xl font-black text-[#1B365D]">🧠 Study Hub & Techniques</h2><p className="text-slate-600 font-medium">Select a scientific study strategy or manage your flashcard folders.</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { id: 'active-recall', name: 'Active Recall', icon: '🔄', desc: 'Test yourself before checking notes.' },
                    { id: 'feynman', name: 'Feynman Technique', icon: '🗣️', desc: 'Explain concepts in simple terms.' },
                    { id: 'pomodoro', name: 'Pomodoro Timer', icon: '⏱️', desc: '25m focus / 5m structured breaks.' },
                    { id: 'blurting', name: 'Blurting Method', icon: '📝', desc: 'Write everything from memory fast.' },
                  ].map((tech) => (
                    <div key={tech.id} onClick={() => setSelectedTechnique(tech.id)} className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${selectedTechnique === tech.id ? 'border-[#1B365D] bg-blue-50/50 shadow-md' : 'border-slate-200/80 bg-white hover:border-slate-300'}`}>
                      <div className="text-2xl mb-2">{tech.icon}</div><h4 className="font-black text-[#1B365D]">{tech.name}</h4><p className="text-xs text-slate-500 font-medium mt-1">{tech.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-4xl border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div><h3 className="text-2xl font-black text-[#1B365D]">🗂️ Private Decks</h3><p className="text-sm text-slate-500">Organize subjects securely.</p></div>
                  <form onSubmit={handleAddFolder} className="flex gap-2 w-full sm:w-auto">
                    <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="New folder..." className="bg-slate-50 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-[#1B365D] w-full sm:w-64" />
                    <button type="submit" className="bg-[#1B365D] text-white px-5 py-2.5 rounded-xl font-extrabold text-sm hover:bg-slate-800 transition-colors shrink-0">+ Add</button>
                  </form>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  {folders.map((folder) => (
                    <div key={folder.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#1B365D] transition-all group flex flex-col justify-between h-40">
                      <div><span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Folder</span><h4 className="text-lg font-black text-[#1B365D] mt-1 group-hover:text-blue-600 transition-colors line-clamp-2">{folder.name}</h4></div>
                      <button onClick={() => openFolder(folder)} className="text-xs font-black text-white bg-[#1B365D] w-full mt-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 transition-colors">Open 📂</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* INSIDE A SPECIFIC FOLDER */
            <div>
              {!isQuizMode ? (
                /* FLASHCARD EDITOR MODE */
                <div className="bg-white p-6 md:p-8 rounded-4xl border border-slate-200/80 shadow-sm space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setSelectedFolder(null)} className="text-sm font-bold text-slate-500 hover:text-[#1B365D] flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full w-fit">← Back</button>
                    <button onClick={startQuiz} disabled={flashcards.length === 0} className="bg-linear-to-r from-blue-600 to-indigo-600 text-white font-black text-sm px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      🧠 Start Active Recall
                    </button>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-black text-[#1B365D] border-b border-slate-100 pb-4">{selectedFolder.name}</h3>
                  <form onSubmit={handleAddFlashcard} className="flex flex-col gap-4 bg-blue-50 p-4 md:p-6 rounded-2xl border border-blue-100">
                    <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required placeholder="Question (Front)" className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:border-blue-500 outline-none" />
                    <input type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required placeholder="Answer (Back)" className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:border-blue-500 outline-none" />
                    <button type="submit" className="bg-[#1B365D] text-white px-8 py-3 rounded-xl font-extrabold text-sm shadow-md mt-2 w-full md:w-auto self-end">Save Flashcard</button>
                  </form>
                  <div className="space-y-3 pt-6">
                    {flashcards.length === 0 && <p className="text-sm text-slate-500 italic">No cards yet. Add some to start studying!</p>}
                    {flashcards.map((card) => (
                      <div key={card.id} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-4">
                        <div className="flex-1"><span className="text-[10px] font-bold text-slate-400">Q:</span><p className="font-black text-[#1B365D]">{card.question}</p></div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg"><span className="text-[10px] font-bold text-emerald-500">A:</span><p className="font-bold text-slate-700">{card.answer}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ACTIVE RECALL QUIZ MODE */
                <div className="max-w-2xl mx-auto animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setIsQuizMode(false)} className="text-sm font-bold text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-4 py-2 rounded-full">Exit Quiz</button>
                    <span className="bg-blue-100 text-[#1B365D] font-black text-xs px-4 py-2 rounded-full">
                      Card {currentCardIndex >= flashcards.length ? flashcards.length : currentCardIndex + 1} of {flashcards.length}
                    </span>
                  </div>

                  {currentCardIndex >= flashcards.length ? (
                    <div className="bg-white rounded-4xl p-10 text-center shadow-xl border border-slate-200/80">
                      <div className="text-6xl mb-4">🏆</div>
                      <h3 className="text-3xl font-black text-[#1B365D] mb-2">Deck Completed!</h3>
                      <p className="text-slate-600 font-medium mb-8">You went through all {flashcards.length} cards in this folder.</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={restartQuiz} className="bg-[#1B365D] text-white font-bold px-8 py-4 rounded-2xl shadow-md hover:bg-slate-800 transition-colors">Restart Deck 🔄</button>
                        <button onClick={() => setIsQuizMode(false)} className="bg-slate-100 text-slate-700 font-bold px-8 py-4 rounded-2xl border border-slate-200 hover:bg-slate-200 transition-colors">Back to Editing</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-4xl min-h-100 flex flex-col justify-center items-center p-8 md:p-12 shadow-xl border border-slate-200/80 text-center relative overflow-hidden transition-all duration-300 ease-in-out">
                      {/* Subdued background design */}
                      <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-50 rounded-full blur-3xl -z-10"></div>
                      
                      <span className={`text-xs font-black uppercase tracking-widest mb-6 ${isCardFlipped ? 'text-emerald-500' : 'text-blue-500'}`}>
                        {isCardFlipped ? 'Answer' : 'Question'}
                      </span>
                      
                      <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] leading-tight mb-12">
                        {isCardFlipped ? flashcards[currentCardIndex].answer : flashcards[currentCardIndex].question}
                      </h2>

                      <div className="w-full mt-auto pt-8 border-t border-slate-100 flex justify-center">
                        {!isCardFlipped ? (
                          <button onClick={() => setIsCardFlipped(true)} className="w-full md:w-auto bg-blue-50 text-blue-700 border border-blue-200 font-black px-10 py-4 rounded-2xl hover:bg-blue-100 transition-colors">
                            Reveal Answer 👁️
                          </button>
                        ) : (
                          <button onClick={nextCard} className="w-full md:w-auto bg-emerald-500 text-white font-black px-10 py-4 rounded-2xl shadow-md hover:bg-emerald-600 hover:-translate-y-1 transition-all">
                            Next Card →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* VIEW 3: AUXILINK AI */}
      {activeTab === 'auxilink-ai' && (
        <main className="max-w-4xl mx-auto px-4 md:px-6 pt-16 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-[#1B365D] to-blue-500 text-white flex items-center justify-center text-4xl mx-auto shadow-xl">🤖</div>
          <span className="bg-blue-100 text-blue-800 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest">Module In Development</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1B365D]">Meet Auxilink AI</h2>
          <p className="text-lg text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">We are replacing standard calculators with an intelligent engineering and science assistant built directly into iStud.</p>
        </main>
      )}

      {/* VIEW 4: COMMUNITY CHAT (Minified to save space) */}
      {activeTab === 'community' && (
        <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-10 animate-fade-in h-[calc(100vh-140px)] md:h-auto">
          {/* ... Community chat remains exactly as you had it ... */}
        </main>
      )}
    </div>
  );
}
