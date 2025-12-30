'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ColumnDef } from '@tanstack/react-table';
import { createRoleApi } from '@/lib/roleApi';
import { Activity } from 'lucide-react';

interface SpiritualActivity {
  _id: string;
  memberId: { _id: string; firstName: string; lastName: string; churchId?: string; unitId?: string; bavanakutayimaId?: string; houseId?: string };
  activityType: string;
  massDate?: string;
  massAttended?: boolean;
  fastingWeek?: string;
  fastingDays?: string[];
  prayerType?: string;
  prayerCount?: number;
  prayerWeek?: string;
  selfReported: boolean;
  reportedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export default function SpiritualActivitiesPage() {
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [allHouses, setAllHouses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    church: '',
    unit: '',
    bavanakutayima: '',
    house: '',
  });
  const api = createRoleApi('super_admin');

  useEffect(() => {
    fetchActivities();
    fetchChurches();
    fetchAllHouses();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (filters.church) {
      fetchUnits(filters.church);
    } else {
      setUnits([]);
    }
  }, [filters.church]);

  useEffect(() => {
    if (filters.unit) {
      fetchBavanakutayimas(filters.unit);
    } else {
      setBavanakutayimas([]);
    }
  }, [filters.unit]);

  useEffect(() => {
    if (filters.bavanakutayima) {
      fetchHouses(filters.bavanakutayima);
    } else {
      setHouses([]);
    }
  }, [filters.bavanakutayima]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/spiritual-activities');
      console.log('🙏 SPIRITUAL ACTIVITIES API RESPONSE:', response.data);
      console.log('🙏 SPIRITUAL ACTIVITIES DATA:', response.data.data);
      setActivities(response.data.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurches = async () => {
    try {
      const response = await api.get('/churches');
      console.log('⛪ CHURCHES DATA:', response.data.data);
      setChurches(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUnits = async (churchId: string) => {
    try {
      const response = await api.get(`/units?churchId=${churchId}`);
      setUnits(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBavanakutayimas = async (unitId: string) => {
    try {
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setBavanakutayimas(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setHouses(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllHouses = async () => {
    try {
      const response = await api.get('/houses');
      console.log('🏠 ALL HOUSES DATA:', response.data.data);
      console.log('🏠 SAMPLE HOUSE:', response.data.data?.[0]);
      setAllHouses(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      console.log('👥 MEMBERS DATA:', response.data.data);
      console.log('👥 SAMPLE MEMBER:', response.data.data?.[0]);
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const columns: ColumnDef<SpiritualActivity>[] = [
    {
      header: 'Member',
      cell: ({ row }) => `${row.original.memberId.firstName} ${row.original.memberId.lastName || ''}`,
    },
    {
      accessorKey: 'activityType',
      header: 'Activity Type',
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium capitalize">
          {row.original.activityType}
        </span>
      ),
    },
    {
      header: 'Details',
      cell: ({ row }) => {
        const { activityType } = row.original;
        if (activityType === 'mass') {
          return row.original.massDate ? new Date(row.original.massDate).toLocaleDateString('en-IN') : '-';
        }
        if (activityType === 'fasting') {
          return row.original.fastingDays?.join(', ') || '-';
        }
        if (activityType === 'prayer') {
          return `${row.original.prayerType} (${row.original.prayerCount || 0}x)`;
        }
        return '-';
      },
    },
    {
      header: 'Week',
      cell: ({ row }) => row.original.fastingWeek || row.original.prayerWeek || '-',
    },
    {
      accessorKey: 'selfReported',
      header: 'Reported',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.original.selfReported ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.selfReported ? 'Self-Reported' : 'Admin'}
        </span>
      ),
    },
    {
      header: 'Verified',
      cell: ({ row }) => (
        row.original.verifiedBy ? (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
            ✓ Verified
          </span>
        ) : (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            Pending
          </span>
        )
      ),
    },
    {
      accessorKey: 'reportedAt',
      header: 'Reported Date',
      cell: ({ row }) => row.original.reportedAt ? new Date(row.original.reportedAt).toLocaleDateString('en-IN') : '-',
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  const getMemberData = (memberId: any) => {
    if (typeof memberId === 'object' && memberId !== null) {
      // If memberId is populated, try to find full member data
      const fullMember = members.find((m) => m._id === memberId._id);
      return fullMember || memberId;
    }
    return members.find((m) => m._id === memberId);
  };

  const getHouseData = (houseId: string) => {
    return allHouses.find((h) => h._id === houseId);
  };

  // Filter activities based on member's hierarchy
  console.log('🔍 CURRENT FILTERS:', filters);
  console.log('🙏 TOTAL ACTIVITIES:', activities.length);

  const filteredActivities = activities.filter((activity, index) => {
    if (index === 0) console.log('🙏 SAMPLE ACTIVITY:', activity);

    if (!activity.memberId) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

    const member = getMemberData(activity.memberId);
    if (index === 0) console.log('👤 MEMBER FOR ACTIVITY:', member);

    if (!member) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

    // Extract houseId as string (might be object or string)
    const memberHouseId = typeof member.houseId === 'object' && member.houseId?._id
      ? member.houseId._id
      : member.houseId;

    // Filter by house first (direct comparison)
    if (filters.house && memberHouseId !== filters.house) return false;

    // Check if member has direct hierarchy properties
    if (filters.church && member.churchId && member.churchId !== filters.church) return false;
    if (filters.unit && member.unitId && member.unitId !== filters.unit) return false;
    if (filters.bavanakutayima && member.bavanakutayimaId && member.bavanakutayimaId !== filters.bavanakutayima) return false;

    // If member doesn't have direct hierarchy properties, check through house
    if (!member.churchId || !member.unitId || !member.bavanakutayimaId) {
      if (memberHouseId && (filters.church || filters.unit || filters.bavanakutayima)) {
        const house = getHouseData(memberHouseId);
        if (index === 0) console.log('🏠 HOUSE FOR MEMBER:', house);

        if (!house) return !filters.church && !filters.unit && !filters.bavanakutayima;

        // Filter by bavanakutayima
        if (filters.bavanakutayima && (house as any).bavanakutayimaId !== filters.bavanakutayima) return false;

        // Filter by unit
        if (filters.unit && (house as any).unitId !== filters.unit) return false;

        // Filter by church
        if (filters.church && (house as any).churchId !== filters.church) return false;
      }
    }

    return true;
  });

  console.log('✅ FILTERED ACTIVITIES COUNT:', filteredActivities.length);

  const stats = {
    mass: filteredActivities.filter(a => a.activityType === 'mass').length,
    fasting: filteredActivities.filter(a => a.activityType === 'fasting').length,
    prayer: filteredActivities.filter(a => a.activityType === 'prayer').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Spiritual Activities</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Mass Attendance</p>
                <p className="text-3xl font-bold text-blue-800">{stats.mass}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {activities.filter(a => a.activityType === 'mass').length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Fasting Records</p>
                <p className="text-3xl font-bold text-purple-800">{stats.fasting}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {activities.filter(a => a.activityType === 'fasting').length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Prayer Activities</p>
                <p className="text-3xl font-bold text-green-800">{stats.prayer}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {activities.filter(a => a.activityType === 'prayer').length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SearchableSelect
            label="Church"
            options={churches.map((church) => ({
              value: church._id,
              label: church.name,
            }))}
            value={filters.church}
            onChange={(value) =>
              setFilters({ ...filters, church: value, unit: '', bavanakutayima: '', house: '' })
            }
            placeholder="All Churches"
          />
          <SearchableSelect
            label="Unit"
            options={units.map((unit) => ({
              value: unit._id,
              label: unit.name,
            }))}
            value={filters.unit}
            onChange={(value) =>
              setFilters({ ...filters, unit: value, bavanakutayima: '', house: '' })
            }
            placeholder="All Units"
            disabled={!filters.church}
          />
          <SearchableSelect
            label="Bavanakutayima"
            options={bavanakutayimas.map((bk) => ({
              value: bk._id,
              label: bk.name,
            }))}
            value={filters.bavanakutayima}
            onChange={(value) => setFilters({ ...filters, bavanakutayima: value, house: '' })}
            placeholder="All Bavanakutayimas"
            disabled={!filters.unit}
          />
          <SearchableSelect
            label="House"
            options={houses.map((house) => ({
              value: house._id,
              label: house.familyName,
            }))}
            value={filters.house}
            onChange={(value) => setFilters({ ...filters, house: value })}
            placeholder="All Houses"
            disabled={!filters.bavanakutayima}
          />
        </div>
      </div>

      <DataTable
        data={filteredActivities}
        columns={columns}
        searchPlaceholder="Search activities..."
      />
    </div>
  );
}
