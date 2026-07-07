import { useEffect, useState } from 'react';
import { MessageSquare, Calendar, Users, Check, Clock, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

interface Stats {
  pendingQueries: number;
  todayAppointments: number;
  totalFarmers: number;
  resolvedQueries: number;
}

interface RecentMessage {
  id: string;
  officer_id: string;
  sender_role: 'farmer' | 'officer';
  content: string;
  created_at: string;
}

interface TodayAppointment {
  id: string;
  appointment_date: string;
  time_slot: string;
  reason: string | null;
  status: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

export default function OfficerDashboard() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    pendingQueries: 0,
    todayAppointments: 0,
    totalFarmers: 0,
    resolvedQueries: 0,
  });
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    // Get pending messages count
    const { data: messages } = await supabase
      .from('officer_messages')
      .select('id, officer_id, sender_role, content, created_at')
      .eq('sender_role', 'farmer')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get today's appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, appointment_date, time_slot, reason, status, user_id')
      .eq('appointment_date', today)
      .order('time_slot', { ascending: true });

    // Get total farmers count
    const { count: farmerCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'farmer');

    // Get resolved queries (messages with officer replies)
    const { count: resolvedCount } = await supabase
      .from('officer_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_role', 'officer');

    setStats({
      pendingQueries: messages?.length || 0,
      todayAppointments: appointments?.length || 0,
      totalFarmers: farmerCount || 0,
      resolvedQueries: resolvedCount || 0,
    });

    setRecentMessages(messages || []);
    setTodayAppointments((appointments || []).map(a => ({
      ...a,
      profiles: null,
    })));
    setLoading(false);
    setLastUpdated(new Date());
  }

  const statCards = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: lang === 'te' ? 'పెండింగ్ ప్రశ్నలు' : 'Pending Queries',
      value: stats.pendingQueries,
      color: 'accent',
      bg: 'bg-accent-50 dark:bg-accent-900/30',
      iconColor: 'text-accent-600 dark:text-accent-400',
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: lang === 'te' ? 'ఈరోజు అపాయింట్మెంట్‌లు' : "Today's Appointments",
      value: stats.todayAppointments,
      color: 'brand',
      bg: 'bg-brand-50 dark:bg-brand-900/30',
      iconColor: 'text-brand-600 dark:text-brand-400',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: lang === 'te' ? 'మొత్తం రైతులు' : 'Total Farmers',
      value: stats.totalFarmers,
      color: 'teal',
      bg: 'bg-teal-50 dark:bg-teal-900/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      icon: <Check className="w-5 h-5" />,
      label: lang === 'te' ? 'పరిష్కరించిన ప్రశ్నలు' : 'Resolved Queries',
      value: stats.resolvedQueries,
      color: 'green',
      bg: 'bg-green-50 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {lang === 'te' ? 'అధికారి డాష్‌బోర్డ్' : 'Officer Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'te' ? `స్వాగతం, ${profile?.full_name || 'అధికారి'}` : `Welcome, ${profile?.full_name || 'Officer'}`}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === 'te' ? `చివరి అప్‌డేట్: ${lastUpdated.toLocaleTimeString('te-IN')}` : `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title={lang === 'te' ? 'రిఫ్రెష్' : 'Refresh'}
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <span className={stat.iconColor}>{stat.icon}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Today's Appointments */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {lang === 'te' ? 'ఈరోజు అపాయింట్మెంట్‌లు' : "Today's Appointments"}
        </p>
        {todayAppointments.length === 0 ? (
          <Card className="p-6 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {lang === 'te' ? 'ఈరోజు అపాయింట్మెంట్‌లు లేవు' : 'No appointments today'}
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-gray-100 dark:divide-gray-700">
            {todayAppointments.slice(0, 5).map((apt, i) => (
              <div key={apt.id || i} className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{apt.time_slot}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {apt.reason || (lang === 'te' ? 'కారణం ఇవ్వలేదు' : 'No reason provided')}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    apt.status === 'confirmed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : apt.status === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Recent Farmer Queries */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {lang === 'te' ? 'ఇటీవలి రైతు ప్రశ్నలు' : 'Recent Farmer Queries'}
        </p>
        {recentMessages.length === 0 ? (
          <Card className="p-6 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {lang === 'te' ? 'ప్రశ్నలు లేవు' : 'No queries yet'}
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentMessages.slice(0, 5).map((msg, i) => (
              <div key={msg.id || i} className="p-3">
                <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{msg.content}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Quick Tips */}
      <Card className="p-4 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-900/30 dark:to-accent-900/30 border-0">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {lang === 'te' ? 'ఈ రోజు చిట్కా' : "Today's Tip"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {lang === 'te'
                ? 'రైతుల ప్రశ్నలకు త్వరగా స్పందించడం వల్ల వారిలో నమ్మకం పెరుగుతుంది. సాధ్యమైనంత త్వరగా ప్రతి సందేశానికి ప్రత్యుత్తరం ఇవ్వండి.'
                : 'Responding quickly to farmer queries builds trust. Try to reply to messages within 24 hours for best results.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
