'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

interface MemberRecord {
  _id: string;
  firstName: string;
  lastName: string;
  churchId?: string;
  unitId?: string;
  bavanakutayimaId?: string;
  houseId?: string | { _id: string };
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

const EMPTY_FILTERS = { church: '', unit: '', bavanakutayima: '', house: '', member: '' };

export default function SpiritualActivitiesPage() {
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [allMembers, setAllMembers] = useState<MemberRecord[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekStr());
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const api = createRoleApi('super_admin');

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/spiritual-activities?includeAllStatuses=true');
      setActivities(res.data.data || []);
    } catch {
      toast.error('Failed to load spiritual activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    api.get('/churches').then((r) => setChurches(r.data.data || [])).catch(() => {});
    api.get('/members').then((r) => setAllMembers(r.data.data || [])).catch(() => {});
  }, [fetchActivities]);

  // Cascading fetches
  useEffect(() => {
    if (filters.church) {
      api.get(`/units?churchId=${filters.church}`).then((r) => setUnits(r.data.data || [])).catch(() => {});
    } else {
      setUnits([]);
    }
  }, [filters.church]);

  useEffect(() => {
    if (filters.unit) {
      api.get(`/bavanakutayimas?unitId=${filters.unit}`).then((r) => setBavanakutayimas(r.data.data || [])).catch(() => {});
    } else {
      setBavanakutayimas([]);
    }
  }, [filters.unit]);

  useEffect(() => {
    if (filters.bavanakutayima) {
      api.get(`/houses?bavanakutayimaId=${filters.bavanakutayima}`).then((r) => setHouses(r.data.data || [])).catch(() => {});
    } else {
      setHouses([]);
    }
  }, [filters.bavanakutayima]);

  // ── Member map for hierarchy lookup ──────────────────────────────────────

  const memberMap = useMemo(() => {
    const m = new Map<string, MemberRecord>();
    allMembers.forEach((mem) => m.set(mem._id, mem));
    return m;
  }, [allMembers]);

  // Member dropdown options — scoped to the narrowest selected filter
  const memberOptions = useMemo(() => {
    let pool = allMembers;
    if (filters.house) {
      pool = allMembers.filter((m) => {
        const hid = typeof m.houseId === 'object' ? m.houseId?._id : m.houseId;
        return hid === filters.house;
      });
    } else if (filters.bavanakutayima) {
      pool = allMembers.filter((m) => m.bavanakutayimaId === filters.bavanakutayima);
    } else if (filters.unit) {
      pool = allMembers.filter((m) => m.unitId === filters.unit);
    } else if (filters.church) {
      pool = allMembers.filter((m) => m.churchId === filters.church);
    } else {
      return []; // No scope — don't show all members
    }
    return pool.map((m) => ({ value: m._id, label: `${m.firstName} ${m.lastName}`.trim() }));
  }, [allMembers, filters.church, filters.unit, filters.bavanakutayima, filters.house]);

  // ── Filter by week ────────────────────────────────────────────────────────

  const weekMonday = getWeekMonday(selectedWeek);
  const weekSunday = new Date(weekMonday.getTime() + 6 * 86400000 + 86399999);
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

  // ── Filter by hierarchy ───────────────────────────────────────────────────

  const filteredActivities = weeklyActivities.filter((a) => {
    const actMemberId = a.memberId?._id;
    if (!actMemberId) return false;

    // Direct member filter
    if (filters.member) return actMemberId === filters.member;

    // Hierarchy filter — look up member record
    const mem = memberMap.get(actMemberId);
    if (!mem) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

    const houseId = typeof mem.houseId === 'object' ? mem.houseId?._id : mem.houseId;

    if (filters.house && houseId !== filters.house) return false;
    if (filters.bavanakutayima && mem.bavanakutayimaId !== filters.bavanakutayima) return false;
    if (filters.unit && mem.unitId !== filters.unit) return false;
    if (filters.church && mem.churchId !== filters.church) return false;

    return true;
  });

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
        const map: Record<string, { label: string; cls: string }> = {
          mass:    { label: 'Mass',    cls: 'bg-blue-100 text-blue-800' },
          fasting: { label: 'Fasting', cls: 'bg-amber-100 text-amber-800' },
          prayer:  { label: 'Prayer',  cls: 'bg-purple-100 text-purple-800' },
        };
        const { label, cls } = map[activityType] ?? { label: activityType, cls: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 rounded text-xs font-medium ${cls}`}>{label}</span>;
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
          return days.length ? `${days.length}d (${days.map(d => d.slice(0, 3)).join(', ')})` : '-';
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
          <button onClick={() => setSelectedWeek(shiftWeek(selectedWeek, -1))} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500 font-medium">Selected Week</p>
            <p className="text-base font-bold text-gray-800">{weekLabel(selectedWeek)}</p>
          </div>
          <button onClick={() => setSelectedWeek(shiftWeek(selectedWeek, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition">
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
            <div><p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Mass</p><p className="text-3xl font-bold text-blue-800">{stats.mass}</p></div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
            <div><p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Fasting</p><p className="text-3xl font-bold text-amber-800">{stats.fasting}</p></div>
            <Activity className="w-8 h-8 text-amber-400" />
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
            <div><p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Prayer</p><p className="text-3xl font-bold text-purple-800">{stats.prayer}</p></div>
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        {/* Cascading filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600">Filter by Hierarchy</p>
            {Object.values(filters).some(Boolean) && (
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SearchableSelect
              label="Church"
              options={churches.map((c) => ({ value: c._id, label: c.name }))}
              value={filters.church}
              onChange={(v) => setFilters({ ...EMPTY_FILTERS, church: v })}
              placeholder="All Churches"
            />
            <SearchableSelect
              label="Unit"
              options={units.map((u) => ({ value: u._id, label: u.name }))}
              value={filters.unit}
              onChange={(v) => setFilters({ ...filters, unit: v, bavanakutayima: '', house: '', member: '' })}
              placeholder="All Units"
              disabled={!filters.church}
            />
            <SearchableSelect
              label="Bavanakutayima"
              options={bavanakutayimas.map((b) => ({ value: b._id, label: b.name }))}
              value={filters.bavanakutayima}
              onChange={(v) => setFilters({ ...filters, bavanakutayima: v, house: '', member: '' })}
              placeholder="All BKs"
              disabled={!filters.unit}
            />
            <SearchableSelect
              label="House"
              options={houses.map((h) => ({ value: h._id, label: h.familyName }))}
              value={filters.house}
              onChange={(v) => setFilters({ ...filters, house: v, member: '' })}
              placeholder="All Houses"
              disabled={!filters.bavanakutayima}
            />
            <SearchableSelect
              label="Member"
              options={memberOptions}
              value={filters.member}
              onChange={(v) => setFilters({ ...filters, member: v })}
              placeholder="All Members"
              disabled={!filters.church}
            />
          </div>
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
