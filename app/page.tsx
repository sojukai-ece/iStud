"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

// --- TYPES ---
interface Folder { id: string; name: string; user_id: string; }
interface Flashcard { id: string; question: string; answer: string; }
interface ChatMessage { id: string; user_id: string; user_name: string; avatar_url?: string; text: string; created_at: string; }
interface Task { id: string; text: string; completed: boolean; }
interface Milestone { id: string; title: string; date: string; location: string; color: string; }

// --- MASCOT QUOTES & EASTER EGGS ---
const AXI_QUOTES = [
  "Ready to conquer some subjects? Let's go!",
  "Remember to hydrate! A well-oiled machine runs best.",
  "Logic gates are cool, but have you tried getting 8 hours of sleep?",
  "Built by a solo dev... pretty impressive, right?",
  "Simplifying Boolean algebra... just kidding, I'm just a mascot.",
  "Focus mode: engaged. Distractions: eliminated.",
  "Don't forget to review those truth tables today!",
  "Take a 5-minute break. Your brain will thank you."
];

// --- INSPIRATIONAL QUOTES ---
const INSPIRATIONAL_QUOTES = [
  "The beautiful thing about learning is that no one can take it away from you. – B.B. King",
  "Strive for progress, not perfection. – Unknown",
  "There are no secrets to success. It is the result of preparation, hard work, and learning from failure. – Colin Powell",
  "Engineering is not only study of 45 subjects but it is moral studies of intellectual life. – Prakhar Srivastav",
  "The expert in anything was once a beginner. – Helen Hayes"
];

