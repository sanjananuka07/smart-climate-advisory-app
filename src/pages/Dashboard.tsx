import { LogOut, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <Sprout className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Agromihira</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back{user?.email ? `, ${user.email}` : ''}!
        </h1>
        <p className="text-gray-500 mt-2">You're signed in. Your dashboard is ready.</p>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { label: 'Active Fields', value: '12' },
            { label: 'Sensors Online', value: '38' },
            { label: 'Alerts Today', value: '3' },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
