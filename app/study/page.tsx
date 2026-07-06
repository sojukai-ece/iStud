"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

// A simple sample deck of engineering/math study cards
const sampleCards = [
  { question: "What is Ohm's Law formula?", answer: "V = I × R (Voltage = Current × Resistance)" },
  { question: "What does HTML stand for?", answer: "HyperText Markup Language" },
  { question: "What is the Boolean derivative of A + A?", answer: "A (Idempotent Law)" },
];

export default function StudyPage() {
  // React State: Keeps track of which card we are on, and whether it is flipped over!
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = sampleCards[currentIndex];

  // Functions to change cards
  const handleNext = () => {
    setIsFlipped(false); // Reset flip state
    setCurrentIndex((prev) => (prev + 1) % sampleCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + sampleCards.length) % sampleCards.length);
  };

  return (
    <div className="min-h-screen bg-amber-50 text-zinc-900 font-sans pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-8 text-center">
        {/* Back navigation using Next.js <Link> */}
        <div className="flex justify-between items-center mb-8">
          <Link 
            href="/" 
            className="font-black px-4 py-2 bg-white rounded-xl border-3 border-zinc-900 shadow-[3px_3px_0px_0px_#18181b] hover:-translate-y-0.5 transition-all inline-block"
          >
            ← Back Home
          </Link>
          <span className="font-extrabold text-zinc-500">
            Card {currentIndex + 1} of {sampleCards.length}
          </span>
        </div>

        <h1 className="text-4xl font-black mb-8">🧠 Smart Flashcards</h1>

        {/* The Interactive Flashcard Card */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`cursor-pointer min-h-[280] p-8 rounded-3xl border-4 border-zinc-900 shadow-[8px_8px_0px_0px_#18181b] flex flex-col items-center justify-center transition-all transform hover:-translate-y-1 ${
            isFlipped ? 'bg-emerald-300' : 'bg-white'
          }`}
        >
          <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-zinc-900 text-white rounded-full mb-6">
            {isFlipped ? "Answer" : "Question (Click to Flip)"}
          </span>
          
          <p className="text-2xl sm:text-3xl font-black max-w-lg leading-snug">
            {isFlipped ? currentCard.answer : currentCard.question}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={handlePrev}
            className="bg-yellow-400 font-black text-lg px-6 py-3 rounded-2xl border-4 border-zinc-900 shadow-[4px_4px_0px_0px_#18181b] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            ⏮ Prev
          </button>
          
          <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="bg-purple-300 font-black text-lg px-8 py-3 rounded-2xl border-4 border-zinc-900 shadow-[4px_4px_0px_0px_#18181b] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            🔄 Flip Card
          </button>

          <button 
            onClick={handleNext}
            className="bg-yellow-400 font-black text-lg px-6 py-3 rounded-2xl border-4 border-zinc-900 shadow-[4px_4px_0px_0px_#18181b] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            Next ⏭
          </button>
        </div>
      </main>
    </div>
  );
}