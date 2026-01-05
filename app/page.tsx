import Link from 'next/link';

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

const DEMO_CREDENTIALS = [
  {
    role: 'Admin',
    email: 'admin@waffleforever.com',
    password: 'admin123',
    icon: '👑',
  },
  {
    role: 'Manager',
    email: 'manager@waffleforever.com',
    password: 'manager123',
    icon: '🧇',
  },
  {
    role: 'Staff',
    email: 'staff@waffleforever.com',
    password: 'staff123',
    icon: '💼',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#9C27F5] via-[#6C63FF] to-[#1FA2FF] text-white flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid gap-10 lg:grid-cols-[1.05fr,0.95fr] items-center">
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
            <h2 className="text-3xl font-semibold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500">Enter your credentials to access the dashboard.</p>
          </div>
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                Email
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4">
                <span className="text-gray-400">📧</span>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@waffleforever.com"
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
                  placeholder="••••••••"
                  className="flex-1 bg-transparent py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#A855F7] via-[#7C3AED] to-[#2563EB] py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-transform hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </form>
          <div className="mt-8 rounded-2xl bg-gray-100 p-5 text-sm text-gray-700">
            <p className="font-semibold mb-4">Demo Credentials</p>
            <ul className="space-y-3">
              {DEMO_CREDENTIALS.map((demo) => (
                <li key={demo.role} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-medium">
                    <span>{demo.icon}</span>
                    {demo.role}
                  </span>
                  <span className="text-xs text-gray-500">
                    {demo.email} / {demo.password}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
