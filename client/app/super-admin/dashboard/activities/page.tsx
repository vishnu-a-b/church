'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ColumnDef } from '@tanstack/react-table';
import { createRoleApi } from '@/lib/roleApi';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

interface SpiritualActivity {
  _id: string;
  memberId: { _id: string; firstName: string; lastName: string } | null;
  activityType: string;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
  massDate?: string;
  fastingWeek?: string;
  fastingDays?: string[];
  prayerType?: string;
  prayerCount?: number;
  prayerWeek?: string;
}

// ── Week helpers ──────────────────────────────────────────────────────────────

function getISOWeekYear(d: Date): { week: number; year: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: date.getUTCFullYear() };
}

function getCurrentWeekStr(): string {
  const { week, year } = getISOWeekYear(new Date());
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getWeekMonday(weekStr: string): Date {
  const [yearStr, weekPart] = weekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const weekNum = parseInt(weekPart, 10);
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() === 0 ? 7 : jan4.getDay();
  return new Date(jan4.getTime() - (jan4Day - 1) * 86400000 + (weekNum - 1) * 7 * 86400000);
}

function shiftWeek(weekStr: string, delta: number): string {
  const monday = getWeekMonday(weekStr);
  const newDate = new Date(monday.getTime() + delta * 7 * 86400000);
  const { week, year } = getISOWeekYear(newDate);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function weekLabel(weekStr: string): string {
  const monday = getWeekMonday(weekStr);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const [, weekPart] = weekStr.split('-W');
  return `Week ${parseInt(weekPart, 10)} · ${fmt(monday)} – ${fmt(sunday)}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SpiritualActivitiesPage() {
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekStr());
  const [churchFilter, setChurchFilter] = useState('');
  const api = createRoleApi('super_admin');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/spiritual-activities?includeAllStatuses=true');
      setActivities(response.data.data || []);
    } catch {
      toast.error('Failed to load spiritual activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    api.get('/churches').then((r) => setChurches(r.data.data || [])).catch(() => {});
  }, [fetchActivities]);

  // ── Filter by week ────────────────────────────────────────────────────────

  const weekMonday = getWeekMonday(selectedWeek);
  const weekSunday = new Date(weekMonday.getTime() + 6 * 86400000 + 86399999);

  // Accept both padded "2026-W34" and unpadded "2026-W34"
  const weekVariants = (() => {
    const [yearStr, weekPart] = selectedWeek.split('-W');
    const n = parseInt(weekPart, 10);
    return [`${yearStr}-W${String(n).padStart(2, '0')}`, `${yearStr}-W${n}`];
  })();

  const weeklyActivities = activities.filter((a) => {
    if (a.activityType === 'mass' && a.massDate) {
      const d = new Date(a.massDate);
      return d >= weekMonday && d <= weekSunday;
    }
    if (a.activityType === 'prayer') return weekVariants.includes(a.prayerWeek || '');
    if (a.activityType === 'fasting') return weekVariants.includes(a.fastingWeek || '');
    return false;
  });

  const filteredActivities = churchFilter
    ? weeklyActivities.filter((a) => {
        const member = typeof a.memberId === 'object' && a.memberId ? a.memberId : null;
        return member && (member as any).churchId === churchFilter;
      })
    : weeklyActivities;

  const stats = {
    mass: filteredActivities.filter(a => a.activityType === 'mass').length,
    fasting: filteredActivities.filter(a => a.activityType === 'fasting').length,
    prayer: filteredActivities.filter(a => a.activityType === 'prayer').length,
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: ColumnDef<SpiritualActivity>[] = [
    {
      header: 'Member',
      cell: ({ row }) => {
        const m = row.original.memberId;
        return m ? `${m.firstName} ${m.lastName || ''}`.trim() : '-';
      },
    },
    {
      accessorKey: 'activityType',
      header: 'Activity',
      cell: ({ row }) => {
        const { activityType } = row.original;
        const labels: Record<string, string> = { mass: 'Mass', fasting: 'Fasting', prayer: 'Prayer' };
        const colors: Record<string, string> = {
          mass: 'bg-blue-100 text-blue-800',
          fasting: 'bg-amber-100 text-amber-800',
          prayer: 'bg-purple-100 text-purple-800',
        };
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${colors[activityType] ?? 'bg-gray-100 text-gray-800'}`}>
            {labels[activityType] ?? activityType}
          </span>
        );
      },
    },
    {
      header: 'Details',
      cell: ({ row }) => {
        const { activityType } = row.original;
        if (activityType === 'mass') {
          return row.original.massDate
            ? new Date(row.original.massDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
            : '-';
        }
        if (activityType === 'fasting') {
          const days = row.original.fastingDays || [];
          return days.length ? `${days.length} day${days.length > 1 ? 's' : ''} (${days.map(d => d.slice(0,3)).join(', ')})` : '-';
        }
        if (activityType === 'prayer') {
          const type = row.original.prayerType?.replace('_', ' ') ?? '';
          const count = row.original.prayerCount ?? 0;
          return `${type}${count ? ` × ${count}` : ''}`;
        }
        return '-';
      },
    },
    {
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.approvalStatus;
        if (s === 'approved') return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Approved</span>;
        if (s === 'rejected') return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Rejected</span>;
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Pending</span>;
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Spiritual Activities</h1>

        {/* Week navigator */}
        <div className="flex items-center gap-3 mb-6 bg-white rounded-xl shadow p-4">
          <button
            onClick={() => setSelectedWeek(shiftWeek(selectedWeek, -1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500 font-medium">Selected Week</p>
            <p className="text-base font-bold text-gray-800">{weekLabel(selectedWeek)}</p>
          </div>
          <button
            onClick={() => setSelectedWeek(shiftWeek(selectedWeek, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setSelectedWeek(getCurrentWeekStr())}
            className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            This Week
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Mass</p>
              <p className="text-3xl font-bold text-blue-800">{stats.mass}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Fasting</p>
              <p className="text-3xl font-bold text-amber-800">{stats.fasting}</p>
            </div>
            <Activity className="w-8 h-8 text-amber-400" />
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Prayer</p>
              <p className="text-3xl font-bold text-purple-800">{stats.prayer}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        {/* Church filter */}
        <div className="w-64 mb-4">
          <SearchableSelect
            label="Church"
            options={churches.map((c) => ({ value: c._id, label: c.name }))}
            value={churchFilter}
            onChange={setChurchFilter}
            placeholder="All Churches"
          />
        </div>
      </div>

      <DataTable
        data={filteredActivities}
        columns={columns}
        searchPlaceholder="Search member name..."
      />
    </div>
  );
}
