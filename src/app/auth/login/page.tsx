"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password: password.trim(),
      });

      if (result?.error) {
        throw new Error('Invalid email or password');
      }

      router.push('/dashboard');
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-[20%] left-[10%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[10rem] animate-float" />
        <div className="absolute bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-primary/10 rounded-full blur-[10rem] animate-float" 
          style={{ animationDelay: '-10s' }}
        />
        <div className="absolute top-[50%] left-[50%] w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[10rem] animate-float"
          style={{ animationDelay: '-5s' }}
        />
      </div>

      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex items-center">
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={() => router.push('/')}
            className="mr-4 text-primary hover:text-primary/80 transition-colors"
            whileHover={{ scale: 1.1, rotate: -180 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </motion.button>
          <Link href="/" className="flex items-center">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-2xl font-bold text-primary"
            >
              BugBesty
            </motion.div>
          </Link>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-primary/20"
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2 text-primary">Welcome Back</h1>
              <p className="text-sm text-primary/70">Sign in to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-primary/20 text-white
                      focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-primary/20 text-white
                      focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium
                  hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-primary/70">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 