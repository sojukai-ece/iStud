import React from 'react';

export default function Navbar() {
  return (
    <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
      <div className="flex items-center gap-2">
        {/* Cartoony Logo Badge */}
        <div className="bg-blue-500 border-4 border-zinc-900 shadow-[4px_4px_0px_0px_#18181b] rounded-2xl px-4 py-1.5 transform -rotate-2 hover:rotate-0 transition-transform cursor-pointer">
          <span className="text-2xl font-black tracking-wider text-white">
            iSt<span className="text-yellow-300 underline decoration-4">u</span>d
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="hidden sm:block font-bold px-5 py-2.5 rounded-xl border-3 border-transparent hover:bg-amber-100 transition-colors">
          Study Guides
        </button>
        <button className="bg-yellow-400 font-black px-6 py-2.5 rounded-xl border-4 border-zinc-900 shadow-[4px_4px_0px_0px_#18181b] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#18181b] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          Open App 🚀
        </button>
      </div>
    </nav>
  );
}