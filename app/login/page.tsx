"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Authentication with Supabase
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Create a new user
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Success! Check your email for a confirmation link (if enabled in Supabase).");
      } else {
        // Log in an existing user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // If successful, instantly redirect to the Dashboard!
        router.push('/');
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 selection:bg-blue-500 selection:text-white">
      
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-8 left-8 text-slate-500 font-bold hover:text-[#1B365D] transition-colors flex items-center gap-2">
        ← Back to Campus
      </Link>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-[#1B365D] flex items-center justify-center shadow-lg mb-4 p-2 overflow-hidden">
            <Image 
              src="/istud-logo.png" 
              alt="iStud Logo" 
              width={50} 
              height={50}
              className="object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-3xl font-black text-[#1B365D] tracking-tight">
            {isSignUp ? 'Join iStud' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-2 text-center">
            {isSignUp 
              ? 'Create your account and start building your academic arsenal.' 
              : 'Enter your credentials to access your study decks.'}
          </p>
        </div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-extrabold text-[#1B365D] uppercase tracking-wide ml-1">University Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="scholar@university.edu" 
              className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-[#1B365D] focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-extrabold text-[#1B365D] uppercase tracking-wide ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-[#1B365D] focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]" />
                <span className="text-sm font-bold text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700">Forgot password?</a>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1B365D] text-white font-black text-base px-6 py-4 rounded-2xl shadow-[0_4px_0_0_#0F1E36] hover:shadow-[0_2px_0_0_#0F1E36] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Authenticating...' : (isSignUp ? 'Create Account 🚀' : 'Sign In')}
          </button>
        </form>

        {/* Toggle Sign Up / Log In */}
        <div className="mt-8 text-center">
          <p className="text-sm font-bold text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-[#1B365D] transition-colors"
            >
              {isSignUp ? 'Log In here' : 'Sign Up here'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