// --- SVG ICONS ---
const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Focus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>,
  Decks: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
  AI: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
  Chat: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  File: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'decks' | 'focus-hub' | 'auxilink-ai' | 'community' | 'profile'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [dailyQuote, setDailyQuote] = useState('');
  
  // --- INTRO ANIMATION STATE ---
  const [introStage, setIntroStage] = useState<'active' | 'fading' | 'hidden'>('active');

  // --- MASCOT STATE ---
  const [axiMessage, setAxiMessage] = useState(AXI_QUOTES[0]);
  const [isAxiTalking, setIsAxiTalking] = useState(false);

  // --- PROFILE SETTINGS STATE ---
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [bio, setBio] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // --- CREATOR STATUS STATE (SOLO DEV) ---
  const [devStatus, setDevStatus] = useState<'Online' | 'Offline' | 'Updating'>('Offline');

  // --- STUDY HUB CORE STATE ---
  const [selectedTechnique, setSelectedTechnique] = useState<'active-recall' | 'feynman' | 'blurting'>('active-recall');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  // --- DYNAMIC DAILY CHALLENGE STATE ---
  const [dailyCard, setDailyCard] = useState<Flashcard | null>(null);
  const [dailyOptions, setDailyOptions] = useState<string[]>([]);
  const [dailyAnswered, setDailyAnswered] = useState<string | null>(null);

  // --- DYNAMIC MILESTONES STATE ---
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newMilestoneLocation, setNewMilestoneLocation] = useState('');

  // --- PDF UPLOAD STATE ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);

  // --- ACTUAL STATISTICS & GAMIFICATION ---
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [studyTimeSeconds, setStudyTimeSeconds] = useState(0);
  const [activeStreak, setActiveStreak] = useState(1);

  // --- ACTIVE STUDY MODES STATE ---
  const [activeStudyMode, setActiveStudyMode] = useState<'none' | 'active-recall' | 'feynman' | 'blurting'>('none');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatInput, setNewChatInput] = useState('');

  const deckColors = ['bg-red-600', 'bg-green-500', 'bg-blue-600', 'bg-yellow-400', 'bg-purple-500', 'bg-teal-400'];
  const getDeckColor = (idx: number) => deckColors[idx % deckColors.length];

  // --- INTRO EFFECT ---
  useEffect(() => {
    const fadeTimer = setTimeout(() => setIntroStage('fading'), 2000);
    const hideTimer = setTimeout(() => setIntroStage('hidden'), 2500);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  // --- GITHUB CREATOR STATUS EFFECT ---
  useEffect(() => {
    const fetchGithubStatus = async () => {
      try {
        const res = await fetch('https://api.github.com/users/sojukai-ece/events/public?per_page=1');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const lastEventDate = new Date(data[0].created_at);
            const now = new Date();
            const diffHours = (now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60);
            
            if (diffHours < 48) { 
              if (data[0].type === 'PushEvent') setDevStatus('Updating');
              else setDevStatus('Online');
            } else {
              setDevStatus('Offline');
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch creator status:", err);
        setDevStatus('Offline');
      }
    };
    
    fetchGithubStatus();
    const interval = setInterval(fetchGithubStatus, 300000); 
    return () => clearInterval(interval);
  }, []);

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
        if (user.user_metadata.course) setCourse(user.user_metadata.course);
        if (user.user_metadata.bio) setBio(user.user_metadata.bio);
      }

      if (user) {
        // Load stats
        const savedStats = localStorage.getItem(`istud_stats_${user.id}`);
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          setCardsReviewed(parsed.cardsReviewed || 0);
          setCorrectAnswers(parsed.correctAnswers || 0);
          setStudyTimeSeconds(parsed.studyTimeSeconds || 0);
        }
        
        // Load tasks & milestones
        const savedTasks = localStorage.getItem(`istud_tasks_${user.id}`);
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        const savedMilestones = localStorage.getItem(`istud_milestones_${user.id}`);
        if (savedMilestones) setMilestones(JSON.parse(savedMilestones));

        // ACTUAL CALENDAR STREAK CHECK (V2 - Reset for all users to factual logic)
        const todayStr = new Date().toDateString(); 
        const lastLoginKey = `istud_lastlogin_v2_${user.id}`;
        const streakKey = `istud_streak_v2_${user.id}`;
        
        const lastLoginStr = localStorage.getItem(lastLoginKey);
        let currentStreak = parseInt(localStorage.getItem(streakKey) || '1');

        if (lastLoginStr) {
          if (lastLoginStr !== todayStr) {
            const todayDate = new Date(todayStr);
            const lastDate = new Date(lastLoginStr);
            const diffTime = todayDate.getTime() - lastDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              currentStreak += 1;
            } else if (diffDays > 1) {
              currentStreak = 1;
            }
          }
        }
        
        setActiveStreak(currentStreak);
        localStorage.setItem(lastLoginKey, todayStr);
        localStorage.setItem(streakKey, currentStreak.toString());

        // Fetch Folders
        const { data: folderData } = await supabase.from('folders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (folderData) setFolders(folderData);

        // Fetch ALL Flashcards for Daily Challenge
        const { data: allCards } = await supabase.from('flashcards').select('*').eq('user_id', user.id);
        if (allCards && allCards.length > 0) {
          const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
          setDailyCard(randomCard);
          
          let wrongOptions = allCards.filter(c => c.id !== randomCard.id).map(c => c.answer);
          wrongOptions = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3);
          
          const fallbacks = ["True", "False", "None of the above", "All of the above"];
          let i = 0;
          while (wrongOptions.length < 3 && i < fallbacks.length) {
            if (!wrongOptions.includes(fallbacks[i])) wrongOptions.push(fallbacks[i]);
            i++;
          }
          setDailyOptions([randomCard.answer, ...wrongOptions].sort(() => Math.random() - 0.5));
        }
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

  // --- LOCAL PERSISTENCE EFFECTS ---
  useEffect(() => {
    if (user) {
      localStorage.setItem(`istud_stats_${user.id}`, JSON.stringify({ cardsReviewed, correctAnswers, studyTimeSeconds }));
      localStorage.setItem(`istud_tasks_${user.id}`, JSON.stringify(tasks));
      localStorage.setItem(`istud_milestones_${user.id}`, JSON.stringify(milestones));
    }
  }, [cardsReviewed, correctAnswers, studyTimeSeconds, tasks, milestones, user]);


  // --- MASCOT INTERACTION ---
  const pokeMascot = () => {
    setIsAxiTalking(true);
    setAxiMessage(AXI_QUOTES[Math.floor(Math.random() * AXI_QUOTES.length)]);
    setTimeout(() => setIsAxiTalking(false), 4000);
  };

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
      setCardsReviewed(prev => prev + 1);
    }
    return () => clearInterval(interval);
  }, [isBlurtingActive, blurtingTimeLeft]);

  // --- DATABASE & ACTIONS ---
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setFolders([]); setActiveTab('dashboard');
    setCardsReviewed(0); setCorrectAnswers(0); setStudyTimeSeconds(0); setTasks([]);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase.auth.updateUser({ 
      data: { display_name: displayName, avatar_url: avatarUrl, university: university, course: course, bio: bio } 
    });
    if (error) alert("Error updating profile: " + error.message);
    else { setUser(data.user); alert("Profile updated successfully!"); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploadingAvatar(true);
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl); 

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      
      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setAvatarUrl(data.publicUrl); 
        await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
      }
    } catch (err) {
      console.error("Upload failed with error:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
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

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFolder || !user) return;

    setIsUploadingPDF(true);
    setTimeout(async () => {
      const generatedCards = [
        { folder_id: selectedFolder.id, user_id: user.id, question: `What is the primary thesis of ${file.name}?`, answer: "Derived automatically from the document's abstract." },
        { folder_id: selectedFolder.id, user_id: user.id, question: "Define the core concept introduced in Chapter 1.", answer: "The foundational principle required for subsequent analysis." },
        { folder_id: selectedFolder.id, user_id: user.id, question: "What is the key formula or metric mentioned?", answer: "Derived value based on the PDF's internal tables." }
      ];

      const { data, error } = await supabase.from('flashcards').insert(generatedCards).select();
      if (!error && data) setFlashcards([...data, ...flashcards]);
      else if (error) alert("Error generating cards: " + error.message);
      
      setIsUploadingPDF(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 3500); 
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatInput.trim() || !user || isUploadingAvatar) return;
    
    const senderName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Guest Scholar';
    const messageToSend = newChatInput;
    setNewChatInput('');
    
    const safeAvatarToSend = avatarUrl.startsWith('blob:') ? user.user_metadata?.avatar_url : avatarUrl;
    
    const tempMessage: ChatMessage = { 
      id: Date.now().toString(), user_id: user.id, user_name: senderName, 
      avatar_url: safeAvatarToSend, text: messageToSend, created_at: new Date().toISOString() 
    };
    
    setChatMessages((prev) => [...prev, tempMessage]);
    await supabase.from('community_messages').insert([{ 
      user_id: user.id, user_name: senderName, avatar_url: safeAvatarToSend, text: messageToSend 
    }]);
  };

  // --- MILESTONES HANDLERS ---
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle || !newMilestoneDate) return;
    
    const colors = ['text-red-500 bg-red-50', 'text-blue-500 bg-blue-50', 'text-green-500 bg-green-50', 'text-purple-500 bg-purple-50', 'text-orange-500 bg-orange-50'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newM: Milestone = {
      id: Date.now().toString(),
      title: newMilestoneTitle,
      date: newMilestoneDate,
      location: newMilestoneLocation || 'TBD',
      color: randomColor
    };
    
    const updated = [...milestones, newM].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setMilestones(updated);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    setNewMilestoneLocation('');
    setIsAddingMilestone(false);
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // --- TASKS HUB ACTIONS ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks([{ id: Date.now().toString(), text: newTaskInput, completed: false }, ...tasks]);
    setNewTaskInput('');
  };
  const toggleTask = (id: string) => { setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)); };
  const deleteTask = (id: string) => { setTasks(tasks.filter(t => t.id !== id)); };

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
    setIsBlurtingActive(false); setBlurtingFinished(false);
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

  const circleRadius = 34;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference - (getRetentionAccuracy() / 100) * circleCircumference;

  // ---------------- UI RENDER ----------------
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      
      {/* CSS For Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes blink { 0%, 96%, 98% { transform: scaleY(1); } 97% { transform: scaleY(0.1); } 100% { transform: scaleY(1); } }
        @keyframes pulse-glow { 0%, 100% { text-shadow: 0 0 20px rgba(59, 130, 246, 0.4); transform: scale(1); } 50% { text-shadow: 0 0 50px rgba(59, 130, 246, 1); transform: scale(1.02); } }
        
        @keyframes img-glow { 
          0%, 100% { filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.4)); transform: scale(1); } 
          50% { filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.9)); transform: scale(1.05); } 
        }
        
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-blink { animation: blink 4s infinite; transform-origin: center; }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        .animate-img-glow { animation: img-glow 2.5s ease-in-out infinite; } 
      `}} />

      {/* --- STARTUP INTRO OVERLAY --- */}
      {introStage !== 'hidden' && (
        <div className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#ffffff] transition-opacity duration-500 ease-in-out ${introStage === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex flex-col items-center animate-float">
            <h1 className="text-6xl md:text-8xl font-black text-blue-950 tracking-tighter mb-5 animate-pulse-glow drop-shadow-2xl flex items-center justify-center">
              iSt
              <img 
                src="logo.png" 
                alt="u" 
                className="w-12 h-12 md:w-20 md:h-20 object-contain mx-0 mt-0 md:-mt-2 animate-img-glow"
              />
              d
            </h1>
            <div className="flex items-center gap-3 md:gap-4 text-slate-500 font-bold tracking-widest uppercase text-[10px] md:text-xs">
              <span>Built by sojukai.nvl</span>
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
              <span className="text-slate-950 font-black">Auxilink Philippines</span>
            </div>
          </div>
          <div className="absolute bottom-16 flex flex-col items-center opacity-60">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 mt-4">Initializing Workspace</span>
          </div>
        </div>
      )}

      {/* --- AXI MASCOT --- */}
      {activeTab !== 'community' && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 flex flex-col items-end">
          <div className={`mb-3 bg-white border border-slate-200 shadow-xl p-4 rounded-2xl rounded-br-none max-w-50 transition-all duration-300 origin-bottom-right ${isAxiTalking ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
            <p className="text-xs font-bold text-slate-700 leading-relaxed">{axiMessage}</p>
          </div>
          <div onClick={pokeMascot} className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform animate-float relative group">
            <img 
              src="logo.png" 
              alt="iStud Mascot" 
              className={`w-full h-full object-contain transition-all duration-300 animate-img-glow ${isAxiTalking ? 'scale-110 drop-shadow-[0_0_25px_rgba(250,204,21,0.8)]!' : ''}`}
            />
          </div>
        </div>
      )}

      {/* --- MOBILE TOP HEADER --- */}
      <div className="md:hidden flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 py-4 shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }}>
          <div className="text-2xl font-black tracking-tighter text-[#0F172A]">
            iSt<span className="text-blue-600">u</span>d
          </div>
        </div>
        {user ? (
          <button onClick={() => setActiveTab('profile')} className={`flex items-center active:scale-95 transition-transform rounded-full border-2 ${activeTab === 'profile' ? 'border-blue-600 p-0.5' : 'border-transparent'}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold border border-slate-200 shadow-sm">{user.email?.charAt(0).toUpperCase()}</div>
            )}
          </button>
        ) : (
           <Link href="/login" className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">Sign In</Link>
        )}
      </div>

      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-65 bg-white border-r border-slate-200 h-full fixed left-0 top-0 z-40 overflow-y-auto custom-scrollbar">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }}>
            <div className="text-3xl font-black tracking-tighter text-[#0F172A] group-hover:scale-105 transition-transform origin-left">
              iSt<span className="text-blue-600">u</span>d
            </div>
          </div>
        </div>

        <nav className="px-4 py-2 flex flex-col gap-2">
          <button onClick={() => { setActiveTab('dashboard'); setSelectedFolder(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-slate-100 text-[#0F172A] shadow-sm translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'dashboard' ? 'text-blue-600' : ''}><Icons.Home /></span> Home
          </button>
          <button onClick={() => { setActiveTab('focus-hub'); setSelectedFolder(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'focus-hub' ? 'bg-slate-100 text-[#0F172A] shadow-sm translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'focus-hub' ? 'text-blue-600' : ''}><Icons.Focus /></span> Focus Hub
          </button>
          <button onClick={() => { setActiveTab('decks'); setSelectedFolder(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'decks' ? 'bg-slate-100 text-[#0F172A] shadow-sm translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'decks' ? 'text-blue-600' : ''}><Icons.Decks /></span> My Decks
          </button>
          <button onClick={() => setActiveTab('auxilink-ai')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'auxilink-ai' ? 'bg-slate-100 text-[#0F172A] shadow-sm translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'auxilink-ai' ? 'text-blue-600' : ''}><Icons.AI /></span> Auxilink AI
          </button>
          <button onClick={() => setActiveTab('community')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'community' ? 'bg-slate-100 text-[#0F172A] shadow-sm translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <span className={activeTab === 'community' ? 'text-blue-600' : ''}><Icons.Chat /></span> Community Chat
          </button>
          
          {user ? (
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 relative mt-2 border ${activeTab === 'profile' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm translate-x-1' : 'border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-200'}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold">{user.email?.charAt(0).toUpperCase()}</div>
              )}
              My Profile
              <span className="absolute right-4 top-3.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{activeStreak}🔥</span>
            </button>
          ) : (
            <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-blue-600 hover:bg-blue-50 mt-2 transition-colors">
              Sign In
            </Link>
          )}
        </nav>

        <div className="px-4 py-6 mt-auto border-t border-slate-100 flex flex-col gap-3">
          <button onClick={() => { if(selectedFolder) launchStudyMode(); else alert('Select a deck first!'); }} className="w-full bg-[#0F172A] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
            Study Now
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAV --- */}
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
      <main className="flex-1 md:ml-65 h-full overflow-y-auto pb-28 md:pb-8 relative scroll-smooth">
        
        {/* VIEW 1: HOME / DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in space-y-6 md:space-y-8">
            
            <div className="bg-white rounded-3xl md:rounded-4xl p-6 md:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col xl:flex-row gap-6 md:gap-8 items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-100 transition-colors duration-700"></div>
              
              <div className="flex-1 z-10 w-full">
                <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-2 md:mb-3">
                  {user ? `Welcome back, ${displayName || user.email?.split('@')[0]}! 👋` : 'Welcome to iStud! 👋'}
                </h2>
                <p className="text-slate-500 font-medium italic text-sm md:text-lg border-l-4 border-blue-500 pl-3 md:pl-4 py-1">
                  "{dailyQuote}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 md:gap-4 z-10">
                <div className="flex flex-1 items-center gap-4 bg-orange-50 border border-orange-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-inner justify-center sm:justify-start hover:scale-105 transition-transform">
                  <div className="text-3xl md:text-4xl drop-shadow-sm">🔥</div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-extrabold text-orange-800 uppercase tracking-widest mb-0.5 md:mb-1">Active Streak</p>
                    <p className="text-lg md:text-xl font-black text-orange-600">{activeStreak} {activeStreak === 1 ? 'Day' : 'Days'}</p>
                  </div>
                </div>
                <div className={`flex flex-1 items-center gap-4 ${getAcademicRank().bg} border border-slate-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-inner justify-center sm:justify-start hover:scale-105 transition-transform`}>
                  <div className="text-3xl md:text-4xl drop-shadow-sm">{getAcademicRank().icon}</div>
                  <div>
                    <p className={`text-[9px] md:text-[10px] font-extrabold ${getAcademicRank().color} opacity-80 uppercase tracking-widest mb-0.5 md:mb-1`}>Current Rank</p>
                    <p className={`text-lg md:text-xl font-black ${getAcademicRank().color} leading-tight`}>{getAcademicRank().title}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* EXPANDED DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              
              {/* Main Stats Column (Span 2) */}
              <div className="lg:col-span-2 space-y-6 md:space-y-8">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-[#0F172A] mb-4 md:mb-5">Learning Progress</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
                    <div className="bg-white p-5 md:p-6 rounded-[1.25rem] md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-lg hover:-translate-y-1 transition-all">
                      <h4 className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><span className="text-base md:text-lg">📚</span> Cards Reviewed</h4>
                      <p className="text-2xl md:text-3xl font-black text-[#0F172A]">{cardsReviewed}</p>
                    </div>
                    
                    <div className="bg-white p-5 md:p-6 rounded-[1.25rem] md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center items-center hover:shadow-lg hover:-translate-y-1 transition-all">
                      <h4 className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-2 flex items-center gap-2 w-full"><span className="text-base md:text-lg">🎯</span> Accuracy and Retention</h4>
                      <div className="relative w-20 h-20 flex items-center justify-center my-1">
                        <svg className="transform -rotate-90 w-20 h-20">
                          <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                          <circle 
                            cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" 
                            className={`${getRetentionAccuracy() > 70 ? 'text-green-500' : getRetentionAccuracy() > 40 ? 'text-blue-500' : 'text-orange-500'} transition-all duration-1000 ease-out`} 
                            strokeDasharray={circleCircumference} 
                            strokeDashoffset={circleOffset} 
                            strokeLinecap="round" 
                          />
                        </svg>
                        <span className="absolute text-lg font-black text-[#0F172A]">{getRetentionAccuracy()}%</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-5 md:p-6 rounded-[1.25rem] md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-lg hover:-translate-y-1 transition-all">
                      <h4 className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><span className="text-base md:text-lg">⏱️</span> Total Study Time</h4>
                      <p className="text-2xl md:text-3xl font-black text-blue-600">{getFormattedStudyTime()}</p>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC Daily Challenge Widget */}
                <div className="bg-indigo-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-2"><Icons.Brain /> Daily Deck Challenge</h3>
                    <span className="bg-indigo-500 text-xs font-bold px-3 py-1 rounded-full">Today's Pick</span>
                  </div>
                  
                  {dailyCard ? (
                    <>
                      <p className="font-medium text-indigo-100 mb-6 leading-relaxed relative z-10">
                        {dailyCard.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                        {dailyOptions.map((opt, i) => (
                          <button 
                            key={i}
                            disabled={dailyAnswered !== null} 
                            onClick={() => {
                              setDailyAnswered(opt);
                              if (opt === dailyCard.answer) setCorrectAnswers(prev => prev + 1);
                              setCardsReviewed(prev => prev + 1);
                            }}
                            className={`font-bold py-3 px-4 rounded-xl transition-all text-sm truncate text-left ${
                              dailyAnswered === null ? 'bg-white text-indigo-700 hover:bg-indigo-50 hover:scale-[1.02]' : 
                              opt === dailyCard.answer ? 'bg-green-400 text-green-900 border-2 border-green-300' : 
                              dailyAnswered === opt ? 'bg-red-400 text-red-900' : 'bg-white/50 text-indigo-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 bg-indigo-500/50 rounded-2xl relative z-10">
                      <p className="text-indigo-100 font-bold text-sm mb-4">You don't have any flashcards yet!</p>
                      <button onClick={() => setActiveTab('decks')} className="bg-white text-indigo-700 text-xs font-black px-5 py-2.5 rounded-full hover:bg-indigo-50 transition-colors">Create a Deck</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Widgets Column (Span 1) */}
              <div className="space-y-6 md:space-y-8">
                
                {/* DYNAMIC Upcoming Milestones */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col max-h-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-black text-[#0F172A]">Upcoming Milestones</h3>
                    <button onClick={() => setIsAddingMilestone(!isAddingMilestone)} className={`text-blue-600 bg-blue-50 hover:bg-blue-100 w-7 h-7 rounded-full flex items-center justify-center transition-all font-bold text-lg ${isAddingMilestone ? 'rotate-45' : ''}`}>+</button>
                  </div>
                  
                  {isAddingMilestone && (
                    <form onSubmit={handleAddMilestone} className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 animate-fade-in shrink-0 shadow-inner">
                       <div onClick={() => document.getElementById('milestoneTitle')?.focus()} className="cursor-text w-full">
                         <input id="milestoneTitle" type="text" placeholder="Event Title" required value={newMilestoneTitle} onChange={e=>setNewMilestoneTitle(e.target.value)} className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400" />
                       </div>
                       <div className="flex gap-2">
                         <div onClick={() => document.getElementById('milestoneDate')?.focus()} className="cursor-text w-1/2">
                           <input id="milestoneDate" type="date" required value={newMilestoneDate} onChange={e=>setNewMilestoneDate(e.target.value)} className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400" />
                         </div>
                         <div onClick={() => document.getElementById('milestoneLocation')?.focus()} className="cursor-text w-1/2">
                           <input id="milestoneLocation" type="text" placeholder="Location/Room" value={newMilestoneLocation} onChange={e=>setNewMilestoneLocation(e.target.value)} className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400" />
                         </div>
                       </div>
                       <div className="flex gap-2 pt-1">
                         <button type="submit" className="flex-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">Add</button>
                         <button type="button" onClick={()=>setIsAddingMilestone(false)} className="flex-1 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                       </div>
                    </form>
                  )}

                  <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1 relative">
                    {milestones.length === 0 ? (
                      <div className="text-center text-slate-400 font-bold text-xs py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        No upcoming events.<br/>Click the + to add one!
                      </div>
                    ) : (
                      milestones.map(m => {
                        const dateObj = new Date(m.date + 'T00:00:00');
                        const diffDays = Math.ceil((dateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                        let dueText = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : diffDays < 0 ? `${Math.abs(diffDays)} days ago` : `In ${diffDays} days`;
                        
                        return (
                          <div key={m.id} className="flex gap-4 items-start group relative p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 transition-transform ${m.color}`}>
                              {dateObj.getDate()}
                            </div>
                            <div className="flex-1 pr-6 min-w-0">
                              <p className="font-bold text-sm text-[#0F172A] leading-tight mb-0.5 truncate">{m.title}</p>
                              <p className={`text-[10px] md:text-xs font-medium truncate ${diffDays <= 1 && diffDays >= 0 ? 'text-orange-600 font-bold' : 'text-slate-500'}`}>
                                {dueText} • {m.location}
                              </p>
                            </div>
                            <button onClick={() => handleDeleteMilestone(m.id)} className="absolute right-2 top-3 text-slate-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <Icons.Trash />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* AUTOMATED CREATOR STATUS WIDGET */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-indigo-500"></div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-black text-[#0F172A]">Creator Status</h3>
                    <div className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1 opacity-60">
                      <Icons.Settings /> <span className="text-[9px] font-bold uppercase">Solo</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                       <div className="relative shrink-0">
                         <img src="https://github.com/sojukai-ece.png" alt="sojukai-ece" className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover" />
                         <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors duration-300 ${devStatus === 'Online' ? 'bg-green-500' : devStatus === 'Updating' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                       </div>
                       <div className="min-w-0">
                         <span className="block font-bold text-sm text-[#0F172A] leading-tight truncate">sojukai.nvl</span>
                         <a href="https://github.com/sojukai-ece" target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold transition-all truncate block">@sojukai-ece</a>
                       </div>
                    </div>
                    
                    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm flex items-center gap-1.5 shrink-0 ${
                      devStatus === 'Online' ? 'bg-green-50 text-green-700 border-green-200' :
                      devStatus === 'Updating' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        devStatus === 'Online' ? 'bg-green-500 animate-pulse' :
                        devStatus === 'Updating' ? 'bg-blue-500 animate-bounce' :
                        'bg-slate-400'
                      }`}></div>
                      {devStatus}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* PROFILE HUB */}
        {activeTab === 'profile' && user && (
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in flex flex-col lg:flex-row gap-6 md:gap-10">
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
              <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden relative hover:shadow-lg transition-shadow">
                <div className="h-32 bg-linear-to-r from-blue-600 to-indigo-700 relative">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
                <div className="px-6 pb-8 pt-0 flex flex-col items-center relative">
                  
                  {/* FIXED AVATAR UPLOAD HITBOX */}
                  <div 
                    onClick={() => avatarInputRef.current?.click()} 
                    className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-white -mt-14 mb-4 relative group cursor-pointer overflow-hidden z-10 flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    {isUploadingAvatar ? (
                       <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-[#0F172A]">{user.email?.charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <Icons.Camera />
                      <span className="text-[9px] font-bold uppercase mt-1">Upload</span>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarUpload} />
                  
                  <h2 className="text-2xl font-black text-[#0F172A] text-center leading-tight">{displayName || user.email?.split('@')[0]}</h2>
                  <p className="text-sm font-bold text-blue-600 mt-1">{course || 'Electronics Engineering'}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5 text-center px-4">{university || 'Polytechnic University of the Philippines'}</p>
                  <div className={`mt-6 w-full rounded-2xl p-4 flex items-center justify-between border ${getAcademicRank().bg} border-transparent`}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getAcademicRank().icon}</div>
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${getAcademicRank().color} opacity-70`}>Rank</p>
                        <p className={`text-sm font-bold ${getAcademicRank().color}`}>{getAcademicRank().title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleSignOut} className="bg-white border border-red-200 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 hover:shadow-md transition-all cursor-pointer">
                <Icons.LogOut /> Sign Out
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white rounded-4xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-[#0F172A] mb-6">Profile Settings</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* EXPANDED TEXTBOX HITBOXES */}
                    <div onClick={() => document.getElementById('displayName')?.focus()} className="cursor-text group">
                      <label htmlFor="displayName" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 ml-1 cursor-text group-hover:text-blue-500 transition-colors">Display Name</label>
                      <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Juan Dela Cruz" className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                    </div>
                    
                    <div onClick={() => document.getElementById('courseName')?.focus()} className="cursor-text group">
                      <label htmlFor="courseName" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 ml-1 cursor-text group-hover:text-blue-500 transition-colors">Course / Major</label>
                      <input id="courseName" type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Electronics Engineering" className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                    </div>
                  </div>
                  
                  <div onClick={() => document.getElementById('universityName')?.focus()} className="cursor-text group">
                    <label htmlFor="universityName" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 ml-1 cursor-text group-hover:text-blue-500 transition-colors">University</label>
                    <input id="universityName" type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. Polytechnic University of the Philippines" className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                  
                  <div onClick={() => document.getElementById('bioText')?.focus()} className="cursor-text group">
                    <label htmlFor="bioText" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 ml-1 cursor-text group-hover:text-blue-500 transition-colors">Bio / Study Goals</label>
                    <textarea id="bioText" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Share a bit about yourself or your academic goals..." className="w-full h-28 bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:bg-white resize-none transition-colors" />
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <button type="submit" className="bg-[#0F172A] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-colors w-full md:w-auto hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">🔥</div>
                  <p className="text-[10px] font-extrabold text-orange-800 uppercase tracking-widest mb-1">Active Streak</p>
                  <p className="text-2xl font-black text-orange-600">{activeStreak} Days</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">⏱️</div>
                  <p className="text-[10px] font-extrabold text-blue-800 uppercase tracking-widest mb-1">Focus Time</p>
                  <p className="text-2xl font-black text-blue-600">{getFormattedStudyTime()}</p>
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
              <button onClick={() => setIsAddingFolder(!isAddingFolder)} className="bg-[#0F172A] text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:bg-slate-800 hover:-translate-y-0.5 transition-all cursor-pointer">＋ New Deck</button>
            </div>

            {isAddingFolder && (
              <form 
                onSubmit={handleAddFolder} 
                onClick={() => document.getElementById('newDeckName')?.focus()}
                className="mb-6 flex flex-col sm:flex-row gap-2 md:gap-3 animate-fade-in cursor-text"
              >
                <input id="newDeckName" type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name your new deck..." className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 shadow-sm w-full" autoFocus />
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm w-full sm:w-auto hover:bg-blue-700 cursor-pointer">Create</button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {folders.length === 0 ? (
                  <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl md:rounded-3xl p-8 md:p-10 text-center text-slate-500 font-bold text-sm md:text-base">
                    No decks created yet. Click the + above to start studying!
                  </div>
              ) : (
                folders.map((folder, idx) => (
                  <div key={folder.id} onClick={() => openFolder(folder)} className="bg-white rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden p-5 md:p-6 pl-7 md:pl-8 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 group flex flex-col justify-between min-h-30">
                    <div className={`absolute left-0 top-0 bottom-0 w-2.5 md:w-3 ${getDeckColor(idx)} group-hover:w-4 transition-all duration-300`}></div>
                    <div className="mb-4 pr-2">
                      <h3 className="font-black text-[#0F172A] text-base md:text-lg group-hover:text-blue-600 transition-colors line-clamp-2">{folder.name}</h3>
                      <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Custom Deck</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto border-t border-slate-50 pt-3 md:pt-4">
                      <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">Ready to study</span>
                      <span className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 font-bold text-lg md:text-xl transition-all">→</span>
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
             <button onClick={() => setSelectedFolder(null)} className="text-xs md:text-sm font-bold text-slate-500 hover:text-[#0F172A] flex items-center gap-2 mb-4 md:mb-6 transition-colors cursor-pointer">← Back to Library</button>
             
             <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-4xl border border-slate-200 shadow-sm mb-6 md:mb-8 relative">
                <button onClick={() => handleDeleteFolder(selectedFolder.id)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Deck">
                  <Icons.Trash />
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5 md:pb-6 mb-5 md:mb-6 pr-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-black text-[#0F172A] line-clamp-2">{selectedFolder.name}</h2>
                    <p className="text-xs md:text-base text-slate-500 font-medium mt-1">{flashcards.length} cards in this deck</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <select onChange={(e) => setSelectedTechnique(e.target.value as any)} value={selectedTechnique} className="bg-slate-50 border border-slate-200 text-[#0F172A] font-bold text-sm px-4 py-3 rounded-xl outline-none focus:border-blue-400 w-full sm:w-auto transition-colors cursor-pointer">
                      <option value="active-recall">Active Recall</option>
                      <option value="feynman">Feynman Technique</option>
                      <option value="blurting">Blurting Method</option>
                    </select>
                    <button onClick={launchStudyMode} disabled={flashcards.length === 0} className="bg-[#0F172A] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 w-full sm:w-auto text-center cursor-pointer">
                      Launch 🚀
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <form onSubmit={handleAddFlashcard} className="flex flex-col md:flex-row gap-2 md:gap-3">
                     <div onClick={() => document.getElementById('newCardFront')?.focus()} className="flex-1 cursor-text w-full">
                       <input id="newCardFront" type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required placeholder="Front (Term / Concept)" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                     </div>
                     <div onClick={() => document.getElementById('newCardBack')?.focus()} className="flex-1 cursor-text w-full">
                       <input id="newCardBack" type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required placeholder="Back (Definition)" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                     </div>
                     <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors w-full md:w-auto cursor-pointer">Add Card</button>
                  </form>
                  
                  <div className="flex items-center gap-4 my-2 opacity-70">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OR</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingPDF} className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed font-bold text-sm transition-all cursor-pointer ${isUploadingPDF ? 'bg-indigo-50 border-indigo-200 text-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'}`}>
                    {isUploadingPDF ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analyzing Document...
                      </>
                    ) : (
                      <><Icons.File /> Auto-Generate from PDF</>
                    )}
                  </button>
                  <input type="file" ref={fileInputRef} accept=".pdf" className="hidden" onChange={handlePDFUpload} />
                </div>
             </div>

             <div className="space-y-3 mt-8">
                <h4 className="font-extrabold text-[#0F172A] px-2 mb-3 md:mb-4">Cards in this deck</h4>
                {flashcards.map((card) => (
                  <div key={card.id} className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2 md:gap-4 relative group hover:shadow-md transition-shadow">
                    <div className="flex-1 pb-3 sm:pb-0 sm:border-r border-slate-100 sm:pr-8">
                      <p className="font-bold text-sm md:text-base text-[#0F172A]">{card.question}</p>
                    </div>
                    <div className="flex-1 pr-8 sm:pr-10 pt-2 sm:pt-0">
                      <p className="font-medium text-sm md:text-base text-slate-600">{card.answer}</p>
                    </div>
                    <button onClick={() => handleDeleteCard(card.id)} className="absolute top-2 right-2 sm:top-auto sm:bottom-4 sm:right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all md:opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 cursor-pointer" title="Delete Card">
                      <Icons.Trash />
                    </button>
                  </div>
                ))}
                {flashcards.length === 0 && <p className="text-center text-slate-400 font-bold py-6 text-sm">This deck is empty. Add a card manually or upload a PDF above.</p>}
             </div>
          </div>
        )}

        {/* --- FOCUS HUB --- */}
        {activeTab === 'focus-hub' && (
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in flex flex-col lg:flex-row gap-6 md:gap-10">
            <div className="flex-1 bg-white rounded-4xl p-6 md:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div className={`absolute inset-0 opacity-[0.03] transition-colors duration-1000 ${pomodoroMode === 'work' ? 'bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-green-900 via-transparent to-transparent'}`}></div>
              <div className="relative z-10 w-full flex flex-col items-center">
                <div className="flex gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Focus Time</label>
                    <select value={selectedWorkTime} onChange={handleWorkTimeChange} disabled={pomodoroIsActive} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none disabled:opacity-50 text-center cursor-pointer transition-colors">
                      <option value={1500}>25 min</option>
                      <option value={2700}>45 min</option>
                      <option value={3600}>60 min</option>
                      <option value={5400}>90 min</option>
                      <option value={7200}>120 min</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Break Time</label>
                    <select value={selectedBreakTime} onChange={handleBreakTimeChange} disabled={pomodoroIsActive} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none disabled:opacity-50 text-center cursor-pointer transition-colors">
                      <option value={300}>5 min</option>
                      <option value={600}>10 min</option>
                      <option value={900}>15 min</option>
                      <option value={1200}>20 min</option>
                      <option value={1800}>30 min</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200 w-full max-w-xs md:max-w-sm mb-8 md:mb-10">
                  <button onClick={() => { setPomodoroIsActive(false); setPomodoroMode('work'); setPomodoroTime(selectedWorkTime); }} className={`flex-1 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer ${pomodoroMode === 'work' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-slate-500 hover:text-slate-700'}`}>Focus</button>
                  <button onClick={() => { setPomodoroIsActive(false); setPomodoroMode('break'); setPomodoroTime(selectedBreakTime); }} className={`flex-1 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer ${pomodoroMode === 'break' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-slate-500 hover:text-slate-700'}`}>Break</button>
                </div>

                <div className="text-[5rem] sm:text-[6rem] md:text-[8rem] font-black text-[#0F172A] tracking-tighter tabular-nums mb-8 md:mb-10 leading-none drop-shadow-sm">
                  {formatClock(pomodoroTime)}
                </div>

                <button onClick={() => setPomodoroIsActive(!pomodoroIsActive)} className={`w-full max-w-xs md:max-w-sm py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg transition-all duration-300 cursor-pointer ${pomodoroIsActive ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-inner' : 'bg-[#0F172A] text-white hover:bg-slate-800 shadow-lg hover:-translate-y-1'}`}>
                  {pomodoroIsActive ? 'Pause Timer' : 'Start Timer'}
                </button>
              </div>
            </div>

            <div className="w-full lg:w-100 flex flex-col h-100 md:h-125 lg:h-auto bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 md:p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-base md:text-lg font-black text-[#0F172A]">Session Tasks</h3>
                <span className="text-[10px] md:text-xs font-bold text-slate-400">{tasks.filter(t=>t.completed).length} / {tasks.length} Done</span>
              </div>
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-2 md:space-y-3 custom-scrollbar bg-white">
                {tasks.length === 0 ? (
                  <p className="text-center text-slate-400 font-bold mt-10 text-xs md:text-sm">Add tasks to focus on.</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'} transition-all duration-200 group`}>
                      <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => toggleTask(task.id)}>
                        <button className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 group-hover:border-green-400'}`}>
                          {task.completed && <span className="text-[10px] font-black">✓</span>}
                        </button>
                        <span className={`text-sm font-bold truncate transition-all ${task.completed ? 'line-through text-slate-400' : 'text-[#0F172A]'}`}>{task.text}</span>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="p-1.5 md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all rounded-md cursor-pointer">
                        <Icons.Trash />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <form 
                onSubmit={handleAddTask} 
                onClick={() => document.getElementById('taskInput')?.focus()} 
                className="p-3 md:p-4 border-t border-slate-100 bg-slate-50 shrink-0 cursor-text flex"
              >
                <input 
                  id="taskInput"
                  type="text" 
                  value={newTaskInput} 
                  onChange={(e) => setNewTaskInput(e.target.value)} 
                  placeholder="Add a new task..." 
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-base md:text-sm font-bold outline-none focus:border-blue-500 shadow-sm transition-colors cursor-text" 
                />
              </form>
            </div>
          </div>
        )}

        {/* ACTIVE RECALL UI */}
        {selectedFolder && activeStudyMode === 'active-recall' && activeTab === 'decks' && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <button onClick={() => setActiveStudyMode('none')} className="text-xs md:text-sm font-bold text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-sm transition-colors cursor-pointer">Exit Study</button>
              <span className="font-bold text-xs md:text-sm text-slate-400">{currentCardIndex + 1} / {flashcards.length}</span>
            </div>
            {currentCardIndex >= flashcards.length ? (
              <div className="bg-white rounded-2xl md:rounded-3xl p-10 md:p-16 text-center shadow-sm border border-slate-200 animate-fade-in">
                <div className="text-5xl md:text-6xl mb-4 md:mb-6 animate-bounce">🏆</div>
                <h3 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-6 md:mb-8">Deck Completed!</h3>
                <button onClick={() => { setCurrentCardIndex(0); setupActiveRecallCard(0); }} className="bg-[#0F172A] text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all text-sm md:text-base w-full sm:w-auto cursor-pointer">Restart Study</button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl md:rounded-4xl p-6 md:p-12 shadow-md border border-slate-200">
                <div className="mb-8 md:mb-10 text-center animate-fade-in">
                  <h2 className="text-xl md:text-3xl font-extrabold text-[#0F172A] leading-tight">
                    {flashcards[currentCardIndex].question}
                  </h2>
                </div>
                <div className="flex flex-col gap-2 md:gap-3 mb-6 md:mb-8">
                  {currentOptions.map((opt, idx) => {
                    const labels = ['A', 'B', 'C', 'D'];
                    let btnClass = "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 font-bold text-left transition-all duration-200 text-sm md:text-base w-full group cursor-pointer ";
                    let labelClass = "w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-xs md:text-sm font-black transition-colors shrink-0 ";
                    
                    if (!isAnswerChecked) {
                      if (selectedAnswer === opt) {
                        btnClass += "border-[#0F172A] bg-slate-50 text-[#0F172A] scale-[1.01] shadow-sm";
                        labelClass += "bg-[#0F172A] text-white";
                      } else {
                        btnClass += "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm";
                        labelClass += "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700";
                      }
                    } else {
                      if (opt === flashcards[currentCardIndex].answer) {
                        btnClass += "border-green-500 bg-green-50 text-green-700 shadow-sm scale-[1.01]";
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
                    <button onClick={handleCheckAnswer} disabled={!selectedAnswer} className="w-full sm:w-auto bg-blue-600 text-white font-bold px-8 md:px-12 py-3 md:py-4 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:opacity-50 text-sm md:text-base transition-all cursor-pointer">
                      Check Answer
                    </button>
                  ) : (
                    <button onClick={nextCard} className="w-full sm:w-auto bg-[#0F172A] text-white font-bold px-8 md:px-12 py-3 md:py-4 rounded-xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 text-sm md:text-base transition-all cursor-pointer">
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
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-fade-in relative z-10">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <button onClick={() => setActiveStudyMode('none')} className="text-xs md:text-sm font-bold text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-sm transition-colors cursor-pointer">Exit Session</button>
              <span className="font-bold text-xs md:text-sm text-slate-400">{currentCardIndex + 1} / {flashcards.length}</span>
            </div>
            {currentCardIndex >= flashcards.length ? (
              <div className="bg-white rounded-2xl md:rounded-3xl p-10 md:p-16 text-center shadow-sm border border-slate-200 animate-fade-in">
                <div className="text-5xl md:text-6xl mb-4 md:mb-6 drop-shadow-md animate-bounce">🎓</div>
                <h3 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-6 md:mb-8">Mastery Complete!</h3>
                <button onClick={() => setCurrentCardIndex(0)} className="bg-[#0F172A] text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all text-sm md:text-lg w-full sm:w-auto cursor-pointer">Teach Again</button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl md:rounded-4xl p-6 md:p-12 shadow-lg border border-slate-200 relative overflow-hidden transition-all duration-500 cursor-text" onClick={() => document.getElementById('feynmanInput')?.focus()}>
                <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1 md:mb-2">Explain this concept</span>
                  <h2 className="text-2xl md:text-4xl font-black text-[#0F172A]">{flashcards[currentCardIndex].question}</h2>
                </div>
                <textarea 
                  id="feynmanInput"
                  value={feynmanInput} 
                  onChange={(e) => setFeynmanInput(e.target.value)} 
                  placeholder="Explain it simply, as if you are teaching a freshman..." 
                  className="w-full h-40 md:h-56 bg-slate-50/80 border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-6 text-slate-700 text-base md:text-lg font-medium focus:outline-none focus:border-indigo-400 focus:bg-white focus:shadow-md resize-none mb-6 md:mb-8 transition-all"
                />
                {!isCardFlipped ? (
                  <button onClick={handleFeynmanCheck} disabled={!feynmanInput.trim()} className="w-full bg-indigo-600 text-white font-bold text-sm md:text-lg px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1 disabled:hover:translate-y-0 disabled:opacity-50 transition-all cursor-pointer">Check Understanding 🔍</button>
                ) : (
                  <div className="animate-fade-in bg-indigo-50 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-indigo-100 mb-6 md:mb-8 shadow-sm">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-400 block mb-2 md:mb-3">Actual Answer</span>
                    <p className="font-bold text-indigo-900 text-lg md:text-xl leading-relaxed">{flashcards[currentCardIndex].answer}</p>
                  </div>
                )}
                {isCardFlipped && <button onClick={nextCard} className="w-full bg-[#0F172A] text-white font-bold text-sm md:text-lg px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">Next Concept →</button>}
              </div>
            )}
          </div>
        )}

        {/* BLURTING METHOD UI */}
        {selectedFolder && activeStudyMode === 'blurting' && activeTab === 'decks' && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-fade-in relative z-10">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <button onClick={() => setActiveStudyMode('none')} className="text-xs md:text-sm font-bold text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-sm transition-colors cursor-pointer">Exit Session</button>
              <span className="font-bold text-xs md:text-sm text-slate-400">{currentCardIndex + 1} / {flashcards.length}</span>
            </div>
            
            {currentCardIndex >= flashcards.length ? (
              <div className="bg-white rounded-2xl md:rounded-3xl p-10 md:p-16 text-center shadow-sm border border-slate-200 animate-fade-in">
                <div className="text-5xl md:text-6xl mb-4 md:mb-6 drop-shadow-md animate-bounce">🎓</div>
                <h3 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-6 md:mb-8">Mastery Complete!</h3>
                <button onClick={() => setCurrentCardIndex(0)} className="bg-[#0F172A] text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all text-sm md:text-lg w-full sm:w-auto cursor-pointer">Study Again</button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl md:rounded-4xl p-6 md:p-12 shadow-lg border border-slate-200 relative overflow-hidden flex flex-col transition-all duration-500 cursor-text" onClick={() => document.getElementById('blurtingInput')?.focus()}>
                <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-500 block mb-1 md:mb-2">Blurt everything you know</span>
                    <h2 className="text-2xl md:text-4xl font-black text-[#0F172A]">{flashcards[currentCardIndex].question}</h2>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shrink-0 shadow-inner">
                    <span className={`text-2xl font-black tabular-nums ${isBlurtingActive ? 'text-teal-600' : 'text-[#0F172A]'}`}>{formatClock(blurtingTimeLeft)}</span>
                    {!blurtingFinished && (
                      <button onClick={(e) => { e.stopPropagation(); setIsBlurtingActive(!isBlurtingActive); }} className={`w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold transition-all hover:scale-110 shadow-sm cursor-pointer ${isBlurtingActive ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'}`}>
                        {isBlurtingActive ? '⏸' : '▶'}
                      </button>
                    )}
                  </div>
                </div>

                {!blurtingFinished ? (
                  <>
                    <textarea 
                      id="blurtingInput"
                      value={blurtingInput} 
                      onChange={(e) => setBlurtingInput(e.target.value)} 
                      disabled={!isBlurtingActive}
                      placeholder={isBlurtingActive ? "Start typing everything you can remember..." : "Click the play button on the timer to start blurting!"} 
                      className="w-full h-40 md:h-64 bg-slate-50/80 border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-6 text-slate-700 text-base md:text-lg font-medium focus:outline-none focus:border-teal-400 focus:bg-white focus:shadow-md resize-none mb-6 md:mb-8 transition-all disabled:opacity-50"
                    />
                    <button onClick={(e) => { e.stopPropagation(); setIsBlurtingActive(false); setBlurtingFinished(true); setCardsReviewed(prev => prev + 1); }} disabled={!blurtingInput.trim() && blurtingTimeLeft > 0} className="w-full bg-teal-600 text-white font-bold text-sm md:text-lg px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-teal-700 hover:shadow-lg hover:-translate-y-1 disabled:hover:translate-y-0 disabled:opacity-50 transition-all cursor-pointer">
                      Finish & Compare 🔍
                    </button>
                  </>
                ) : (
                  <div className="animate-fade-in flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 block mb-2 md:mb-3">Your Notes</span>
                        <p className="font-medium text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{blurtingInput || "No notes written."}</p>
                      </div>
                      <div className="bg-teal-50 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-teal-100 shadow-sm">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-teal-600 block mb-2 md:mb-3">Actual Answer</span>
                        <p className="font-bold text-teal-900 text-base md:text-lg leading-relaxed">{flashcards[currentCardIndex].answer}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
                      <button onClick={(e) => { e.stopPropagation(); setCorrectAnswers(prev => prev + 1); setBlurtingFinished(false); setBlurtingInput(''); setBlurtingTimeLeft(300); nextCard(); }} className="flex-1 bg-[#0F172A] text-white font-bold text-sm md:text-base px-6 py-4 rounded-xl hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">I Got It Right</button>
                      <button onClick={(e) => { e.stopPropagation(); setBlurtingFinished(false); setBlurtingInput(''); setBlurtingTimeLeft(300); nextCard(); }} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold text-sm md:text-base px-6 py-4 rounded-xl hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">Needs Work</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- AUXILINK AI --- */}
        {activeTab === 'auxilink-ai' && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center animate-fade-in">
            <div className="text-5xl md:text-6xl mb-4 md:mb-6 drop-shadow-md animate-float inline-block">🤖</div>
            <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] mb-3 md:mb-4">Auxilink AI Module</h2>
            <p className="text-base md:text-lg text-slate-500 font-medium max-w-xl mx-auto">This intelligent engineering assistant is currently under development for iStud.</p>
          </div>
        )}

        {/* --- COMMUNITY CHAT --- */}
        {activeTab === 'community' && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in h-full flex flex-col">
            <div className="bg-white rounded-3xl md:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col flex-1 overflow-hidden min-h-[60vh] md:min-h-150">
              <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-lg md:text-xl font-black text-[#0F172A]">Campus Lounge</h3>
                <span className="bg-green-100 text-green-700 text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-full font-bold flex items-center gap-1.5 md:gap-2 shadow-sm"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-50 animate-pulse"></span> Live</span>
              </div>
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-[#F8FAFC]">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-slate-400 font-bold mt-10 text-sm md:text-base">No messages yet.</p>
                ) : (
                  chatMessages.map((msg) => { 
                    const isMe = user?.id === msg.user_id; 
                    const displayAvatar = (isMe && avatarUrl) ? avatarUrl : msg.avatar_url;
                    
                    return ( 
                      <div key={msg.id} className={`flex items-end gap-2 md:gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
                        {displayAvatar && !displayAvatar.startsWith('blob:') ? (
                          <img src={displayAvatar} alt="Avatar" className="w-8 h-8 min-w-8 min-h-8 aspect-square rounded-full object-cover shrink-0 border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="w-8 h-8 min-w-8 min-h-8 aspect-square rounded-full bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">{msg.user_name.charAt(0).toUpperCase()}</div>
                        )}
                        <div className={`max-w-[85%] md:max-w-md p-3 md:p-4 rounded-2xl shadow-sm flex flex-col ${isMe ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-[#0F172A] rounded-bl-sm'}`}> 
                          <span className={`font-bold text-[9px] md:text-[10px] uppercase tracking-wider mb-1 ${isMe ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                            {isMe ? 'You' : msg.user_name}
                          </span> 
                          <p className="text-sm md:text-base font-medium leading-relaxed">{msg.text}</p> 
                        </div> 
                      </div>
                    ); 
                  })
                )}
              </div>
              <form 
                onSubmit={handleSendMessage} 
                onClick={() => document.getElementById('chatInput')?.focus()} 
                className="p-3 md:p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0 cursor-text"
              >
                <input 
                  id="chatInput"
                  type="text" 
                  value={newChatInput} 
                  onChange={(e) => setNewChatInput(e.target.value)} 
                  placeholder={user ? "Type a message..." : "Log in to chat!"} 
                  disabled={!user || isUploadingAvatar} 
                  className="flex-1 bg-slate-50 px-4 md:px-5 py-3 rounded-xl text-base md:text-sm font-bold outline-none focus:border-blue-400 border border-slate-200 disabled:opacity-50 transition-colors" 
                />
                <button type="submit" disabled={!user || !newChatInput.trim() || isUploadingAvatar} className="bg-blue-600 text-white px-4 md:px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 shrink-0 transition-colors cursor-pointer">
                  {isUploadingAvatar ? 'Wait...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
