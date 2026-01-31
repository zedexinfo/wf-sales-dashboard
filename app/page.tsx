'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const FEATURES = [
  {
    title: 'Real-time Analytics',
    description: 'Track every sale as it happens and react instantly.',
  },
  {
    title: 'Multi-Branch Support',
    description: 'Monitor every location from a single dashboard.',
  },
  {
    title: 'Rista POS Integration',
    description: 'Stay in sync with your existing POS infrastructure.',
  },
];



export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full bg-linear-to-br from-[#9C27F5] via-[#6C63FF] to-[#1FA2FF] text-white flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid gap-10 grid-cols-2 items-center">
        <section className="space-y-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/30 px-4 py-2 text-sm uppercase tracking-[0.45em] text-white/80">
            <span className="text-lg">🧇</span>
            Preview
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.45em] text-white/70 uppercase mb-4">
              Sales Analytics Dashboard
            </p>
            <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1]">
              Waffle Forever
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              A unified command center for every store. Visualize KPIs, monitor multi-branch
              performance, and act on insights in seconds.
            </p>
          </div>
          <ul className="space-y-6">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-4">
                <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg">
                  ↗
                </span>
                <div>
                  <p className="text-lg font-semibold">{feature.title}</p>
                  <p className="text-white/80 text-sm">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-3xl shadow-2xl p-8 text-gray-900">
          <div className="space-y-2 mb-8 text-center">
            <h2 className="text-3xl font-semibold text-gray-900">
              Welcome Back
            </h2>
            <p className="text-gray-500">
              Enter your credentials to access the dashboard.
            </p>
          </div>
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                Email
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4">
                <span className="text-gray-400">📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@waffleforever.com"
                  required
                  className="flex-1 bg-transparent py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4">
                <span className="text-gray-400">🔒</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex-1 bg-transparent py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#A855F7] via-[#7C3AED] to-[#2563EB] py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
